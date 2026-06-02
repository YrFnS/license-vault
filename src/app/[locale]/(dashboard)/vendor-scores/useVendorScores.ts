import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { VendorScoreData, AssessmentResult, VendorFormData } from './types';
import { DEFAULT_FORM_DATA } from './types';

interface VendorStats {
  totalVendors: number;
  avgScore: number;
  highRiskCount: number;
  flaggedCount: number;
}

interface UseVendorScoresReturn {
  vendors: VendorScoreData[];
  stats: VendorStats;
  riskDistribution: Record<string, number>;
  scoreDistribution: Record<string, number>;
  loading: boolean;
  subcontractors: { id: string; companyName: string }[];
  assessmentResult: AssessmentResult | null;
  assessing: boolean;
  bulkAssessing: boolean;
  selectedVendor: VendorScoreData | null;
  form: VendorFormData;
  createOpen: boolean;
  assessOpen: boolean;
  flagOpen: boolean;
  flagReason: string;
  setForm: (updater: VendorFormData | ((prev: VendorFormData) => VendorFormData)) => void;
  setCreateOpen: (open: boolean) => void;
  setAssessOpen: (open: boolean) => void;
  setFlagOpen: (open: boolean) => void;
  setFlagReason: (reason: string) => void;
  setSelectedVendor: (vendor: VendorScoreData | null) => void;
  fetchData: () => Promise<void>;
  handleCreate: () => Promise<void>;
  handleAssess: (vendorId: string) => Promise<void>;
  handleBulkAssess: () => Promise<void>;
  handleFlag: () => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
}

export function useVendorScores(): UseVendorScoresReturn {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<VendorScoreData[]>([]);
  const [stats, setStats] = useState<VendorStats>({ totalVendors: 0, avgScore: 0, highRiskCount: 0, flaggedCount: 0 });
  const [riskDistribution, setRiskDistribution] = useState({ critical: 0, high: 0, medium: 0, low: 0 });
  const [scoreDistribution, setScoreDistribution] = useState({ '0-25': 0, '25-50': 0, '50-75': 0, '75-100': 0 });
  const [loading, setLoading] = useState(true);
  const [subcontractors, setSubcontractors] = useState<{ id: string; companyName: string }[]>([]);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [assessing, setAssessing] = useState(false);
  const [bulkAssessing, setBulkAssessing] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorScoreData | null>(null);
  const [form, setForm] = useState<VendorFormData>(DEFAULT_FORM_DATA);
  const [createOpen, setCreateOpen] = useState(false);
  const [assessOpen, setAssessOpen] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vendor-scores');
      const data = await res.json();
      setVendors(data.vendors || []);
      setStats(data.stats || { totalVendors: 0, avgScore: 0, highRiskCount: 0, flaggedCount: 0 });
      setRiskDistribution(data.riskDistribution || { critical: 0, high: 0, medium: 0, low: 0 });
      setScoreDistribution(data.scoreDistribution || { '0-25': 0, '25-50': 0, '50-75': 0, '75-100': 0 });
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch vendor scores', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchSubcontractors = useCallback(async () => {
    try {
      const res = await fetch('/api/subcontractors');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSubcontractors(data.map((s: { id: string; companyName: string }) => ({ id: s.id, companyName: s.companyName })));
      } else if (data.subcontractors) {
        setSubcontractors(data.subcontractors.map((s: { id: string; companyName: string }) => ({ id: s.id, companyName: s.companyName })));
      }
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => { fetchData(); fetchSubcontractors(); }, [fetchData, fetchSubcontractors]);

  const handleCreate = useCallback(async () => {
    try {
      const res = await fetch('/api/vendor-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, autoAssess: true }),
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Vendor created' });
      setCreateOpen(false);
      setForm(DEFAULT_FORM_DATA);
      fetchData();
    } catch { toast({ title: 'Failed to create vendor', variant: 'destructive' }); }
  }, [form, toast, fetchData]);

  const handleAssess = useCallback(async (vendorId: string) => {
    try {
      setAssessing(true);
      const res = await fetch(`/api/vendor-scores/${vendorId}/assess`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAssessmentResult(data);
      setAssessOpen(true);
      fetchData();
    } catch { toast({ title: 'Failed to run assessment', variant: 'destructive' }); }
    finally { setAssessing(false); }
  }, [toast, fetchData]);

  const handleBulkAssess = useCallback(async () => {
    try {
      setBulkAssessing(true);
      const res = await fetch('/api/vendor-scores/bulk-assess', { method: 'POST' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast({ title: 'Bulk assessment complete', description: `${data.assessed} vendors assessed` });
      fetchData();
    } catch { toast({ title: 'Bulk assessment failed', variant: 'destructive' }); }
    finally { setBulkAssessing(false); }
  }, [toast, fetchData]);

  const handleFlag = useCallback(async () => {
    if (!selectedVendor) return;
    try {
      await fetch(`/api/vendor-scores/${selectedVendor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFlagged: !selectedVendor.isFlagged, flagReason: !selectedVendor.isFlagged ? flagReason : null }),
      });
      toast({ title: selectedVendor.isFlagged ? 'Vendor unflagged' : 'Vendor flagged' });
      setFlagOpen(false); setFlagReason(''); fetchData();
    } catch { toast({ title: 'Failed to update flag', variant: 'destructive' }); }
  }, [selectedVendor, flagReason, toast, fetchData]);

  const handleDelete = useCallback(async (id: string) => {
    try { await fetch(`/api/vendor-scores/${id}`, { method: 'DELETE' }); toast({ title: 'Vendor deleted' }); fetchData(); }
    catch { toast({ title: 'Failed to delete vendor', variant: 'destructive' }); }
  }, [toast, fetchData]);

  return {
    vendors, stats, riskDistribution, scoreDistribution, loading, subcontractors,
    assessmentResult, assessing, bulkAssessing, selectedVendor, form,
    createOpen, assessOpen, flagOpen, flagReason,
    setForm, setCreateOpen, setAssessOpen, setFlagOpen, setFlagReason, setSelectedVendor,
    fetchData, handleCreate, handleAssess, handleBulkAssess, handleFlag, handleDelete,
  };
}
