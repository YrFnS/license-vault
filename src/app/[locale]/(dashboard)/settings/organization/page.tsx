'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Palette,
  Network,
  BarChart3,
  CreditCard,
  Save,
  Plus,
  Unlink,
  Eye,
  ArrowUpRight,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRole } from '@/hooks/useRole';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// US States list
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
  'WI','WY','DC',
];

// Trade types
const TRADE_TYPES = [
  'general', 'electrical', 'plumbing', 'hvac', 'roofing', 'concrete',
  'carpentry', 'masonry', 'painting', 'drywall', 'flooring', 'landscaping',
  'excavation', 'welding', 'insulation', 'glass', 'elevator', 'fire_sprinkler',
  'alarm', 'well_drilling', 'solar', 'other',
];

interface OrgSettings {
  id: string;
  name: string;
  tradeType: string;
  primaryState: string;
  logoUrl: string | null;
  primaryColor: string | null;
  companyName: string | null;
  brandingConfig: string | null;
  plan: string;
  parentId: string | null;
  parent: { id: string; name: string; tradeType: string; primaryState: string } | null;
  subsidiaryCount: number;
}

interface SubsidiaryInfo {
  id: string;
  name: string;
  tradeType: string;
  primaryState: string;
  licenseCount: number;
  memberCount: number;
  complianceScore: number;
}

interface HierarchyData {
  currentOrg: {
    id: string;
    name: string;
    tradeType: string;
    primaryState: string;
    licenseCount: number;
    memberCount: number;
    complianceScore: number;
    parentId: string | null;
  };
  parent: { id: string; name: string; tradeType: string; primaryState: string } | null;
  subsidiaries: SubsidiaryInfo[];
  projectCount: number;
  apiCallCount: number;
}

interface CrossComplianceData {
  summary: {
    totalOrgs: number;
    combinedCompliance: number;
    totalLicenses: number;
    atRisk: number;
  };
  organizations: {
    id: string;
    name: string;
    totalLicenses: number;
    activeLicenses: number;
    expiringLicenses: number;
    expiredLicenses: number;
    atRisk: number;
    complianceRate: number;
  }[];
}

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

