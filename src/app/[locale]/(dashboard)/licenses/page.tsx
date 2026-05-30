'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { LicenseTable, type License } from '@/components/licenses/LicenseTable';
import { Plus, Search, FileText, Upload, Download, CheckSquare, X, Trash2, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useRole } from '@/hooks/useRole';

type StatusFilter = 'all' | 'active' | 'expiring_soon' | 'expired' | 'renewal_needed';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface StatusCounts {
  all: number;
  active: number;
  expiring_soon: number;
  expired: number;
  renewal_needed: number;
}

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

  // Bulk action state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Debounce search input
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search change
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  // Map statusFilter to API status param
  const getApiStatusParam = useCallback((filter: StatusFilter): string | undefined => {
    if (filter === 'all') return undefined;
    if (filter === 'renewal_needed') return 'renewalNeeded';
    return filter;
  }, []);

  const fetchLicenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
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

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  // Reset page when status filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleDeleteLicense = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete license');
      toast.success('License deleted successfully');
      // Refetch to update counts and pagination
      fetchLicenses();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch {
      toast.error('Failed to delete license');
    }
  }, [fetchLicenses]);

  const handleRenewLicense = useCallback((id: string) => {
    router.push(`/licenses/${id}`);
  }, [router]);

  const handleExportCSV = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/licenses/export');
      if (!res.ok) throw new Error('Failed to export licenses');
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
    } catch {
      toast.error(t('exportError'));
    } finally {
      setExporting(false);
    }
  }, [t]);

  // Bulk actions
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(licenses.map((l) => l.id)));
  }, [licenses]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleCancelSelect = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleBulkDelete = useCallback(async () => {
    setBulkDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    if (failCount === 0) {
      const plural = successCount > 1 ? 's' : '';
      toast.success(tb('deleteSuccess', { count: successCount, plural }));
    } else {
      toast.error(tb('deleteError'));
    }

    setSelectedIds(new Set());
    setDeleteDialogOpen(false);
    setBulkDeleting(false);

    if (successCount > 0) {
      setSelectMode(false);
      fetchLicenses();
    }
  }, [selectedIds, tb, fetchLicenses]);

  const handleExportSelected = useCallback(async () => {
    try {
      const selectedLicenses = licenses.filter((l) => selectedIds.has(l.id));
      if (selectedLicenses.length === 0) return;

      const headers = ['Name', 'Type', 'License Number', 'Issued By', 'Issue Date', 'Expiration Date', 'Status', 'Notes'];
      const rows = selectedLicenses.map((l) =>
        [l.name, l.type, l.licenseNumber, l.issuedBy, l.issueDate, l.expirationDate, l.status, l.notes || '']
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      );
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'licenses-selected-export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('exportSuccess'));
    } catch {
      toast.error(t('exportError'));
    }
  }, [licenses, selectedIds, t]);

  const allSelected = licenses.length > 0 && selectedIds.size === licenses.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  if (loading && licenses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-destructive font-medium">Failed to load licenses</p>
            <p className="text-muted-foreground text-sm mt-1">{error}</p>
            <Button onClick={fetchLicenses} variant="outline" className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          {pagination.total > 0 && (
            <Badge variant="secondary" className="text-sm font-medium">
              {t('totalLicenses', { count: pagination.total })}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!selectMode && (
            <>
              {canManage && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectMode(true)}
                    disabled={counts.all === 0}
                  >
                    <CheckSquare className="size-4 me-1.5" />
                    {tb('selectMode')}
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/import">
                      <Upload className="size-4 me-1.5" />
                      {t('import')}
                    </Link>
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={exporting || counts.all === 0}
              >
                <Download className="size-4 me-1.5" />
                {exporting ? tc('loading') : t('exportCsv')}
              </Button>
              {canManageLicenses && (
                <Button size="sm" asChild>
                  <Link href="/licenses/new">
                    <Plus className="size-4 me-1.5" />
                    {t('addNew')}
                  </Link>
                </Button>
              )}
            </>
          )}
          {selectMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelSelect}
            >
              <X className="size-4 me-1.5" />
              {tb('cancelSelect')}
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={tc('search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-9"
        />
      </div>

      {/* Filter Tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={(val) => setStatusFilter(val as StatusFilter)}
      >
        <TabsList>
          <TabsTrigger value="all">
            {t('all')} ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="active">
            {t('active')} ({counts.active})
          </TabsTrigger>
          <TabsTrigger value="expiring_soon">
            {t('expiringSoon')} ({counts.expiring_soon})
          </TabsTrigger>
          <TabsTrigger value="expired">
            {t('expired')} ({counts.expired})
          </TabsTrigger>
          <TabsTrigger value="renewal_needed" className="gap-1.5">
            <RefreshCw className="size-3.5" />
            {tR('renewalNeeded')} ({counts.renewal_needed})
          </TabsTrigger>
        </TabsList>

        {/* Each tab content renders the same filtered list */}
        <TabsContent value={statusFilter} className="mt-4">
          {licenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <FileText className="size-10 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{t('noLicenses')}</h3>
              {counts.all === 0 && canManageLicenses && (
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/licenses/new">
                    <Plus className="size-4 me-1" />
                    {t('addNew')}
                  </Link>
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

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-sm text-muted-foreground">
                {t('showing', {
                  from: (pagination.page - 1) * pagination.limit + 1,
                  to: Math.min(pagination.page * pagination.limit, pagination.total),
                  total: pagination.total,
                })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="size-4 me-1" />
                  {t('previous')}
                </Button>
                <span className="text-sm font-medium px-2">
                  {t('page')} {pagination.page} {t('of')} {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  {t('next')}
                  <ChevronRight className="size-4 ms-1" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Floating Action Bar for Bulk Actions */}
      <AnimatePresence>
        {selectMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 inset-x-0 z-50 flex justify-center px-4"
          >
            <div className="flex items-center gap-3 bg-background border shadow-lg rounded-xl px-4 py-3">
              <Badge variant="secondary" className="font-semibold">
                {tb('selected', { count: selectedIds.size })}
              </Badge>
              <div className="w-px h-6 bg-border" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSelected}
              >
                <Download className="size-4 me-1.5" />
                {tb('exportSelected')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="size-4 me-1.5" />
                {tb('deleteSelected')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelSelect}
              >
                {tb('cancelSelect')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc('confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tb('deleteConfirm', {
                count: selectedIds.size,
                plural: selectedIds.size > 1 ? 's' : '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>
              {tc('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {bulkDeleting ? (
                <Loader2 className="size-4 animate-spin me-2" />
              ) : null}
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
