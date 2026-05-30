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
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Search,
  UserCheck,
  AlertTriangle,
  GraduationCap,
  Clock,
  Pencil,
  Trash2,
  Eye,
  Link2,
  Unlink,
  Loader2,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useRole } from '@/hooks/useRole';
import { cn } from '@/lib/utils';

interface Qualifier {
  id: string;
  orgId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  licenseNumber: string | null;
  licenseState: string | null;
  licenseType: string | null;
  licenseExpiry: string | null;
  ceHoursEarned: number;
  ceHoursRequired: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  computedStatus: string;
  linkedLicensesCount: number;
  licenseLinks?: LinkedLicense[];
}

interface LinkedLicense {
  id: string;
  qualifierId: string;
  licenseId: string;
  role: string;
  assignedAt: string;
  license: {
    id: string;
    name: string;
    type: string;
    licenseNumber: string;
    state: string | null;
    expirationDate: string;
  };
}

interface OrgLicense {
  id: string;
  name: string;
  type: string;
  licenseNumber: string;
}

type StatusFilter = 'all' | 'active' | 'expiring' | 'expired' | 'ce_deficient';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface StatusCounts {
  all: number;
  active: number;
  expiring: number;
  ce_deficient: number;
}

const LIMIT = 20;

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

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
  'WI','WY','DC',
];

function CEProgressBar({ earned, required }: { earned: number; required: number }) {
  const t = useTranslations('qualifiers');
  if (required === 0) return null;
  const pct = Math.min(100, Math.round((earned / required) * 100));
  const isComplete = earned >= required;
  const isPartial = earned > 0 && earned < required;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {earned} / {required} {t('ceHoursEarned').split(' ')[0]}
        </span>
        <span
          className={cn(
            'font-medium',
            isComplete ? 'text-emerald-600 dark:text-emerald-400' : isPartial ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
          )}
        >
          {isComplete ? t('hoursComplete') : `${required - earned} ${t('hoursRemaining')}`}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isComplete
              ? 'bg-emerald-500'
              : isPartial
              ? 'bg-amber-500'
              : 'bg-red-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('qualifiers');
  const config: Record<string, { label: string; className: string }> = {
    active: {
      label: t('active'),
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    },
    expiring: {
      label: t('expiring'),
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    },
    expired: {
      label: t('expired'),
      className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800',
    },
    ce_deficient: {
      label: t('ceDeficient'),
      className: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    },
  };

  const c = config[status] || config.active;

  return (
    <Badge variant="outline" className={cn('text-xs font-medium', c.className)}>
      {c.label}
    </Badge>
  );
}