export default function OrganizationSettingsPage() {
  const t = useTranslations('organization');
  const { canManage, isOwner } = useRole();
  const { data: session } = useSession();

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

  const getComplianceColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getComplianceIcon = (score: number) => {
    if (score >= 80) return <ShieldCheck className="size-4 text-emerald-500" />;
    if (score >= 60) return <ShieldAlert className="size-4 text-amber-500" />;
    return <ShieldAlert className="size-4 text-red-500" />;
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'pro':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">{t('plan.pro')}</Badge>;
      case 'enterprise':
        return <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800">{t('plan.enterprise')}</Badge>;
      default:
        return <Badge variant="secondary">{t('plan.free')}</Badge>;
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const hasSubsidiaries = (hierarchy?.subsidiaries.length ?? 0) > 0;

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Page header */}
      <motion.div {...fadeIn}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
            <Building2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
          </div>
        </div>
      </motion.div>

      {/* Section 1: Organization Profile */}
      <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle>{t('profile.title')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">{t('profile.name')}</Label>
                <Input
                  id="org-name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  disabled={!canManage}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-name">{t('profile.companyName')}</Label>
                <Input
                  id="company-name"
                  value={profileForm.companyName}
                  onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                  disabled={!canManage}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trade-type">{t('profile.tradeType')}</Label>
                <Select
                  value={profileForm.tradeType}
                  onValueChange={(v) => setProfileForm({ ...profileForm, tradeType: v })}
                  disabled={!canManage}
                >
                  <SelectTrigger id="trade-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary-state">{t('profile.primaryState')}</Label>
                <Select
                  value={profileForm.primaryState}
                  onValueChange={(v) => setProfileForm({ ...profileForm, primaryState: v })}
                  disabled={!canManage}
                >
                  <SelectTrigger id="primary-state">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {canManage && (
              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                {savingProfile ? (
                  <><Loader2 className="size-4 animate-spin me-2" />{t('profile.saving')}</>
                ) : (
                  <><Save className="size-4 me-2" />{t('profile.save')}</>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 2: Branding & Customization */}
      <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="size-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle>{t('branding.title')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Branding form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo-url">{t('branding.logoUrl')}</Label>
                  <Input
                    id="logo-url"
                    value={brandingForm.logoUrl}
                    onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    disabled={!canManage}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary-color">{t('branding.primaryColor')}</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="primary-color"
                      value={brandingForm.primaryColor}
                      onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                      disabled={!canManage}
                      className="size-10 rounded-lg border border-border cursor-pointer disabled:opacity-50"
                    />
                    <Input
                      value={brandingForm.primaryColor}
                      onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                      disabled={!canManage}
                      className="flex-1 font-mono"
                    />
                    <div
                      className="size-10 rounded-lg border border-border shrink-0"
                      style={{ backgroundColor: brandingForm.primaryColor }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-message">{t('branding.loginMessage')}</Label>
                  <Textarea
                    id="login-message"
                    value={brandingForm.loginMessage}
                    onChange={(e) => setBrandingForm({ ...brandingForm, loginMessage: e.target.value })}
                    placeholder={t('branding.loginMessagePlaceholder')}
                    rows={3}
                    disabled={!canManage}
                  />
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveBranding}
                      disabled={savingBranding}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      {savingBranding ? (
                        <><Loader2 className="size-4 animate-spin me-2" />{t('profile.saving')}</>
                      ) : (
                        <><Save className="size-4 me-2" />{t('branding.save')}</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setBrandingForm({ logoUrl: '', primaryColor: '#10b981', loginMessage: '' })}
                    >
                      {t('branding.resetToDefault')}
                    </Button>
                  </div>
                )}
              </div>

              {/* Branding preview */}
              <div className="space-y-2">
                <Label>{t('branding.preview')}</Label>
                <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                  {/* Preview header with custom color */}
                  <div
                    className="p-4 text-white"
                    style={{ backgroundColor: brandingForm.primaryColor }}
                  >
                    <div className="flex items-center gap-3">
                      {brandingForm.logoUrl ? (
                        <img
                          src={brandingForm.logoUrl}
                          alt="Logo"
                          className="size-8 rounded bg-white/20 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="size-8 rounded bg-white/20 flex items-center justify-center">
                          <Shield className="size-4" />
                        </div>
                      )}
                      <span className="font-bold">{orgSettings?.name || 'Organization'}</span>
                    </div>
                  </div>
                  {/* Preview login form */}
                  <div className="p-6 bg-card space-y-4">
                    {brandingForm.loginMessage && (
                      <p className="text-sm text-muted-foreground italic">
                        &ldquo;{brandingForm.loginMessage}&rdquo;
                      </p>
                    )}
                    <div className="space-y-2">
                      <div className="h-8 rounded bg-muted/50 border border-border/50" />
                      <div className="h-8 rounded bg-muted/50 border border-border/50" />
                      <div
                        className="h-9 rounded text-white text-center flex items-center justify-center text-sm font-medium"
                        style={{ backgroundColor: brandingForm.primaryColor }}
                      >
                        Sign In
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 3: Organization Hierarchy (owner only) */}
      {isOwner && (
        <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <CardTitle>{t('hierarchy.title')}</CardTitle>
                </div>
                <Dialog open={subsidiaryDialog} onOpenChange={setSubsidiaryDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                    >
                      <Plus className="size-4 me-1" />
                      {t('hierarchy.addSubsidiary')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('hierarchy.addSubsidiary')}</DialogTitle>
                      <DialogDescription>
                        Create a new subsidiary organization under your current org.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label>{t('profile.name')}</Label>
                        <Input
                          value={subsidiaryForm.name}
                          onChange={(e) => setSubsidiaryForm({ ...subsidiaryForm, name: e.target.value })}
                          placeholder="Subsidiary name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('profile.tradeType')}</Label>
                        <Select
                          value={subsidiaryForm.tradeType}
                          onValueChange={(v) => setSubsidiaryForm({ ...subsidiaryForm, tradeType: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TRADE_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('profile.primaryState')}</Label>
                        <Select
                          value={subsidiaryForm.primaryState}
                          onValueChange={(v) => setSubsidiaryForm({ ...subsidiaryForm, primaryState: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('profile.companyName')}</Label>
                        <Input
                          value={subsidiaryForm.companyName}
                          onChange={(e) => setSubsidiaryForm({ ...subsidiaryForm, companyName: e.target.value })}
                          placeholder="Legal company name (optional)"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSubsidiaryDialog(false)}>
                        {t('profile.save') === 'Save Profile' ? 'Cancel' : 'إلغاء'}
                      </Button>
                      <Button
                        onClick={handleCreateSubsidiary}
                        disabled={creatingSubsidiary || !subsidiaryForm.name || !subsidiaryForm.tradeType || !subsidiaryForm.primaryState}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                      >
                        {creatingSubsidiary ? (
                          <><Loader2 className="size-4 animate-spin me-2" />Creating...</>
                        ) : (
                          <><Plus className="size-4 me-2" />Create</>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Visual tree */}
              <div className="space-y-4">
                {/* Parent org (if exists) */}
                {hierarchy?.parent && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{t('hierarchy.parentOrg')}</p>
                    <Card className="border-dashed border-emerald-300 dark:border-emerald-800">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <Building2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-medium">{hierarchy.parent.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {hierarchy.parent.tradeType} · {hierarchy.parent.primaryState}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {/* Connector line */}
                    <div className="flex justify-center">
                      <div className="w-px h-6 bg-border" />
                    </div>
                  </div>
                )}

                {/* Current org */}
                {hierarchy?.currentOrg && (
                  <Card className="border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
                            <Building2 className="size-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{hierarchy.currentOrg.name}</p>
                              <Badge variant="secondary" className="text-[10px]">Current</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {hierarchy.currentOrg.tradeType} · {hierarchy.currentOrg.primaryState}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <p className="font-bold">{hierarchy.currentOrg.licenseCount}</p>
                            <p className="text-[10px] text-muted-foreground">{t('hierarchy.licenseCount')}</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold">{hierarchy.currentOrg.memberCount}</p>
                            <p className="text-[10px] text-muted-foreground">{t('hierarchy.memberCount')}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1">
                              {getComplianceIcon(hierarchy.currentOrg.complianceScore)}
                              <p className="font-bold">{hierarchy.currentOrg.complianceScore}%</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{t('hierarchy.complianceScore')}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Connector line to subsidiaries */}
                {hasSubsidiaries && (
                  <div className="flex justify-center">
                    <div className="w-px h-6 bg-border" />
                  </div>
                )}

                {/* Subsidiaries */}
                {hasSubsidiaries && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('hierarchy.subsidiaries')} ({hierarchy!.subsidiaries.length})
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {hierarchy!.subsidiaries.map((sub) => (
                        <Card
                          key={sub.id}
                          className="shadow-sm hover:shadow-md transition-all duration-200 group"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                  <Building2 className="size-4 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{sub.name}</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {sub.tradeType} · {sub.primaryState}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-emerald-600">
                                  <Eye className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-muted-foreground hover:text-red-600"
                                  onClick={() => setUnlinkTarget(sub)}
                                >
                                  <Unlink className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-xs">
                              <div className="flex items-center gap-1">
                                <FileText className="size-3 text-muted-foreground" />
                                <span>{sub.licenseCount} {t('hierarchy.licenseCount')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="size-3 text-muted-foreground" />
                                <span>{sub.memberCount} {t('hierarchy.memberCount')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {getComplianceIcon(sub.complianceScore)}
                                <span>{sub.complianceScore}% {t('hierarchy.complianceScore')}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty subsidiaries state */}
                {!hasSubsidiaries && (
                  <div className="text-center py-8">
                    <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <Network className="size-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-muted-foreground">{t('hierarchy.noSubsidiaries')}</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">{t('hierarchy.noSubsidiariesDesc')}</p>
                    <Button
                      size="sm"
                      className="mt-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                      onClick={() => setSubsidiaryDialog(true)}
                    >
                      <Plus className="size-4 me-1" />
                      {t('hierarchy.addSubsidiary')}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Section 4: Cross-Organization Compliance (owner only, only if has subsidiaries) */}
      {isOwner && hasSubsidiaries && crossCompliance && (
        <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="size-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle>{t('crossCompliance.title')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: t('crossCompliance.totalOrgs'), value: crossCompliance.summary.totalOrgs, icon: Building2, color: 'emerald' },
                  { label: t('crossCompliance.combinedCompliance'), value: `${crossCompliance.summary.combinedCompliance}%`, icon: ShieldCheck, color: 'teal' },
                  { label: t('crossCompliance.totalLicenses'), value: crossCompliance.summary.totalLicenses, icon: FileText, color: 'emerald' },
                  { label: t('crossCompliance.atRisk'), value: crossCompliance.summary.atRisk, icon: AlertTriangle, color: 'red' },
                ].map((stat) => {
                  const Icon = stat.icon;
                  const colorMap: Record<string, string> = {
                    emerald: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200/50 dark:border-emerald-800/30',
                    teal: 'from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-teal-200/50 dark:border-teal-800/30',
                    red: 'from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200/50 dark:border-red-800/30',
                  };
                  const iconColorMap: Record<string, string> = {
                    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
                    teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
                    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                  };
                  return (
                    <div
                      key={stat.label}
                      className={`rounded-xl border p-4 bg-gradient-to-br ${colorMap[stat.color]}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`size-7 rounded-lg flex items-center justify-center ${iconColorMap[stat.color]}`}>
                          <Icon className="size-3.5" />
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold tabular-nums">{stat.value}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Bar chart */}
              {crossCompliance.organizations.length > 0 && (
                <div className="rounded-xl border border-border/50 p-4">
                  <p className="text-sm font-medium mb-4">Compliance by Organization</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={crossCompliance.organizations} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                          tickFormatter={(v: number) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(value: number) => [`${value}%`, 'Compliance']}
                        />
                        <Bar dataKey="complianceRate" radius={[6, 6, 0, 0]}>
                          {crossCompliance.organizations.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getComplianceColor(entry.complianceRate)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Comparison table */}
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-start p-3 font-medium">{t('crossCompliance.orgName')}</th>
                        <th className="text-center p-3 font-medium">{t('hierarchy.licenseCount')}</th>
                        <th className="text-center p-3 font-medium">{t('crossCompliance.compliancePercent')}</th>
                        <th className="text-center p-3 font-medium">{t('crossCompliance.activeLicenses')}</th>
                        <th className="text-center p-3 font-medium">{t('crossCompliance.expiringLicenses')}</th>
                        <th className="text-center p-3 font-medium">{t('crossCompliance.expiredLicenses')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crossCompliance.organizations.map((org) => (
                        <tr key={org.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="size-4 text-muted-foreground" />
                              <span className="font-medium">{org.name}</span>
                            </div>
                          </td>
                          <td className="text-center p-3 tabular-nums">{org.totalLicenses}</td>
                          <td className="text-center p-3">
                            <div className="flex items-center justify-center gap-1">
                              <div
                                className="size-2 rounded-full"
                                style={{ backgroundColor: getComplianceColor(org.complianceRate) }}
                              />
                              <span className="tabular-nums font-medium">{org.complianceRate}%</span>
                            </div>
                          </td>
                          <td className="text-center p-3 tabular-nums text-emerald-600 dark:text-emerald-400">{org.activeLicenses}</td>
                          <td className="text-center p-3 tabular-nums text-amber-600 dark:text-amber-400">{org.expiringLicenses}</td>
                          <td className="text-center p-3 tabular-nums text-red-600 dark:text-red-400">{org.expiredLicenses}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Section 5: Plan & Billing Info */}
      <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="size-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle>{t('plan.title')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current plan */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/60 to-muted/30 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                    <Shield className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{t('plan.currentPlan')}</p>
                      {getPlanBadge(orgSettings?.plan || 'free')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {orgSettings?.plan === 'pro' ? '$29/month' : orgSettings?.plan === 'enterprise' ? 'Custom pricing' : '$0/month'}
                    </p>
                  </div>
                </div>
                {orgSettings?.plan !== 'enterprise' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  >
                    <ArrowUpRight className="size-4 me-1" />
                    {t('plan.upgrade')}
                  </Button>
                )}
              </div>

              {/* Feature usage stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: t('plan.licensesUsed'), value: hierarchy?.currentOrg.licenseCount ?? 0, max: orgSettings?.plan === 'free' ? 25 : '∞' },
                  { label: t('plan.teamMembers'), value: hierarchy?.currentOrg.memberCount ?? 0, max: orgSettings?.plan === 'free' ? 5 : '∞' },
                  { label: t('plan.projects'), value: hierarchy?.projectCount ?? 0, max: orgSettings?.plan === 'free' ? 3 : '∞' },
                  { label: t('plan.apiCalls'), value: hierarchy?.apiCallCount ?? 0, max: orgSettings?.plan === 'free' ? '100/mo' : '∞' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-border/50 p-3 bg-muted/20">
                    <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                        style={{
                          width: typeof stat.max === 'number' && stat.max > 0
                            ? `${Math.min((stat.value / stat.max) * 100, 100)}%`
                            : '0%',
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      of {stat.max} limit
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Unlink confirmation dialog */}
      <AlertDialog open={!!unlinkTarget} onOpenChange={(open) => !open && setUnlinkTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('hierarchy.unlinkConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('hierarchy.unlinkWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('profile.save') === 'Save Profile' ? 'Cancel' : 'إلغاء'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkSubsidiary}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t('hierarchy.unlink')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
