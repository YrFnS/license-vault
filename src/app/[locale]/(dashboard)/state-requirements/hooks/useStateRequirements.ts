import { useState, useEffect, useCallback } from 'react';
import type { StateRequirementData } from '../types';

export function useStateRequirements() {
  const [requirements, setRequirements] = useState<StateRequirementData[]>([]);
  const [allRequirements, setAllRequirements] = useState<StateRequirementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [licenseTypeFilter, setLicenseTypeFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [primaryState, setPrimaryState] = useState<string>('');

  // Wizard state
  const [wizardState, setWizardState] = useState<string>('');
  const [wizardType, setWizardType] = useState<string>('');
  const [wizardResult, setWizardResult] = useState<StateRequirementData | null>(null);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardSubmitted, setWizardSubmitted] = useState(false);

  const fetchRequirements = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (stateFilter && stateFilter !== 'all') params.set('state', stateFilter);
      if (licenseTypeFilter && licenseTypeFilter !== 'all') params.set('licenseType', licenseTypeFilter);

      const res = await fetch(`/api/state-requirements?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRequirements(data.requirements);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [stateFilter, licenseTypeFilter]);

  const fetchAllRequirements = useCallback(async () => {
    try {
      const res = await fetch('/api/state-requirements');
      if (res.ok) {
        const data = await res.json();
        setAllRequirements(data.requirements);
      }
    } catch {
      // silently fail
    }
  }, []);

  const fetchPrimaryState = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.organization?.primaryState) {
          setPrimaryState(data.organization.primaryState);
        }
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchAllRequirements();
    fetchPrimaryState();
  }, [fetchAllRequirements, fetchPrimaryState]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  const handleWizardCheck = async () => {
    if (!wizardState || !wizardType) return;
    setWizardLoading(true);
    setWizardResult(null);
    setWizardSubmitted(true);
    try {
      const res = await fetch(`/api/state-requirements?state=${wizardState}&licenseType=${wizardType}`);
      if (res.ok) {
        const data = await res.json();
        if (data.requirements && data.requirements.length > 0) {
          setWizardResult(data.requirements[0]);
        } else {
          setWizardResult(null);
        }
      }
    } catch {
      // silently fail
    } finally {
      setWizardLoading(false);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const primaryStateRequirements = allRequirements.filter(
    (r) => r.state === primaryState
  );

  return {
    requirements,
    allRequirements,
    loading,
    stateFilter,
    setStateFilter,
    licenseTypeFilter,
    setLicenseTypeFilter,
    expandedRows,
    toggleRow,
    primaryState,
    primaryStateRequirements,
    wizardState,
    setWizardState,
    wizardType,
    setWizardType,
    wizardResult,
    wizardLoading,
    wizardSubmitted,
    handleWizardCheck,
  };
}