export default function QualifiersPage() {
  const t = useTranslations('qualifiers');
  const tc = useTranslations('common');
  const { canManage } = useRole();

  const [qualifiers, setQualifiers] = useState<Qualifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: LIMIT, total: 0, totalPages: 0 });
  const [counts, setCounts] = useState<StatusCounts>({ all: 0, active: 0, expiring: 0, ce_deficient: 0 });

  // Dialog states
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQualifier, setSelectedQualifier] = useState<Qualifier | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseState: '',
    licenseType: '',
    licenseExpiry: '',
    ceHoursEarned: 0,
    ceHoursRequired: 0,
    status: 'active',
    notes: '',
  });

  // Link license state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingQualifier, setLinkingQualifier] = useState<Qualifier | null>(null);
  const [orgLicenses, setOrgLicenses] = useState<OrgLicense[]>([]);
  const [selectedLicenseId, setSelectedLicenseId] = useState('');
  const [linkRole, setLinkRole] = useState('qualifier');
  const [linking, setLinking] = useState(false);

  // Detail qualifier with linked licenses
  const [detailQualifier, setDetailQualifier] = useState<Qualifier | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const fetchQualifiers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

      const res = await fetch(`/api/qualifiers?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch qualifiers');
      const json = await res.json();
      setQualifiers(json.qualifiers || []);
      setPagination(json.pagination || { page: 1, limit: LIMIT, total: 0, totalPages: 0 });
      if (json.counts) setCounts(json.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchQualifiers();
  }, [fetchQualifiers]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // Fetch org licenses for link dialog
  const fetchOrgLicenses = useCallback(async () => {
    try {
      const res = await fetch('/api/licenses?limit=100');
      if (res.ok) {
        const json = await res.json();
        setOrgLicenses((json.licenses || []).map((l: any) => ({
          id: l.id,
          name: l.name,
          type: l.type,
          licenseNumber: l.licenseNumber,
        })));
      }
    } catch {}
  }, []);

  const resetForm = useCallback(() => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      licenseNumber: '',
      licenseState: '',
      licenseType: '',
      licenseExpiry: '',
      ceHoursEarned: 0,
      ceHoursRequired: 0,
      status: 'active',
      notes: '',
    });
    setEditMode(false);
    setSelectedQualifier(null);
  }, []);

  const openAddDialog = useCallback(() => {
    resetForm();
    setAddEditOpen(true);
  }, [resetForm]);

  const openEditDialog = useCallback((q: Qualifier) => {
    setForm({
      firstName: q.firstName,
      lastName: q.lastName,
      email: q.email || '',
      phone: q.phone || '',
      licenseNumber: q.licenseNumber || '',
      licenseState: q.licenseState || '',
      licenseType: q.licenseType || '',
      licenseExpiry: q.licenseExpiry ? q.licenseExpiry.split('T')[0] : '',
      ceHoursEarned: q.ceHoursEarned,
      ceHoursRequired: q.ceHoursRequired,
      status: q.status,
      notes: q.notes || '',
    });
    setSelectedQualifier(q);
    setEditMode(true);
    setAddEditOpen(true);
  }, []);

  const openDetailDialog = useCallback(async (q: Qualifier) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailQualifier(q);
    try {
      const res = await fetch(`/api/qualifiers/${q.id}`);
      if (res.ok) {
        const json = await res.json();
        setDetailQualifier(json.qualifier);
      }
    } catch {}
    setDetailLoading(false);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        licenseNumber: form.licenseNumber || undefined,
        licenseState: form.licenseState || undefined,
        licenseType: form.licenseType || undefined,
        licenseExpiry: form.licenseExpiry || undefined,
        ceHoursEarned: form.ceHoursEarned,
        ceHoursRequired: form.ceHoursRequired,
        status: form.status,
        notes: form.notes || undefined,
      };

      if (editMode && selectedQualifier) {
        const res = await fetch(`/api/qualifiers/${selectedQualifier.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update qualifier');
        }
        toast.success(t('updateSuccess'));
      } else {
        const res = await fetch('/api/qualifiers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create qualifier');
        }
        toast.success(t('createSuccess'));
      }

      setAddEditOpen(false);
      resetForm();
      fetchQualifiers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }, [editMode, selectedQualifier, form, fetchQualifiers, resetForm, t]);

  const handleDelete = useCallback(async () => {
    if (!selectedQualifier) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/qualifiers/${selectedQualifier.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete qualifier');
      toast.success(t('deleteSuccess'));
      setDeleteDialogOpen(false);
      setSelectedQualifier(null);
      fetchQualifiers();
    } catch {
      toast.error('Failed to delete qualifier');
    } finally {
      setDeleting(false);
    }
  }, [selectedQualifier, fetchQualifiers, t]);

  const handleLinkLicense = useCallback(async () => {
    if (!linkingQualifier || !selectedLicenseId) return;
    setLinking(true);
    try {
      const res = await fetch(`/api/qualifiers/${linkingQualifier.id}/link-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId: selectedLicenseId, role: linkRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to link license');
      }
      toast.success(t('linkSuccess'));
      setLinkDialogOpen(false);
      setSelectedLicenseId('');
      setLinkRole('qualifier');
      // Refresh detail if open
      if (detailOpen && detailQualifier) {
        const detailRes = await fetch(`/api/qualifiers/${detailQualifier.id}`);
        if (detailRes.ok) {
          const json = await detailRes.json();
          setDetailQualifier(json.qualifier);
        }
      }
      fetchQualifiers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to link license');
    } finally {
      setLinking(false);
    }
  }, [linkingQualifier, selectedLicenseId, linkRole, detailOpen, detailQualifier, fetchQualifiers, t]);

  const handleUnlinkLicense = useCallback(async (qualifierId: string, licenseId: string) => {
    try {
      const res = await fetch(`/api/qualifiers/${qualifierId}/link-license/${licenseId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to unlink license');
      toast.success(t('unlinkSuccess'));
      // Refresh detail
      if (detailQualifier) {
        const detailRes = await fetch(`/api/qualifiers/${detailQualifier.id}`);
        if (detailRes.ok) {
          const json = await detailRes.json();
          setDetailQualifier(json.qualifier);
        }
      }
      fetchQualifiers();
    } catch {
      toast.error('Failed to unlink license');
    }
  }, [detailQualifier, fetchQualifiers, t]);

  // Stats cards data
  const stats = [
    {
      label: t('totalQualifiers'),
      value: counts.all,
      icon: Users,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-gradient-to-br from-teal-50/90 via-teal-50/60 to-emerald-100/40 dark:from-teal-950/40 dark:via-teal-950/20 dark:to-emerald-950/10',
      border: 'border-s-teal-500',
    },
    {
      label: t('activeQualifiers'),
      value: counts.active,
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-gradient-to-br from-emerald-50/90 via-emerald-50/60 to-teal-100/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-teal-950/10',
      border: 'border-s-emerald-500',
    },
    {
      label: t('atRiskQualifiers'),
      value: counts.expiring,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-gradient-to-br from-amber-50/90 via-amber-50/60 to-amber-100/40 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-amber-950/10',
      border: 'border-s-amber-500',
    },
    {
      label: t('ceDeficientQualifiers'),
      value: counts.ce_deficient,
      icon: GraduationCap,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-gradient-to-br from-red-50/90 via-red-50/60 to-amber-100/40 dark:from-red-950/40 dark:via-red-950/20 dark:to-amber-950/10',
      border: 'border-s-red-500',
    },
  ];

  if (loading && qualifiers.length === 0) {
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
            <p className="text-destructive font-medium">Failed to load qualifiers</p>
            <p className="text-muted-foreground text-sm mt-1">{error}</p>
            <Button onClick={fetchQualifiers} variant="outline" className="mt-4">
              {tc('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div {...fadeIn} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('description')}</p>
        </div>
        {canManage && (
          <Button
            size="sm"
            onClick={openAddDialog}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/25"
          >
            <Plus className="size-4 me-1.5" />
            {t('addQualifier')}
          </Button>
        )}
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
      >
        {stats.map((stat) => {
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

      {/* Search + Filters */}
      <motion.div {...fadeIn} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 h-9 bg-muted/30 border-border/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('allStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatus')}</SelectItem>
              <SelectItem value="active">{t('active')}</SelectItem>
              <SelectItem value="expiring">{t('expiring')}</SelectItem>
              <SelectItem value="expired">{t('expired')}</SelectItem>
              <SelectItem value="ce_deficient">{t('ceDeficient')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Qualifiers List */}
      {qualifiers.length === 0 ? (
        <motion.div {...fadeIn} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative mb-6">
            <div className="rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 p-6 ring-1 ring-border/20">
              <UserCheck className="size-12 text-muted-foreground/60" />
            </div>
            <div className="absolute -bottom-1 -end-1 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 p-1.5 ring-2 ring-background">
              <Plus className="size-3 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h3 className="font-semibold text-lg">{t('noQualifiers')}</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm">{t('noQualifiersDesc')}</p>
          {canManage && (
            <Button
              size="sm"
              className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/20"
              onClick={openAddDialog}
            >
              <Plus className="size-4 me-1" />
              {t('addQualifier')}
            </Button>
          )}
        </motion.div>
      ) : (
        <>
          {/* Desktop Table View */}
          <motion.div {...fadeIn} className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-start p-3 font-medium text-muted-foreground">{tc('name')}</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">{t('licenseNumber')}</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">{t('licenseState')}</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">{t('licenseExpiry')}</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">{t('ceProgress')}</th>
                        <th className="text-start p-3 font-medium text-muted-foreground">{t('status')}</th>
                        <th className="text-end p-3 font-medium text-muted-foreground">{tc('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {qualifiers.map((q) => (
                          <motion.tr
                            key={q.id}
                            variants={staggerItem}
                            initial="initial"
                            animate="animate"
                            className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{q.firstName} {q.lastName}</p>
                                {q.email && (
                                  <p className="text-xs text-muted-foreground">{q.email}</p>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-muted-foreground">{q.licenseNumber || '—'}</td>
                            <td className="p-3 text-muted-foreground">{q.licenseState || '—'}</td>
                            <td className="p-3 text-muted-foreground">
                              {q.licenseExpiry
                                ? new Date(q.licenseExpiry).toLocaleDateString()
                                : '—'}
                            </td>
                            <td className="p-3" style={{ minWidth: 150 }}>
                              {q.ceHoursRequired > 0 ? (
                                <CEProgressBar earned={q.ceHoursEarned} required={q.ceHoursRequired} />
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                            <td className="p-3">
                              <StatusBadge status={q.computedStatus} />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30"
                                  onClick={() => openDetailDialog(q)}
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
                                      onClick={() => openEditDialog(q)}
                                    >
                                      <Pencil className="size-4" />
                                      <span className="sr-only">{tc('edit')}</span>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                      onClick={() => {
                                        setSelectedQualifier(q);
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

          {/* Mobile Card View */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="md:hidden space-y-3"
          >
            {qualifiers.map((q) => (
              <motion.div key={q.id} variants={staggerItem} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                <Card className="shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 p-2">
                            <UserCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className={cn(
                            'absolute -bottom-0.5 -end-0.5 size-3 rounded-full ring-2 ring-background',
                            q.computedStatus === 'active' ? 'bg-emerald-500' :
                            q.computedStatus === 'expiring' ? 'bg-amber-500' :
                            q.computedStatus === 'expired' ? 'bg-red-500' :
                            q.computedStatus === 'ce_deficient' ? 'bg-orange-500' : 'bg-slate-400'
                          )} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{q.firstName} {q.lastName}</p>
                          {q.email && (
                            <p className="text-xs text-muted-foreground truncate">{q.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {q.linkedLicensesCount > 0 && (
                          <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border-teal-200 dark:border-teal-800">
                            <Link2 className="size-3 me-0.5" />
                            {q.linkedLicensesCount}
                          </Badge>
                        )}
                        <StatusBadge status={q.computedStatus} />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      {q.licenseNumber && (
                        <div>
                          <span className="text-muted-foreground">{t('licenseNumber')}:</span>{' '}
                          <span className="font-medium">{q.licenseNumber}</span>
                        </div>
                      )}
                      {q.licenseState && (
                        <div>
                          <span className="text-muted-foreground">{t('licenseState')}:</span>{' '}
                          <span className="font-medium">{q.licenseState}</span>
                        </div>
                      )}
                      {q.licenseExpiry && (
                        <div>
                          <span className="text-muted-foreground">{t('licenseExpiry')}:</span>{' '}
                          <span className="font-medium">{new Date(q.licenseExpiry).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {q.ceHoursRequired > 0 && (
                      <div className="mt-3">
                        <CEProgressBar earned={q.ceHoursEarned} required={q.ceHoursRequired} />
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-end gap-1 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        onClick={() => openDetailDialog(q)}
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
                            onClick={() => openEditDialog(q)}
                          >
                            <Pencil className="size-4 me-1" />
                            {tc('edit')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => {
                              setSelectedQualifier(q);
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

      {/* Add/Edit Qualifier Dialog */}
      <Dialog open={addEditOpen} onOpenChange={(open) => { if (!open) resetForm(); setAddEditOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? t('editQualifier') : t('addQualifier')}</DialogTitle>
            <DialogDescription>
              {editMode ? tc('edit') : t('addQualifier')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('firstName')} *</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('lastName')} *</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">{t('licenseNumber')}</Label>
                <Input
                  id="licenseNumber"
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  placeholder="QL-2024-12345"
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
                <Label htmlFor="licenseType">{t('licenseType')}</Label>
                <Input
                  id="licenseType"
                  value={form.licenseType}
                  onChange={(e) => setForm({ ...form, licenseType: e.target.value })}
                  placeholder="e.g., General Contractor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseExpiry">{t('licenseExpiry')}</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={form.licenseExpiry}
                  onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-base font-semibold">{t('ceProgress')}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ceHoursEarned">{t('ceHoursEarned')}</Label>
                  <Input
                    id="ceHoursEarned"
                    type="number"
                    min={0}
                    value={form.ceHoursEarned}
                    onChange={(e) => setForm({ ...form, ceHoursEarned: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ceHoursRequired">{t('ceHoursRequired')}</Label>
                  <Input
                    id="ceHoursRequired"
                    type="number"
                    min={0}
                    value={form.ceHoursRequired}
                    onChange={(e) => setForm({ ...form, ceHoursRequired: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              {form.ceHoursRequired > 0 && (
                <CEProgressBar earned={form.ceHoursEarned} required={form.ceHoursRequired} />
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">{t('status')}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('active')}</SelectItem>
                    <SelectItem value="expiring">{t('expiring')}</SelectItem>
                    <SelectItem value="expired">{t('expired')}</SelectItem>
                    <SelectItem value="ce_deficient">{t('ceDeficient')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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
              disabled={saving || !form.firstName || !form.lastName}
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

      {/* Qualifier Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t('qualifierDetails')}</DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : detailQualifier ? (
            <div className="space-y-4 py-2">
              {/* Name & Status */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    {detailQualifier.firstName} {detailQualifier.lastName}
                  </h3>
                  {detailQualifier.email && (
                    <p className="text-sm text-muted-foreground">{detailQualifier.email}</p>
                  )}
                </div>
                <StatusBadge status={detailQualifier.computedStatus} />
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {detailQualifier.phone && (
                  <div>
                    <span className="text-muted-foreground">{t('phone')}:</span>{' '}
                    <span className="font-medium">{detailQualifier.phone}</span>
                  </div>
                )}
                {detailQualifier.licenseNumber && (
                  <div>
                    <span className="text-muted-foreground">{t('licenseNumber')}:</span>{' '}
                    <span className="font-medium">{detailQualifier.licenseNumber}</span>
                  </div>
                )}
                {detailQualifier.licenseState && (
                  <div>
                    <span className="text-muted-foreground">{t('licenseState')}:</span>{' '}
                    <span className="font-medium">{detailQualifier.licenseState}</span>
                  </div>
                )}
                {detailQualifier.licenseType && (
                  <div>
                    <span className="text-muted-foreground">{t('licenseType')}:</span>{' '}
                    <span className="font-medium">{detailQualifier.licenseType}</span>
                  </div>
                )}
                {detailQualifier.licenseExpiry && (
                  <div>
                    <span className="text-muted-foreground">{t('licenseExpiry')}:</span>{' '}
                    <span className="font-medium">{new Date(detailQualifier.licenseExpiry).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* CE Progress */}
              {detailQualifier.ceHoursRequired > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('ceProgress')}</Label>
                  <CEProgressBar earned={detailQualifier.ceHoursEarned} required={detailQualifier.ceHoursRequired} />
                </div>
              )}

              {/* Notes */}
              {detailQualifier.notes && (
                <div>
                  <Label className="text-sm font-medium">{t('notes')}</Label>
                  <p className="text-sm text-muted-foreground mt-1">{detailQualifier.notes}</p>
                </div>
              )}

              <Separator />

              {/* Linked Licenses */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">{t('linkedLicenses')}</Label>
                  {canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLinkingQualifier(detailQualifier);
                        fetchOrgLicenses();
                        setLinkDialogOpen(true);
                      }}
                    >
                      <Link2 className="size-4 me-1" />
                      {t('linkLicense')}
                    </Button>
                  )}
                </div>

                {detailQualifier.licenseLinks && detailQualifier.licenseLinks.length > 0 ? (
                  <div className="space-y-2">
                    {detailQualifier.licenseLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between gap-3 rounded-lg border p-3 bg-muted/30"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{link.license.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span>{link.license.type}</span>
                            <span>•</span>
                            <span>{link.license.licenseNumber}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {link.role}
                            </Badge>
                          </div>
                        </div>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => handleUnlinkLicense(detailQualifier.id, link.licenseId)}
                          >
                            <Unlink className="size-3.5" />
                            <span className="sr-only">{t('unlinkLicense')}</span>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No linked licenses
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                {canManage && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDetailOpen(false);
                        openEditDialog(detailQualifier);
                      }}
                    >
                      <Pencil className="size-4 me-1" />
                      {tc('edit')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDetailOpen(false);
                        setSelectedQualifier(detailQualifier);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="size-4 me-1" />
                      {tc('delete')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteQualifier')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm')}
              <br />
              <span className="text-amber-600 dark:text-amber-400 font-medium">{t('deleteWarning')}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="size-4 animate-spin me-2" /> : null}
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Link License Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('linkLicense')}</DialogTitle>
            <DialogDescription>
              Link a license to {linkingQualifier?.firstName} {linkingQualifier?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select License</Label>
              <Select value={selectedLicenseId} onValueChange={setSelectedLicenseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a license..." />
                </SelectTrigger>
                <SelectContent>
                  {orgLicenses.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} ({l.licenseNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('role')}</Label>
              <Select value={linkRole} onValueChange={setLinkRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualifier">Qualifier</SelectItem>
                  <SelectItem value="rmo">Responsible Managing Officer</SelectItem>
                  <SelectItem value="rme">Responsible Managing Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleLinkLicense}
              disabled={linking || !selectedLicenseId}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              {linking ? <Loader2 className="size-4 animate-spin me-2" /> : null}
              {t('linkLicense')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
