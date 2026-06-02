'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Plus, RefreshCw, ClipboardCheck, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { InsuranceRecord, InsuranceSummary, FilterTab, FormData } from './components/types';
import { emptyForm } from './components/types';
import { parseEndorsementTypes } from './components/utils';
import InsuranceSummaryCards from './components/InsuranceSummaryCards';
import InsuranceFilterBar from './components/InsuranceFilterBar';
import { InsuranceDesktopTable, InsuranceMediumTable } from './components/InsuranceTable';
import InsuranceMobileCards from './components/InsuranceMobileCards';
import InsuranceFormDialog from './components/InsuranceFormDialog';
import DeleteInsuranceDialog from './components/DeleteInsuranceDialog';

export default function InsurancePage() {
  const t = useTranslations('insurance');
  const { toast } = useToast();
  const [records, setRecords] = useState<InsuranceRecord[]>([]);
  const [summary, setSummary] = useState<InsuranceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InsuranceRecord | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (['insurance', 'bond', 'certificate'].includes(activeFilter)) params.set('type', activeFilter);
      else if (['active', 'expiring', 'expired'].includes(activeFilter)) params.set('status', activeFilter);
      else if (['compliant', 'deficient'].includes(activeFilter)) params.set('compliance', activeFilter);
      const res = await fetch(`/api/insurance?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRecords(data.records || []);
      setSummary(data.summary || null);
    } catch { toast({ title: 'Error', description: 'Failed to load insurance records', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [activeFilter, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredRecords = records.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.policyNumber.toLowerCase().includes(q) ||
      r.provider.toLowerCase().includes(q) || (r.holderName?.toLowerCase().includes(q));
  });

  const handleOpenAdd = () => { setEditingRecord(null); setFormData(emptyForm); setShowRequirements(false); setDialogOpen(true); };

  const handleOpenEdit = (record: InsuranceRecord) => {
    setEditingRecord(record);
    setFormData({
      name: record.name, type: record.type, policyNumber: record.policyNumber, provider: record.provider,
      coverageAmount: record.coverageAmount.toString(), premiumAmount: record.premiumAmount.toString(),
      issueDate: new Date(record.issueDate).toISOString().split('T')[0],
      expirationDate: new Date(record.expirationDate).toISOString().split('T')[0],
      holderName: record.holderName || '', notes: record.notes || '', autoRenew: record.autoRenew,
      additionalInsured: record.additionalInsured, primaryNoncontrib: record.primaryNoncontrib,
      waiverSubrogation: record.waiverSubrogation,
      perOccurrenceLimit: record.perOccurrenceLimit?.toString() || '',
      aggregateLimit: record.aggregateLimit?.toString() || '', deductible: record.deductible?.toString() || '',
      endorsementTypes: parseEndorsementTypes(record.endorsementTypes),
      requiredCoverage: record.requiredCoverage?.toString() || '',
      requiredPerOccurrence: record.requiredPerOccurrence?.toString() || '',
      requiredAggregate: record.requiredAggregate?.toString() || '',
      requiredEndorsements: parseEndorsementTypes(record.requiredEndorsements),
    });
    setShowRequirements(record.requiredCoverage > 0 || record.requiredPerOccurrence > 0 || record.requiredAggregate > 0);
    setDialogOpen(true);
  };

  const buildPayload = () => ({
    name: formData.name, type: formData.type, policyNumber: formData.policyNumber, provider: formData.provider,
    coverageAmount: parseFloat(formData.coverageAmount) || 0, premiumAmount: parseFloat(formData.premiumAmount) || 0,
    issueDate: formData.issueDate, expirationDate: formData.expirationDate,
    holderName: formData.holderName || null, notes: formData.notes || null, autoRenew: formData.autoRenew,
    additionalInsured: formData.additionalInsured, primaryNoncontrib: formData.primaryNoncontrib,
    waiverSubrogation: formData.waiverSubrogation,
    perOccurrenceLimit: parseFloat(formData.perOccurrenceLimit) || 0,
    aggregateLimit: parseFloat(formData.aggregateLimit) || 0,
    deductible: parseFloat(formData.deductible) || 0,
    endorsementTypes: formData.endorsementTypes,
    requiredCoverage: parseFloat(formData.requiredCoverage) || 0,
    requiredPerOccurrence: parseFloat(formData.requiredPerOccurrence) || 0,
    requiredAggregate: parseFloat(formData.requiredAggregate) || 0,
    requiredEndorsements: formData.requiredEndorsements,
  });

  const handleSave = async () => {
    if (!formData.name || !formData.policyNumber || !formData.provider || !formData.issueDate || !formData.expirationDate) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const url = editingRecord ? `/api/insurance/${editingRecord.id}` : '/api/insurance';
      const method = editingRecord ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload()) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to save'); }
      toast({ title: t('saveSuccess') }); setDialogOpen(false); fetchData();
    } catch (err: any) { toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/insurance/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: t('deleteSuccess') }); setDeleteId(null); fetchData();
    } catch { toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' }); }
    finally { setDeleting(false); }
  };

  const handleVerifyAll = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/insurance/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Failed to verify');
      const data = await res.json();
      toast({ title: t('verificationComplete'),
        description: `Compliant: ${data.results.compliant} | Deficient: ${data.results.deficient} | Expired: ${data.results.expired} | Pending: ${data.results.pending}` });
      fetchData();
    } catch { toast({ title: 'Error', description: 'Failed to verify compliance', variant: 'destructive' }); }
    finally { setVerifying(false); }
  };

  const toggleEndorsement = (value: string, field: 'endorsementTypes' | 'requiredEndorsements') => {
    const current = formData[field];
    setFormData({ ...formData, [field]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] });
  };

  return (
    <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleVerifyAll} disabled={verifying}
            className="hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-700">
            {verifying ? <RefreshCw className="size-4 me-2 animate-spin" /> : <ClipboardCheck className="size-4 me-2" />}
            {t('verifyCompliance')}
          </Button>
          <Button onClick={handleOpenAdd} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02]">
            <Plus className="size-4 me-2" />{t('addPolicy')}
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      {summary && <InsuranceSummaryCards summary={summary} t={t} />}

      {/* Filter Tabs & Search */}
      <InsuranceFilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} searchQuery={searchQuery} onSearchChange={setSearchQuery} t={t} />

      {/* Content */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
        {loading ? (
          <div className="grid gap-4">{[1, 2, 3].map((i) => (<Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-4 bg-muted rounded w-1/3 mb-3" /><div className="h-3 bg-muted rounded w-1/2 mb-2" /><div className="h-3 bg-muted rounded w-2/3" /></CardContent></Card>))}</div>
        ) : filteredRecords.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 p-6 ring-1 ring-border/20"><Shield className="size-12 text-muted-foreground/60" /></div>
                <div className="absolute -bottom-1 -end-1 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 p-1.5 ring-2 ring-background">
                  <Plus className="size-3 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground">{t('noPolicies')}</h3>
              <p className="text-sm text-muted-foreground/70 mt-1 mb-4 max-w-sm">{t('noPoliciesDesc')}</p>
              <Button onClick={handleOpenAdd} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/20">
                <Plus className="size-4 me-2" />{t('addPolicy')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <InsuranceDesktopTable records={filteredRecords} onEdit={handleOpenEdit} onDelete={setDeleteId} t={t} />
            <InsuranceMediumTable records={filteredRecords} onEdit={handleOpenEdit} onDelete={setDeleteId} t={t} />
            <InsuranceMobileCards records={filteredRecords} onEdit={handleOpenEdit} onDelete={setDeleteId} t={t} />
          </>
        )}
      </motion.div>

      <InsuranceFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editingRecord={editingRecord} formData={formData} setFormData={setFormData} showRequirements={showRequirements} setShowRequirements={setShowRequirements} saving={saving} onSave={handleSave} toggleEndorsement={toggleEndorsement} t={t} />

      <DeleteInsuranceDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)} deleting={deleting} onDelete={handleDelete} t={t} />
    </motion.div>
  );
}
