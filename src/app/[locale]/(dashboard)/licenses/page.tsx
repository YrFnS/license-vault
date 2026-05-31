'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LicenseTable, type License } from '@/components/licenses/LicenseTable';
import { Plus, Search, FileText, Upload, Download, CheckSquare, X, Trash2, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';
import { useRole } from '@/hooks/useRole';

type StatusFilter = 'all' | 'active' | 'expiring_soon' | 'expired' | 'renewal_needed';

interface PaginationInfo { page: number; limit: number; total: number; totalPages: number }
interface StatusCounts { all: number; active: number; expiring_soon: number; expired: number; renewal_needed: number }

const LIMIT = 20;

export default function LicensesPage() {
  const t = useTranslations('licenses');
  const tc = useTranslations('common');
  const tb = useTranslations('bulkActions');
  const tR = useTranslations('renewal');
  const router = useRouter();
  const { canManage, canManageLicenses } = useRole();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: LIMIT, total: 0, totalPages: 0 });
  const [counts, setCounts] = useState<StatusCounts>({ all: 0, active: 0, expiring_soon: 0, expired: 0, renewal_needed: 0 });
  const [exporting, setExporting] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery]);

  const getApiStatusParam = useCallback((filter: StatusFilter): string | undefined => {
    if (filter === 'all') return undefined;
    if (filter === 'renewal_needed') return 'renewalNeeded';
    return filter;
  }, []);

  const fetchLicenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      const statusParam = getApiStatusParam(statusFilter);
      if (statusParam) params.set('status', statusParam);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      const res = await fetch(`/api/licenses?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch licenses');
      const json = await res.json();
      setLicenses(json.licenses || []);
      setPagination(json.pagination || { page: 1, limit: LIMIT, total: 0, totalPages: 0 });
      if (json.counts) setCounts(json.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch, getApiStatusParam]);

  useEffect(() => { fetchLicenses(); }, [fetchLicenses]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const handleDeleteLicense = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('License deleted');
      fetchLicenses();
    } catch { toast.error('Failed to delete license'); }
  }, [fetchLicenses]);

  const handleRenewLicense = useCallback((id: string) => {
    router.push(`/licenses/${id}`);
  }, [router]);

  const handleExportCSV = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/licenses/export');
      if (!res.ok) throw new Error('Failed to export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'licenses-export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('exportSuccess'));
    } catch { toast.error(t('exportError')); }
    finally { setExporting(false); }
  }, [t]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(licenses.map((l) => l.id)));
  }, [licenses]);

  const handleDeselectAll = useCallback(() => setSelectedIds(new Set()), []);

  const handleCancelSelect = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleBulkDelete = useCallback(async () => {
    setBulkDeleting(true);
    let successCount = 0, failCount = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
        if (res.ok) successCount++; else failCount++;
      } catch { failCount++; }
    }
    if (failCount === 0) toast.success(tb('deleteSuccess', { count: successCount, plural: successCount > 1 ? 's' : '' }));
    else toast.error(tb('deleteError'));
    setSelectedIds(new Set());
    setDeleteDialogOpen(false);
    setBulkDeleting(false);
    if (successCount > 0) { setSelectMode(false); fetchLicenses(); }
  }, [selectedIds, tb, fetchLicenses]);

  const handleExportSelected = useCallback(async () => {
    try {
      const selectedLicenses = licenses.filter((l) => selectedIds.has(l.id));
      if (selectedLicenses.length === 0) return;
      const headers = ['Name', 'Type', 'License Number', 'Issued By', 'Issue Date', 'Expiration Date', 'Status', 'Notes'];
      const rows = selectedLicenses.map((l) =>
        [l.name, l.type, l.licenseNumber, l.issuedBy, l.issueDate, l.expirationDate, l.status, l.notes || '']
          .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
      );
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'licenses-selected-export.csv';
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success(t('exportSuccess'));
    } catch { toast.error(t('exportError')); }
  }, [licenses, selectedIds, t]);

  const allSelected = licenses.length > 0 && selectedIds.size === licenses.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const filterTabs: { value: StatusFilter; label: string; count: number; dot?: string }[] = [
    { value: 'all', label: t('all'), count: counts.all },
    { value: 'active', label: t('active'), count: counts.active, dot: 'bg-emerald-500' },
    { value: 'expiring_soon', label: t('expiringSoon'), count: counts.expiring_soon, dot: 'bg-amber-500' },
    { value: 'expired', label: t('expired'), count: counts.expired, dot: 'bg-red-500' },
    { value: 'renewal_needed', label: tR('renewalNeeded'), count: counts.renewal_needed, dot: 'bg-blue-500' },
  ];

  if (loading && licenses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <Card><CardContent className="p-4"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div></CardContent></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Card className="max-w-md w-full"><CardContent className="p-6 text-center">
          <p className="text-red-600 font-medium">Failed to load licenses</p>
          <p className="text-slate-500 text-sm mt-1">{error}</p>
          <Button onClick={fetchLicenses} variant="outline" className="mt-4">Retry</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('title')}</h1>
          {pagination.total > 0 && (
            <span className="text-xs text-slate-500 tabular-nums">{pagination.total} total</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!selectMode ? (
            <>
              {canManage && (
                <Button variant="outline" size="sm" onClick={() => setSelectMode(true)} disabled={counts.all === 0}>
                  <CheckSquare className="size-3.5 me-1.5" />{tb('selectMode')}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={exporting || counts.all === 0}>
                <Download className="size-3.5 me-1.5" />{exporting ? tc('loading') : t('exportCsv')}
              </Button>
              {canManageLicenses && (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                  <Link href="/licenses/new"><Plus className="size-3.5 me-1.5" />{t('addNew')}</Link>
                </Button>
              )}
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={handleCancelSelect}>
              <X className="size-3.5 me-1.5" />{tb('cancelSelect')}
            </Button>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input placeholder={tc('search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="ps-9 border-slate-200 dark:border-slate-700" />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                statusFilter === tab.value
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.dot && <span className={`size-1.5 rounded-full ${tab.dot}`} />}
              {tab.label}
              <span className="tabular-nums text-slate-400">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {licenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-4 mb-3">
            <FileText className="size-8 text-slate-400" />
          </div>
          <p className="font-medium text-slate-700 dark:text-slate-300">{t('noLicenses')}</p>
          {counts.all === 0 && canManageLicenses && (
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/licenses/new"><Plus className="size-4 me-1" />{t('addNew')}</Link>
            </Button>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <LicenseTable
              licenses={licenses}
              onDelete={handleDeleteLicense}
              onRenew={handleRenewLicense}
              selectMode={selectMode}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              allSelected={allSelected}
              someSelected={someSelected}
              canManage={canManageLicenses}
            />
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 tabular-nums">
            {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.page <= 1}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-xs text-slate-500 tabular-nums px-2">{pagination.page} / {pagination.totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={pagination.page >= pagination.totalPages}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Bulk action bar (inline, not floating) */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 py-3">
          <div className="mx-auto max-w-6xl flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400"><span className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">{selectedIds.size}</span> selected</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportSelected}>
                <Download className="size-3.5 me-1.5" />Export
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="size-3.5 me-1.5" />Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancelSelect}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc('confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tb('deleteConfirm', { count: selectedIds.size, plural: selectedIds.size > 1 ? 's' : '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={bulkDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              {bulkDeleting && <Loader2 className="size-4 animate-spin me-2" />}{tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
