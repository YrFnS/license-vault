'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRole } from '@/hooks/useRole';
import { toast } from 'sonner';
import type { OrgSettings, HierarchyData, CrossComplianceData, SubsidiaryInfo } from './types';

export interface OrganizationSettingsState {
  orgSettings: OrgSettings | null;
  hierarchy: HierarchyData | null;
  crossCompliance: CrossComplianceData | null;
  loading: boolean;
  savingProfile: boolean;
  savingBranding: boolean;
  profileForm: {
    name: string;
    tradeType: string;
    primaryState: string;
    companyName: string;
  };
  brandingForm: {
    logoUrl: string;
    primaryColor: string;
    loginMessage: string;
  };
  subsidiaryDialog: boolean;
  subsidiaryForm: {
    name: string;
    tradeType: string;
    primaryState: string;
    companyName: string;
  };
  creatingSubsidiary: boolean;
  unlinkTarget: SubsidiaryInfo | null;
  setProfileForm: React.Dispatch<React.SetStateAction<OrganizationSettingsState['profileForm']>>;
  setBrandingForm: React.Dispatch<React.SetStateAction<OrganizationSettingsState['brandingForm']>>;
  setSubsidiaryDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setSubsidiaryForm: React.Dispatch<React.SetStateAction<OrganizationSettingsState['subsidiaryForm']>>;
  setUnlinkTarget: React.Dispatch<React.SetStateAction<SubsidiaryInfo | null>>;
  handleSaveProfile: () => Promise<void>;
  handleSaveBranding: () => Promise<void>;
  handleCreateSubsidiary: () => Promise<void>;
  handleUnlinkSubsidiary: () => Promise<void>;
  canManage: boolean;
  isOwner: boolean;
}

export function useOrganizationSettings(): OrganizationSettingsState {
  const t = useTranslations('organization');
  const { canManage, isOwner } = useRole();

  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
  const [hierarchy, setHierarchy] = useState<HierarchyData | null>(null);
  const [crossCompliance, setCrossCompliance] = useState<CrossComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    tradeType: '',
    primaryState: '',
    companyName: '',
  });

  // Branding form state
  const [brandingForm, setBrandingForm] = useState({
    logoUrl: '',
    primaryColor: '#10b981',
    loginMessage: '',
  });

  // Add subsidiary dialog state
  const [subsidiaryDialog, setSubsidiaryDialog] = useState(false);
  const [subsidiaryForm, setSubsidiaryForm] = useState({
    name: '',
    tradeType: '',
    primaryState: '',
    companyName: '',
  });
  const [creatingSubsidiary, setCreatingSubsidiary] = useState(false);

  // Unlink confirmation
  const [unlinkTarget, setUnlinkTarget] = useState<SubsidiaryInfo | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/org/settings');
      if (res.ok) {
        const data = await res.json();
        setOrgSettings(data);
        setProfileForm({
          name: data.name || '',
          tradeType: data.tradeType || '',
          primaryState: data.primaryState || '',
          companyName: data.companyName || '',
        });
        setBrandingForm({
          logoUrl: data.logoUrl || '',
          primaryColor: data.primaryColor || '#10b981',
          loginMessage: data.brandingConfig ? JSON.parse(data.brandingConfig).loginMessage || '' : '',
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  const fetchHierarchy = useCallback(async () => {
    if (!isOwner) return;
    try {
      const res = await fetch('/api/org/hierarchy');
      if (res.ok) {
        const data = await res.json();
        setHierarchy(data);
      }
    } catch (err) {
      console.error('Error fetching hierarchy:', err);
    }
  }, [isOwner]);

  const fetchCrossCompliance = useCallback(async () => {
    if (!isOwner) return;
    try {
      const res = await fetch('/api/org/cross-compliance');
      if (res.ok) {
        const data = await res.json();
        setCrossCompliance(data);
      }
    } catch (err) {
      console.error('Error fetching cross-compliance:', err);
    }
  }, [isOwner]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchSettings(), fetchHierarchy(), fetchCrossCompliance()]);
      setLoading(false);
    };
    load();
  }, [fetchSettings, fetchHierarchy, fetchCrossCompliance]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/org/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      if (res.ok) {
        toast.success(t('profile.saved'));
        fetchSettings();
      } else {
        toast.error('Failed to save profile');
      }
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      const brandingConfig = JSON.stringify({
        customLogo: brandingForm.logoUrl || undefined,
        customColors: { primary: brandingForm.primaryColor },
        loginMessage: brandingForm.loginMessage || undefined,
      });
      const res = await fetch('/api/org/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl: brandingForm.logoUrl || '',
          primaryColor: brandingForm.primaryColor,
          brandingConfig,
        }),
      });
      if (res.ok) {
        toast.success(t('branding.saved'));
        fetchSettings();
      } else {
        toast.error('Failed to save branding');
      }
    } catch {
      toast.error('Failed to save branding');
    } finally {
      setSavingBranding(false);
    }
  };

  const handleCreateSubsidiary = async () => {
    setCreatingSubsidiary(true);
    try {
      const res = await fetch('/api/org/subsidiary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subsidiaryForm),
      });
      if (res.ok) {
        toast.success(t('hierarchy.subsidiaryCreated'));
        setSubsidiaryDialog(false);
        setSubsidiaryForm({ name: '', tradeType: '', primaryState: '', companyName: '' });
        fetchHierarchy();
        fetchCrossCompliance();
        fetchSettings();
      } else {
        toast.error('Failed to create subsidiary');
      }
    } catch {
      toast.error('Failed to create subsidiary');
    } finally {
      setCreatingSubsidiary(false);
    }
  };

  const handleUnlinkSubsidiary = async () => {
    if (!unlinkTarget) return;
    try {
      const res = await fetch(`/api/org/subsidiary/${unlinkTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success(t('hierarchy.subsidiaryUnlinked'));
        setUnlinkTarget(null);
        fetchHierarchy();
        fetchCrossCompliance();
        fetchSettings();
      } else {
        toast.error('Failed to unlink subsidiary');
      }
    } catch {
      toast.error('Failed to unlink subsidiary');
    }
  };

  return {
    orgSettings,
    hierarchy,
    crossCompliance,
    loading,
    savingProfile,
    savingBranding,
    profileForm,
    brandingForm,
    subsidiaryDialog,
    subsidiaryForm,
    creatingSubsidiary,
    unlinkTarget,
    setProfileForm,
    setBrandingForm,
    setSubsidiaryDialog,
    setSubsidiaryForm,
    setUnlinkTarget,
    handleSaveProfile,
    handleSaveBranding,
    handleCreateSubsidiary,
    handleUnlinkSubsidiary,
    canManage,
    isOwner,
  };
}
