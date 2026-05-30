'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Search,
  HardHat,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Send,
  Copy,
  Link2,
  FolderKanban,
  CheckCircle2,
  XCircle,
  HelpCircle,
  LayoutGrid,
  List,
  CheckSquare,
  Users,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useRole } from '@/hooks/useRole';
import { cn } from '@/lib/utils';

interface Subcontractor {
  id: string;
  orgId: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  licenseNumber: string | null;
  licenseState: string | null;
  licenseExpiry: string | null;
  insuranceExpiry: string | null;
  insuranceStatus: string;
  complianceStatus: string;
  status: string;
  uploadToken: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  computedInsuranceStatus: string;
  projectSubs?: { project: { id: string; name: string; status: string } }[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface StatusCounts {
  total: number;
  active: number;
  compliant: number;
  non_compliant: number;
}

const LIMIT = 20;

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
  'WI','WY','DC',
];

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

function ComplianceBadge({ status }: { status: string }) {
  const t = useTranslations('subcontractors');
  const config: Record<string, { label: string; className: string }> = {
    compliant: {
      label: t('compliant'),
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    },
    pending: {
      label: t('pendingReview'),
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    },
    pending_review: {
      label: t('pendingReview'),
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    },
    non_compliant: {
      label: t('nonCompliant'),
      className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800',
    },
    unknown: {
      label: t('unknown'),
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-950/40 dark:text-gray-400 border-gray-200 dark:border-gray-800',
    },
  };

  const c = config[status] || config.unknown;
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', c.className)}>
      {c.label}
    </Badge>
  );
}

function InsuranceBadge({ status }: { status: string }) {
  const t = useTranslations('subcontractors');
  const config: Record<string, { label: string; className: string }> = {
    active: {
      label: t('compliant'),
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    },
    expiring: {
      label: t('pendingReview'),
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    },
    expired: {
      label: t('nonCompliant'),
      className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800',
    },
    unknown: {
      label: t('unknown'),
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-950/40 dark:text-gray-400 border-gray-200 dark:border-gray-800',
    },
  };

  const c = config[status] || config.unknown;
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', c.className)}>
      {c.label}
    </Badge>
  );
}

