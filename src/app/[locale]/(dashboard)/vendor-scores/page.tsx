'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { StatsCards } from './components/StatsCards';
import { Charts } from './components/Charts';
import { VendorList } from './components/VendorList';
import { CreateVendorDialog } from './components/CreateVendorDialog';
import { AssessmentDialog } from './components/AssessmentDialog';
import { FlagVendorDialog } from './components/FlagVendorDialog';
import { useVendorScores } from './useVendorScores';

const FILTER_TABS = ['all', 'low', 'medium', 'high', 'critical', 'flagged'] as const;

export default function VendorScoresPage() {
  const t = useTranslations('vendorScores');
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const {
    vendors, stats, riskDistribution, scoreDistribution, loading, subcontractors,
    assessmentResult, assessing, bulkAssessing, selectedVendor, form,
    createOpen, assessOpen, flagOpen, flagReason,
    setForm, setCreateOpen, setAssessOpen, setFlagOpen, setFlagReason, setSelectedVendor,
    handleCreate, handleAssess, handleBulkAssess, handleFlag, handleDelete,
  } = useVendorScores();

  const tabCounts = {
    all: vendors.length,
    low: vendors.filter(v => v.riskLevel === 'low').length,
    medium: vendors.filter(v => v.riskLevel === 'medium').length,
    high: vendors.filter(v => v.riskLevel === 'high').length,
    critical: vendors.filter(v => v.riskLevel === 'critical').length,
    flagged: vendors.filter(v => v.isFlagged).length,
  };

  const filteredVendors = vendors
    .filter(v => {
      if (activeTab === 'low') return v.riskLevel === 'low';
      if (activeTab === 'medium') return v.riskLevel === 'medium';
      if (activeTab === 'high') return v.riskLevel === 'high';
      if (activeTab === 'critical') return v.riskLevel === 'critical';
      if (activeTab === 'flagged') return v.isFlagged;
      return true;
    })
    .filter(v => {
      if (!search) return true;
      const q = search.toLowerCase();
      return v.vendorName.toLowerCase().includes(q) || (v.vendorEmail?.toLowerCase().includes(q) ?? false);
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-emerald-600 bg-clip-text text-transparent">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleBulkAssess} disabled={bulkAssessing || vendors.length === 0} className="gap-2">
            {bulkAssessing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            {t('bulkAssess')}
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
            <Plus className="size-4" />{t('addVendor')}
          </Button>
        </div>
      </div>

      <StatsCards stats={stats} />

      {vendors.length > 0 && <Charts riskDistribution={riskDistribution} scoreDistribution={scoreDistribution} />}

      <div className="flex items-center gap-3">
        <Input placeholder={t('vendorName') + '...'} value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {FILTER_TABS.map(key => (
            <TabsTrigger key={key} value={key} className="text-xs gap-1.5 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400">
              {t(key === 'flagged' ? 'flaggedTab' : key)}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{(tabCounts as Record<string, number>)[key] ?? 0}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <VendorList
        vendors={filteredVendors}
        assessing={assessing}
        selectedVendorId={selectedVendor?.id ?? null}
        onAssess={(v) => handleAssess(v.id)}
        onViewDetails={(v) => { setSelectedVendor(v); handleAssess(v.id); }}
        onFlag={(v) => { setSelectedVendor(v); setFlagReason(''); setFlagOpen(true); }}
        onDelete={handleDelete}
        onAddVendor={() => setCreateOpen(true)}
      />

      <CreateVendorDialog open={createOpen} onOpenChange={setCreateOpen} form={form} setForm={setForm} subcontractors={subcontractors} onSubmit={handleCreate} />
      <AssessmentDialog open={assessOpen} onOpenChange={setAssessOpen} result={assessmentResult} />
      <FlagVendorDialog open={flagOpen} onOpenChange={setFlagOpen} selectedVendor={selectedVendor} flagReason={flagReason} setFlagReason={setFlagReason} onSubmit={handleFlag} />
    </div>
  );
}