export default function SubcontractorsPage() {
  const t = useTranslations('subcontractors');
  const tc = useTranslations('common');
  const { canManage } = useRole();

  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [complianceFilter, setComplianceFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: LIMIT, total: 0, totalPages: 0 });
  const [counts, setCounts] = useState<StatusCounts>({ total: 0, active: 0, compliant: 0, non_compliant: 0 });

  // View & selection states
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);

  // Dialog states
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkRequestOpen, setBulkRequestOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subcontractor | null>(null);
  const [detailSub, setDetailSub] = useState<Subcontractor | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [requestingDocs, setRequestingDocs] = useState(false);
  const [bulkRequesting, setBulkRequesting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseState: '',
    licenseExpiry: '',
    insuranceExpiry: '',
    insuranceStatus: 'unknown',
    notes: '',
  });

  // Debounce search
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  const fetchSubcontractors = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (complianceFilter !== 'all') params.set('compliance', complianceFilter);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

      const res = await fetch(`/api/subcontractors?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch subcontractors');
      const json = await res.json();
      setSubcontractors(json.subcontractors || []);
      setPagination(json.pagination || { page: 1, limit: LIMIT, total: 0, totalPages: 0 });
      if (json.counts) setCounts(json.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, complianceFilter, debouncedSearch]);

  useEffect(() => {
    fetchSubcontractors();
  }, [fetchSubcontractors]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, complianceFilter]);

  const resetForm = useCallback(() => {
    setForm({
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      licenseNumber: '',
      licenseState: '',
      licenseExpiry: '',
      insuranceExpiry: '',
      insuranceStatus: 'unknown',
      notes: '',
    });
    setEditMode(false);
    setSelectedSub(null);
  }, []);

  const openAddDialog = useCallback(() => {
    resetForm();
    setAddEditOpen(true);
  }, [resetForm]);

  const openEditDialog = useCallback((sub: Subcontractor) => {
    setForm({
      companyName: sub.companyName,
      contactName: sub.contactName || '',
      email: sub.email || '',
      phone: sub.phone || '',
      licenseNumber: sub.licenseNumber || '',
      licenseState: sub.licenseState || '',
      licenseExpiry: sub.licenseExpiry ? sub.licenseExpiry.split('T')[0] : '',
      insuranceExpiry: sub.insuranceExpiry ? sub.insuranceExpiry.split('T')[0] : '',
      insuranceStatus: sub.insuranceStatus || 'unknown',
      notes: sub.notes || '',
    });
    setSelectedSub(sub);
    setEditMode(true);
    setAddEditOpen(true);
  }, []);

  const openDetailDialog = useCallback(async (sub: Subcontractor) => {
    setDetailOpen(true);
    setDetailSub(sub);
    try {
      const res = await fetch(`/api/subcontractors/${sub.id}`);
      if (res.ok) {
        const json = await res.json();
        setDetailSub(json.subcontractor);
      }
    } catch {}
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        companyName: form.companyName,
        contactName: form.contactName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        licenseNumber: form.licenseNumber || undefined,
        licenseState: form.licenseState || undefined,
        licenseExpiry: form.licenseExpiry || undefined,
        insuranceExpiry: form.insuranceExpiry || undefined,
        insuranceStatus: form.insuranceStatus || undefined,
        notes: form.notes || undefined,
      };

      if (editMode && selectedSub) {
        const res = await fetch(`/api/subcontractors/${selectedSub.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update subcontractor');
        }
        toast.success(t('updateSuccess'));
      } else {
        const res = await fetch('/api/subcontractors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create subcontractor');
        }
        toast.success(t('createSuccess'));
      }

      setAddEditOpen(false);
      resetForm();
      fetchSubcontractors();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }, [editMode, selectedSub, form, fetchSubcontractors, resetForm, t]);

  const handleDelete = useCallback(async () => {
    if (!selectedSub) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/subcontractors/${selectedSub.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete subcontractor');
      toast.success(t('deleteSuccess'));
      setDeleteDialogOpen(false);
      setSelectedSub(null);
      fetchSubcontractors();
    } catch {
      toast.error('Failed to delete subcontractor');
    } finally {
      setDeleting(false);
    }
  }, [selectedSub, fetchSubcontractors, t]);

  const handleRequestDocs = useCallback(async (sub: Subcontractor) => {
    setRequestingDocs(true);
    try {
      const res = await fetch(`/api/subcontractors/${sub.id}/request-docs`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to request documents');
      const data = await res.json();
      toast.success(t('docsRequested'));
      // Copy link to clipboard
      if (data.uploadUrl) {
        await navigator.clipboard.writeText(window.location.origin + data.uploadUrl);
        toast.success(t('uploadLinkCopied'));
      }
    } catch {
      toast.error('Failed to request documents');
    } finally {
      setRequestingDocs(false);
    }
  }, [t]);

  const handleBulkRequest = useCallback(async () => {
    setBulkRequesting(true);
    try {
      const nonCompliantSubs = subcontractors.filter(
        (s) => s.complianceStatus === 'non_compliant' || s.complianceStatus === 'pending'
      );
      let successCount = 0;
      for (const sub of nonCompliantSubs) {
        const res = await fetch(`/api/subcontractors/${sub.id}/request-docs`, { method: 'POST' });
        if (res.ok) successCount++;
      }
      toast.success(t('bulkRequestSent', { count: successCount }));
      setBulkRequestOpen(false);
      fetchSubcontractors();
    } catch {
      toast.error('Failed to send bulk requests');
    } finally {
      setBulkRequesting(false);
    }
  }, [subcontractors, fetchSubcontractors, t]);

  const handleCopyUploadLink = useCallback(async (sub: Subcontractor) => {
    if (sub.uploadToken) {
      const url = `${window.location.origin}/subcontractor-upload?token=${sub.uploadToken}`;
      await navigator.clipboard.writeText(url);
      toast.success(t('uploadLinkCopied'));
    }
  }, [t]);

  // Stats cards data
  const stats = [
    {
      label: t('totalSubcontractors'),
      value: counts.total,
      icon: HardHat,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-gradient-to-br from-teal-50/90 via-teal-50/60 to-emerald-100/40 dark:from-teal-950/40 dark:via-teal-950/20 dark:to-emerald-950/10',
      border: 'border-s-teal-500',
    },
    {
      label: t('activeCount'),
      value: counts.active,
      icon: Users,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-gradient-to-br from-emerald-50/90 via-emerald-50/60 to-teal-100/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-teal-950/10',
      border: 'border-s-emerald-500',
    },
    {
      label: t('compliantCount'),
      value: counts.compliant,
      icon: ShieldCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-gradient-to-br from-emerald-50/90 via-emerald-50/60 to-teal-100/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-teal-950/10',
      border: 'border-s-emerald-600',
    },
    {
      label: t('nonCompliantCount'),
      value: counts.non_compliant,
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-gradient-to-br from-red-50/90 via-red-50/60 to-amber-100/40 dark:from-red-950/40 dark:via-red-950/20 dark:to-amber-950/10',
      border: 'border-s-red-500',
    },
  ];

  if (loading && subcontractors.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
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
            <p className="text-destructive font-medium">Failed to load subcontractors</p>
            <p className="text-muted-foreground text-sm mt-1">{error}</p>
            <Button onClick={fetchSubcontractors} variant="outline" className="mt-4">
              {tc('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Bulk select helpers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === subcontractors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(subcontractors.map(s => s.id)));
    }
  };
  const handleBulkRequestDocs = async () => {
    setBulkRequesting(true);
    try {
      const selectedSubs = subcontractors.filter(s => selectedIds.has(s.id));
      let successCount = 0;
      for (const sub of selectedSubs) {
        const res = await fetch(`/api/subcontractors/${sub.id}/request-docs`, { method: 'POST' });
        if (res.ok) successCount++;
      }
      toast.success(t('bulkRequestSent', { count: successCount }));
      setBulkActionOpen(false);
      setSelectedIds(new Set());
      fetchSubcontractors();
    } catch {
      toast.error('Failed to send bulk requests');
    } finally {
      setBulkRequesting(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div {...fadeIn} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">{t('title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('description')}</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkRequestOpen(true)}
              className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
            >
              <Send className="size-4 me-1.5" />
              {t('requestCOIs')}
            </Button>
            <Button
              size="sm"
              onClick={openAddDialog}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/25"
            >
              <Plus className="size-4 me-1.5" />
              {t('addSubcontractor')}
            </Button>
          </div>
        )}
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
      >
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={staggerItem} whileHover={{ scale: 1.02, y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
              <Card className={cn('relative overflow-hidden border-s-4 shadow-sm hover:shadow-md transition-shadow duration-300', stat.bg, stat.border)}>
                <CardContent className="p-3 md:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground/70 font-bold">{stat.label}</p>
                      <p className="text-2xl lg:text-3xl font-extrabold tabular-nums mt-1">{stat.value}</p>
                    </div>
                    <div className="rounded-xl p-2 lg:p-3 bg-background/50 shadow-sm">
                      <Icon className={cn('size-5 lg:size-6', stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Status Filter Tabs + Search + View Toggle */}
      <motion.div {...fadeIn} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Tabs value={complianceFilter} onValueChange={setComplianceFilter}>
            <TabsList className="bg-muted/50 h-9">
              <TabsTrigger value="all" className="text-xs">{t('allStatus')}</TabsTrigger>
              <TabsTrigger value="compliant" className="text-xs gap-1">
                <ShieldCheck className="size-3" />
                {t('compliant')}
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs gap-1">
                <Clock className="size-3" />
                {t('pendingReview')}
              </TabsTrigger>
              <TabsTrigger value="non_compliant" className="text-xs gap-1">
                <AlertTriangle className="size-3" />
                {t('nonCompliant')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2 ms-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 h-9 bg-muted/30 border-border/50"
              />
            </div>
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="icon"
                className={cn('size-9 rounded-none', viewMode === 'table' && 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700')}
                onClick={() => setViewMode('table')}
              >
                <List className="size-4" />
                <span className="sr-only">{t('tableView')}</span>
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="icon"
                className={cn('size-9 rounded-none', viewMode === 'cards' && 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700')}
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid className="size-4" />
                <span className="sr-only">{t('cardView')}</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card border border-border shadow-lg">
            <span className="text-sm font-medium">{t('selectedCount', { count: selectedIds.size })}</span>
            <Button
              size="sm"
              onClick={handleBulkRequestDocs}
              disabled={bulkRequesting}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
            >
              {bulkRequesting ? <Loader2 className="size-4 animate-spin me-1" /> : <Send className="size-4 me-1" />}
              {t('requestDocs')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedIds(new Set())}
            >
              {tc('cancel')}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Subcontractors List */}
      {subcontractors.length === 0 ? (
        <motion.div {...fadeIn} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative mb-6">
            <div className="rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 p-6 ring-1 ring-border/20">
              <HardHat className="size-12 text-muted-foreground/60" />
            </div>
            <div className="absolute -bottom-1 -end-1 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 p-1.5 ring-2 ring-background">
              <Plus className="size-3 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h3 className="font-semibold text-lg">{t('noSubcontractors')}</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm">{t('noSubcontractorsDesc')}</p>
          {canManage && (
            <Button
              size="sm"
              className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/20"
              onClick={openAddDialog}
            >
              <Plus className="size-4 me-1" />
              {t('addSubcontractor')}
            </Button>
          )}
        </motion.div>
      ) : (
        <>
          {/* Desktop Table View */}
          <motion.div {...fadeIn} className={cn(viewMode === 'table' ? 'hidden md:block' : 'hidden')}>
            <Card className="shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 w-10">
                          <Checkbox
                            checked={selectedIds.size === subcontractors.length && subcontractors.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </th>
                        <th className="text-start p-3 font-medium text-muted-foreground">{t('companyName')}</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">{t('contactName')}</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">{t('licenseNumber')}</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">{t('licenseState')}</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">{t('licenseExpiry')}</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">{t('insuranceStatus')}</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">{t('complianceStatus')}</th>
                        <th className="text-end p-3 font-medium text-muted-foreground">{tc('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {subcontractors.map((sub) => (
                          <motion.tr
                            key={sub.id}
                            variants={staggerItem}
                            initial="initial"
                            animate="animate"
                            className={cn(
                              'border-b last:border-0 transition-colors duration-150',
                              selectedIds.has(sub.id) ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'hover:bg-muted/30'
                            )}
                          >
                            <td className="p-3">
                              <Checkbox
                                checked={selectedIds.has(sub.id)}
                                onCheckedChange={() => toggleSelect(sub.id)}
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  'size-2 rounded-full shrink-0',
                                  sub.complianceStatus === 'compliant' ? 'bg-emerald-500' :
                                  sub.complianceStatus === 'non_compliant' ? 'bg-red-500' :
                                  sub.complianceStatus === 'pending' || sub.complianceStatus === 'pending_review' ? 'bg-amber-500' : 'bg-slate-400'
                                )} />
                                <div>
                                  <p className="font-medium">{sub.companyName}</p>
                                  {sub.email && (
                                    <p className="text-xs text-muted-foreground">{sub.email}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-muted-foreground">{sub.contactName || '—'}</td>
                            <td className="p-3 text-muted-foreground">{sub.licenseNumber || '—'}</td>
                            <td className="p-3 text-muted-foreground">{sub.licenseState || '—'}</td>
                            <td className="p-3 text-muted-foreground">
                              {sub.licenseExpiry
                                ? new Date(sub.licenseExpiry).toLocaleDateString()
                                : '—'}
                            </td>
                            <td className="p-3">
                              <InsuranceBadge status={sub.computedInsuranceStatus} />
                            </td>
                            <td className="p-3">
                              <ComplianceBadge status={sub.complianceStatus} />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-end gap-1">
                                {canManage && (sub.complianceStatus === 'non_compliant' || sub.complianceStatus === 'pending' || sub.complianceStatus === 'pending_review') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950/30"
                                    onClick={() => handleRequestDocs(sub)}
                                    disabled={requestingDocs}
                                  >
                                    <FileText className="size-4" />
                                    <span className="sr-only">{t('requestDocs')}</span>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30"
                                  onClick={() => openDetailDialog(sub)}
                                >
                                  <Eye className="size-4" />
                                  <span className="sr-only">{tc('viewDetails')}</span>
                                </Button>
                                {canManage && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30"
                                      onClick={() => openEditDialog(sub)}
                                    >
                                      <Pencil className="size-4" />
                                      <span className="sr-only">{tc('edit')}</span>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                      onClick={() => {
                                        setSelectedSub(sub);
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="size-4" />
                                      <span className="sr-only">{tc('delete')}</span>
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card View (mobile + desktop card mode) */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className={cn(
              'space-y-3',
              viewMode === 'cards' ? '' : 'md:hidden'
            )}
          >
            {subcontractors.map((sub) => (
              <motion.div key={sub.id} variants={staggerItem} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                <Card className={cn(
                  'shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer',
                  selectedIds.has(sub.id) && 'ring-2 ring-emerald-500/50 shadow-emerald-500/10'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          <Checkbox
                            checked={selectedIds.has(sub.id)}
                            onCheckedChange={() => toggleSelect(sub.id)}
                            className="absolute -top-1 -start-1 z-10"
                          />
                          <div className="shrink-0 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 p-2 ms-5">
                            <HardHat className="size-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className={cn(
                            'absolute -bottom-0.5 -end-0.5 size-3 rounded-full ring-2 ring-background',
                            sub.complianceStatus === 'compliant' ? 'bg-emerald-500' :
                            sub.complianceStatus === 'non_compliant' ? 'bg-red-500' :
                            sub.complianceStatus === 'pending' || sub.complianceStatus === 'pending_review' ? 'bg-amber-500' : 'bg-slate-400'
                          )} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{sub.companyName}</p>
                          {sub.contactName && (
                            <p className="text-xs text-muted-foreground truncate">{sub.contactName}</p>
                          )}
                        </div>
                      </div>
                      <ComplianceBadge status={sub.complianceStatus} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      {sub.licenseNumber && (
                        <div>
                          <span className="text-muted-foreground">{t('licenseNumber')}:</span>{' '}
                          <span className="font-medium">{sub.licenseNumber}</span>
                        </div>
                      )}
                      {sub.licenseState && (
                        <div>
                          <span className="text-muted-foreground">{t('licenseState')}:</span>{' '}
                          <span className="font-medium">{sub.licenseState}</span>
                        </div>
                      )}
                      {sub.licenseExpiry && (
                        <div>
                          <span className="text-muted-foreground">{t('licenseExpiry')}:</span>{' '}
                          <span className="font-medium">{new Date(sub.licenseExpiry).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">{t('insuranceStatus')}:</span>{' '}
                        <InsuranceBadge status={sub.computedInsuranceStatus} />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-1 pt-2 border-t">
                      {canManage && (sub.complianceStatus === 'non_compliant' || sub.complianceStatus === 'pending' || sub.complianceStatus === 'pending_review') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                          onClick={() => handleRequestDocs(sub)}
                          disabled={requestingDocs}
                        >
                          <FileText className="size-4 me-1" />
                          {t('requestDocs')}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        onClick={() => openDetailDialog(sub)}
                      >
                        <Eye className="size-4 me-1" />
                        {tc('viewDetails')}
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            onClick={() => openEditDialog(sub)}
                          >
                            <Pencil className="size-4 me-1" />
                            {tc('edit')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => {
                              setSelectedSub(sub);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="size-4 me-1" />
                            {tc('delete')}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={addEditOpen} onOpenChange={(open) => { if (!open) resetForm(); setAddEditOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? t('editSubcontractor') : t('addSubcontractor')}</DialogTitle>
            <DialogDescription>
              {editMode ? tc('edit') : t('addSubcontractor')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">{t('companyName')} *</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="e.g., ABC Plumbing Inc."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">{t('contactName')}</Label>
                <Input
                  id="contactName"
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contact@company.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <Separator />

            <p className="text-sm font-semibold text-muted-foreground">{t('licenseNumber')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">{t('licenseNumber')}</Label>
                <Input
                  id="licenseNumber"
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  placeholder="LIC-2024-12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseState">{t('licenseState')}</Label>
                <Select value={form.licenseState} onValueChange={(v) => setForm({ ...form, licenseState: v === '__none__' ? '' : v })}>
                  <SelectTrigger id="licenseState">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {US_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licenseExpiry">{t('licenseExpiry')}</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={form.licenseExpiry}
                  onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insuranceExpiry">{t('insuranceExpiry')}</Label>
                <Input
                  id="insuranceExpiry"
                  type="date"
                  value={form.insuranceExpiry}
                  onChange={(e) => setForm({ ...form, insuranceExpiry: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddEditOpen(false); resetForm(); }}>
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.companyName}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin me-2" />
              ) : null}
              {editMode ? tc('save') : tc('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t('subcontractorDetails')}</DialogTitle>
          </DialogHeader>

          {detailSub ? (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 pr-4">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3">
                    <HardHat className="size-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{detailSub.companyName}</h3>
                    {detailSub.contactName && (
                      <p className="text-sm text-muted-foreground">{detailSub.contactName}</p>
                    )}
                  </div>
                  <ComplianceBadge status={detailSub.complianceStatus} />
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {detailSub.email && (
                    <div>
                      <span className="text-muted-foreground">{t('email')}:</span>
                      <p className="font-medium">{detailSub.email}</p>
                    </div>
                  )}
                  {detailSub.phone && (
                    <div>
                      <span className="text-muted-foreground">{t('phone')}:</span>
                      <p className="font-medium">{detailSub.phone}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* License Info */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">{t('licenseNumber')}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {detailSub.licenseNumber && (
                      <div>
                        <span className="text-muted-foreground">{t('licenseNumber')}:</span>
                        <p className="font-medium">{detailSub.licenseNumber}</p>
                      </div>
                    )}
                    {detailSub.licenseState && (
                      <div>
                        <span className="text-muted-foreground">{t('licenseState')}:</span>
                        <p className="font-medium">{detailSub.licenseState}</p>
                      </div>
                    )}
                    {detailSub.licenseExpiry && (
                      <div>
                        <span className="text-muted-foreground">{t('licenseExpiry')}:</span>
                        <p className="font-medium">{new Date(detailSub.licenseExpiry).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Insurance Info */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">{t('insuranceStatus')}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('insuranceStatus')}:</span>
                      <div className="mt-1">
                        <InsuranceBadge status={detailSub.computedInsuranceStatus} />
                      </div>
                    </div>
                    {detailSub.insuranceExpiry && (
                      <div>
                        <span className="text-muted-foreground">{t('insuranceExpiry')}:</span>
                        <p className="font-medium">{new Date(detailSub.insuranceExpiry).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {detailSub.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold mb-2">{t('notes')}</h4>
                      <p className="text-sm text-muted-foreground">{detailSub.notes}</p>
                    </div>
                  </>
                )}

                {/* Linked Projects */}
                {detailSub.projectSubs && detailSub.projectSubs.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold mb-3">{t('linkedProjects')}</h4>
                      <div className="space-y-2">
                        {detailSub.projectSubs.map((ps) => (
                          <div key={ps.project.id} className="flex items-center gap-2 text-sm">
                            <FolderKanban className="size-4 text-muted-foreground" />
                            <span>{ps.project.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {ps.project.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Actions */}
                {canManage && (
                  <>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestDocs(detailSub)}
                        disabled={requestingDocs}
                        className="border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400"
                      >
                        {requestingDocs ? (
                          <Loader2 className="size-4 animate-spin me-1" />
                        ) : (
                          <Send className="size-4 me-1" />
                        )}
                        {t('requestDocs')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyUploadLink(detailSub)}
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400"
                      >
                        <Copy className="size-4 me-1" />
                        {t('copyUploadLink')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDetailOpen(false);
                          openEditDialog(detailSub);
                        }}
                      >
                        <Pencil className="size-4 me-1" />
                        {tc('edit')}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="space-y-3 py-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="size-4 animate-spin me-1" /> : null}
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Request Dialog */}
      <AlertDialog open={bulkRequestOpen} onOpenChange={setBulkRequestOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('requestCOIs')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('bulkRequestConfirm', {
                count: subcontractors.filter(
                  (s) => s.complianceStatus === 'non_compliant' || s.complianceStatus === 'pending'
                ).length,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkRequest}
              disabled={bulkRequesting}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              {bulkRequesting ? <Loader2 className="size-4 animate-spin me-1" /> : <Send className="size-4 me-1" />}
              {t('requestCOIs')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
