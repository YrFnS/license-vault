'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ArrowLeft,
  Calendar,
  Building2,
  FileText,
  Trash2,
  RefreshCw,
  Pencil,
  X,
  Check,
  Hash,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ChevronRight,
  Download,
  CheckCircle2,
  User,
  ToggleLeft,
  Activity,
  Plus,
  FileIcon,
} from 'lucide-react';
import { RenewalDialog } from '@/components/licenses/RenewalDialog';
import { DocumentManager } from '@/components/licenses/DocumentManager';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';
import { useRole } from '@/hooks/useRole';

interface LicenseData {
  id: string;
  name: string;
  type: string;
  licenseNumber: string;
  issuedBy: string;
  issueDate: string;
  expirationDate: string;
  notes: string | null;
  isRenewed: boolean;
  renewalDate: string | null;
  autoRenew: boolean;
  renewalHistory: string | null;
  status: string;
  daysUntilExpiration: number | null;
}

// Activity entry interface for the Activity tab
interface ActivityEntry {
  id: string;
  action: string;
  entityType: string;
  entityName?: string | null;
  details?: string | null;
  userName?: string | null;
  createdAt: string;
}

const ACTIVITY_CONFIG: Record<string, {
  icon: typeof Plus;
  iconColor: string;
  dotColor: string;
  bgColor: string;
}> = {
  LICENSE_CREATED: {
    icon: Plus,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  LICENSE_UPDATED: {
    icon: Pencil,
    iconColor: 'text-teal-600 dark:text-teal-400',
    dotColor: 'bg-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
  },
  LICENSE_DELETED: {
    icon: Trash2,
    iconColor: 'text-red-600 dark:text-red-400',
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  LICENSE_EXPORTED: {
    icon: Download,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    dotColor: 'bg-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
  },
};

const DEFAULT_ACTIVITY_CONFIG = {
  icon: Activity,
  iconColor: 'text-muted-foreground',
  dotColor: 'bg-muted-foreground',
  bgColor: 'bg-muted/50',
};

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 5) return `${diffWeek}w ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function LicenseDetailPage() {
  const t = useTranslations('licenses');
  const tc = useTranslations('common');
  const tR = useTranslations('renewal');
  const tA = useTranslations('licenses.activity');
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { canManageLicenses, role } = useRole();

  const [license, setLicense] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  const [autoRenew, setAutoRenew] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    type: '',
    licenseNumber: '',
    issuedBy: '',
    issueDate: '',
    expirationDate: '',
    notes: '',
  });

  const fetchLicense = useCallback(async () => {
    try {
      const res = await fetch(`/api/licenses/${id}`);
      if (!res.ok) throw new Error('Failed to fetch license');
      const data = await res.json();
      setLicense(data.license);
      setAutoRenew(data.license.autoRenew || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await fetch(`/api/licenses/${id}/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivityEntries(data.activity || []);
      }
    } catch {
      // Silently fail - activity tab just won't show data
    } finally {
      setActivityLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLicense();
  }, [fetchLicense]);

  // Fetch activity when the activity tab is selected
  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivity();
    }
  }, [activeTab, fetchActivity]);

  const enterEditMode = useCallback(() => {
    if (!license) return;
    setEditForm({
      name: license.name,
      type: license.type,
      licenseNumber: license.licenseNumber,
      issuedBy: license.issuedBy,
      issueDate: license.issueDate.split('T')[0],
      expirationDate: license.expirationDate.split('T')[0],
      notes: license.notes || '',
    });
    setIsEditing(true);
  }, [license]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSave = async () => {
    if (!license) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/licenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          type: editForm.type,
          licenseNumber: editForm.licenseNumber,
          issuedBy: editForm.issuedBy,
          issueDate: editForm.issueDate,
          expirationDate: editForm.expirationDate,
          notes: editForm.notes || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to update license');
      toast.success(t('detail.editSuccess'));
      setIsEditing(false);
      fetchLicense();
    } catch {
      toast.error(t('detail.editError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete license');
      toast.success('License deleted successfully');
      router.push('/licenses');
    } catch {
      toast.error('Failed to delete license');
    }
  };

  const handleRenewed = useCallback(() => {
    toast.success(tR('success'));
    fetchLicense();
  }, [fetchLicense, tR]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'expiring_soon': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <ShieldCheck className="size-4" />;
      case 'expiring_soon': return <ShieldAlert className="size-4" />;
      case 'expired': return <ShieldX className="size-4" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return t('status.active');
      case 'expiring_soon': return t('status.expiringSoon');
      case 'expired': return t('status.expired');
      default: return status;
    }
  };

  const getDaysUntilExpiration = useMemo(() => {
    if (!license) return null;
    const now = new Date();
    const exp = new Date(license.expirationDate);
    const diffMs = exp.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }, [license]);

  const getDaysActive = useMemo(() => {
    if (!license) return null;
    const now = new Date();
    const issued = new Date(license.issueDate);
    const diffMs = now.getTime() - issued.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }, [license]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !license) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-destructive font-medium">Failed to load license</p>
            <p className="text-muted-foreground text-sm mt-1">{error}</p>
            <Button onClick={fetchLicense} variant="outline" className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/licenses">{t('detail.breadcrumbLicenses')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="size-3.5" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium truncate max-w-[200px]">
              {license.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/licenses')} className="mt-1 shrink-0">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{license.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`gap-1.5 px-3 py-1 text-sm font-semibold ${getStatusColor(license.status)}`}>
                {getStatusIcon(license.status)}
                {getStatusText(license.status)}
              </Badge>
              {getDaysUntilExpiration !== null && (
                <Badge
                  variant="outline"
                  className={`px-3 py-1 text-sm font-semibold ${
                    getDaysUntilExpiration < 0
                      ? 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400'
                      : getDaysUntilExpiration <= 30
                        ? 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400'
                        : 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  <Clock className="size-3.5 me-1" />
                  {getDaysUntilExpiration < 0
                    ? `${Math.abs(getDaysUntilExpiration)}d overdue`
                    : `${getDaysUntilExpiration}d remaining`}
                </Badge>
              )}
              {isEditing && (
                <Badge variant="outline" className="px-3 py-1 text-sm border-teal-400 text-teal-700 dark:border-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30">
                  <Pencil className="size-3 me-1" />
                  {t('detail.editing')}
                </Badge>
              )}
              {license.isRenewed && !isEditing && (
                <Badge className="px-3 py-1 text-sm font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  {tR('renewedBadge')}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - Desktop */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {!isEditing ? (
            <>
              {canManageLicenses && (
                <Button onClick={enterEditMode} variant="outline" className="gap-2">
                  <Pencil className="size-4" />
                  {t('detail.editLicense')}
                </Button>
              )}
              {canManageLicenses && (
                <Button onClick={() => setRenewalDialogOpen(true)} className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                  <RefreshCw className="size-4" />
                  {tR('renewButton')}
                </Button>
              )}
              {canManageLicenses && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="size-4" />
                    {tc('delete')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{tc('confirm')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('detail.deleteConfirm')}
                    </AlertDialogDescription>
                    {license.name && (
                      <p className="text-sm text-destructive font-medium mt-2">
                        {t('detail.deleteWarning', { name: license.name })}
                      </p>
                    )}
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {tc('delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              )}
            </>
          ) : (
            <>
              <Button onClick={cancelEdit} variant="outline" className="gap-2">
                <X className="size-4" />
                {t('detail.cancelEdit')}
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                {saving ? (
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                {t('detail.saveChanges')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview" className="gap-1.5">
            <FileText className="size-3.5" />
            {t('tabOverview')}
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileIcon className="size-3.5" />
            {t('tabDocuments')}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
            <Activity className="size-3.5" />
            {t('tabActivity')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <QuickStatCard
              icon={<Calendar className="size-5 text-emerald-600 dark:text-emerald-400" />}
              label={t('detail.daysActive')}
              value={getDaysActive !== null ? `${getDaysActive}` : '—'}
              colorClass="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
            />
            <QuickStatCard
              icon={<Clock className={`size-5 ${
                getDaysUntilExpiration !== null && getDaysUntilExpiration < 0
                  ? 'text-red-600 dark:text-red-400'
                  : getDaysUntilExpiration !== null && getDaysUntilExpiration <= 30
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-teal-600 dark:text-teal-400'
              }`}
              />}
              label={t('detail.daysUntilExpiration')}
              value={getDaysUntilExpiration !== null ? `${getDaysUntilExpiration}` : '—'}
              colorClass={
                getDaysUntilExpiration !== null && getDaysUntilExpiration < 0
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                  : getDaysUntilExpiration !== null && getDaysUntilExpiration <= 30
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                    : 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800'
              }
            />
            <QuickStatCard
              icon={license.isRenewed
                ? <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                : <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400" />
              }
              label={t('detail.renewalStatus')}
              value={license.isRenewed ? t('detail.renewed') : t('detail.notRenewed')}
              colorClass={license.isRenewed
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
              }
            />
          </div>

          {/* Renewal Preview */}
          {!isEditing && canManageLicenses && (
            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <RefreshCw className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    {tR('renewButton')}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    {getDaysUntilExpiration !== null && getDaysUntilExpiration < 0
                      ? tR('expiredAgo', { days: Math.abs(getDaysUntilExpiration) })
                      : getDaysUntilExpiration !== null
                        ? tR('daysUntilExpiry', { days: getDaysUntilExpiration })
                        : ''}
                  </p>
                </div>
                <Button size="sm" onClick={() => setRenewalDialogOpen(true)} className="ms-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shrink-0">
                  <RefreshCw className="size-3.5 me-1" />
                  {tR('confirm')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* License Details Card */}
          <Card className={`transition-colors duration-300 ${
            isEditing
              ? 'border-teal-400 dark:border-teal-600 bg-teal-50/30 dark:bg-teal-950/10'
              : ''
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                {tc('viewDetails')}
                {isEditing && (
                  <Badge variant="outline" className="ms-2 border-teal-400 text-teal-700 dark:border-teal-600 dark:text-teal-400 text-xs">
                    {t('detail.editing')}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-6">
                  {/* Identification Group */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Hash className="size-4" />
                      {t('detail.identification')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">{t('form.name')}</Label>
                        <Input
                          id="edit-name"
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder={t('form.namePlaceholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-type">{t('form.type')}</Label>
                        <Input
                          id="edit-type"
                          value={editForm.type}
                          onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
                          placeholder={t('form.typePlaceholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-licenseNumber">{t('form.licenseNumber')}</Label>
                        <Input
                          id="edit-licenseNumber"
                          value={editForm.licenseNumber}
                          onChange={(e) => setEditForm((f) => ({ ...f, licenseNumber: e.target.value }))}
                          placeholder={t('form.licenseNumberPlaceholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-issuedBy">{t('form.issuedBy')}</Label>
                        <Input
                          id="edit-issuedBy"
                          value={editForm.issuedBy}
                          onChange={(e) => setEditForm((f) => ({ ...f, issuedBy: e.target.value }))}
                          placeholder={t('form.issuedByPlaceholder')}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Dates Group */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Calendar className="size-4" />
                      {t('detail.dates')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-issueDate">{t('form.issueDate')}</Label>
                        <Input
                          id="edit-issueDate"
                          type="date"
                          value={editForm.issueDate}
                          onChange={(e) => setEditForm((f) => ({ ...f, issueDate: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-expirationDate">{t('form.expirationDate')}</Label>
                        <Input
                          id="edit-expirationDate"
                          type="date"
                          value={editForm.expirationDate}
                          onChange={(e) => setEditForm((f) => ({ ...f, expirationDate: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-notes">{t('form.notes')}</Label>
                    <Textarea
                      id="edit-notes"
                      value={editForm.notes}
                      onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder={t('form.notesPlaceholder')}
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Identification Group */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Hash className="size-4" />
                      {t('detail.identification')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                      <DetailRow
                        label={t('form.name')}
                        value={license.name}
                        icon={<FileText className="size-4 text-muted-foreground" />}
                      />
                      <DetailRow
                        label={t('form.type')}
                        value={license.type}
                        icon={<Badge variant="secondary" className="text-xs px-1.5 py-0 me-0">{license.type}</Badge>}
                        hideValue
                      />
                      <DetailRow
                        label={t('form.licenseNumber')}
                        value={license.licenseNumber}
                        icon={<Hash className="size-4 text-muted-foreground" />}
                        mono
                      />
                      <DetailRow
                        label={t('form.issuedBy')}
                        value={license.issuedBy}
                        icon={<Building2 className="size-4 text-muted-foreground" />}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Dates Group */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Calendar className="size-4" />
                      {t('detail.dates')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                      <DetailRow
                        label={t('form.issueDate')}
                        value={formatDate(license.issueDate)}
                        icon={<Calendar className="size-4 text-emerald-600 dark:text-emerald-400" />}
                      />
                      <DetailRow
                        label={t('form.expirationDate')}
                        value={formatDate(license.expirationDate)}
                        icon={
                          <Calendar className={`size-4 ${
                            license.status === 'expired'
                              ? 'text-red-600 dark:text-red-400'
                              : license.status === 'expiring_soon'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                          />
                        }
                      />
                    </div>
                  </div>

                  {license.notes && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <FileText className="size-4" />
                          {t('form.notes')}
                        </h3>
                        <div className="bg-muted/50 rounded-lg p-4 border">
                          <p className="text-sm whitespace-pre-wrap">{license.notes}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auto-Renew Toggle & Renewal History */}
          {!isEditing && canManageLicenses && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Auto-Renew Toggle */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2">
                        <ToggleLeft className="size-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{tR('autoRenew')}</p>
                        <p className="text-xs text-muted-foreground">{tR('autoRenewDesc')}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoRenew}
                      onClick={() => setAutoRenew(!autoRenew)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                        autoRenew ? 'bg-emerald-600' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          autoRenew ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Renewal History */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <Clock className="size-4 text-emerald-600 dark:text-emerald-400" />
                    {tR('history')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {license.renewalHistory ? (
                    (() => {
                      let history: Array<{ date: string; notes: string; renewedBy: string }> = [];
                      try { history = JSON.parse(license.renewalHistory); } catch { history = []; }
                      return history.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto space-y-3">
                          {history.map((entry, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className="mt-1 flex flex-col items-center">
                                <div className="size-2.5 rounded-full bg-emerald-500" />
                                {index < history.length - 1 && (
                                  <div className="w-px h-full min-h-[1.5rem] bg-border mt-1" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">
                                  {tR('renewedOn', { date: formatDate(entry.date) })}
                                </p>
                                {entry.renewedBy && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <User className="size-3" />
                                    {entry.renewedBy}
                                  </p>
                                )}
                                {entry.notes && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {entry.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{tR('noHistory')}</p>
                      );
                    })()
                  ) : (
                    <p className="text-sm text-muted-foreground">{tR('noHistory')}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <DocumentManager licenseId={id} userRole={role} />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-5 text-primary" />
                {tA('title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="relative ps-6 space-y-5">
                  <div className="absolute start-2.5 top-2 bottom-2 w-px bg-border" />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="relative flex items-start gap-3">
                      <div className="absolute -start-6 top-1.5 size-3 rounded-full bg-muted-foreground/20 ring-2 ring-background" />
                      <Skeleton className="shrink-0 size-7 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-full max-w-[200px]" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activityEntries.length > 0 ? (
                <ScrollArea className="max-h-96">
                  <div className="relative ps-6">
                    {/* Vertical timeline line */}
                    <div className="absolute start-2.5 top-2 bottom-2 w-px bg-gradient-to-b from-border via-border/60 to-transparent" />

                    {activityEntries.map((entry, index) => {
                      const config = ACTIVITY_CONFIG[entry.action] || DEFAULT_ACTIVITY_CONFIG;
                      const Icon = config.icon;
                      const isLast = index === activityEntries.length - 1;

                      // Build description from action type and entity name/details
                      const description = (() => {
                        const name = entry.entityName || 'item';
                        switch (entry.action) {
                          case 'LICENSE_CREATED':
                            return `Created license "${name}"`;
                          case 'LICENSE_UPDATED':
                            return entry.details || `Updated license "${name}"`;
                          case 'LICENSE_DELETED':
                            return `Deleted license "${name}"`;
                          case 'LICENSE_IMPORTED':
                            return entry.details || 'Imported licenses';
                          case 'LICENSE_EXPORTED':
                            return entry.details || 'Exported licenses';
                          case 'DOCUMENT_UPLOADED':
                            return entry.details || `Uploaded document to "${name}"`;
                          case 'DOCUMENT_DELETED':
                            return entry.details || `Deleted document from "${name}"`;
                          case 'renew':
                            return entry.details || `Renewed license "${name}"`;
                          default:
                            return entry.details || `Performed ${entry.action.toLowerCase().replace(/_/g, ' ')}`;
                        }
                      })();

                      return (
                        <div
                          key={entry.id}
                          className={`relative pb-5 ${isLast ? 'pb-0' : ''}`}
                        >
                          {/* Timeline dot */}
                          <div className={`absolute -start-6 top-1.5 size-3 rounded-full ${config.dotColor} ring-2 ring-background shadow-sm`} />

                          {/* Content */}
                          <div className="flex items-start gap-3">
                            <div className={`shrink-0 rounded-lg p-1.5 ${config.bgColor}`}>
                              <Icon className={`size-3.5 ${config.iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground leading-snug">
                                {description}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {entry.userName && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                    {entry.userName}
                                  </span>
                                )}
                                {entry.userName && (
                                  <span className="text-xs text-muted-foreground/40">·</span>
                                )}
                                <span className="flex items-center gap-1 text-xs text-muted-foreground/70 shrink-0">
                                  <Clock className="size-2.5" />
                                  {getRelativeTime(entry.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/20 p-5 mb-4">
                    <Activity className="size-10 text-emerald-400 dark:text-emerald-500" />
                  </div>
                  <p className="font-medium text-foreground">{tA('noActivity')}</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    {tA('noActivityDesc')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Renewal Dialog */}
      {license && (
        <RenewalDialog
          open={renewalDialogOpen}
          onOpenChange={setRenewalDialogOpen}
          license={license}
          onRenewed={handleRenewed}
        />
      )}

      {/* Sticky bottom bar for mobile actions */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t">
        <div className="flex items-center justify-between gap-2 p-3 max-w-lg mx-auto">
          {!isEditing ? (
            <>
              <Button onClick={enterEditMode} variant="outline" size="sm" className="gap-1.5 flex-1">
                <Pencil className="size-3.5" />
                {t('detail.editLicense')}
              </Button>
              <Button onClick={() => setRenewalDialogOpen(true)} size="sm" className="gap-1.5 flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                <RefreshCw className="size-3.5" />
                {tR('renewButton')}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-1.5">
                    <Trash2 className="size-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{tc('confirm')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('detail.deleteConfirm')}
                    </AlertDialogDescription>
                    {license.name && (
                      <p className="text-sm text-destructive font-medium mt-2">
                        {t('detail.deleteWarning', { name: license.name })}
                      </p>
                    )}
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {tc('delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Button onClick={cancelEdit} variant="outline" size="sm" className="gap-1.5 flex-1">
                <X className="size-3.5" />
                {t('detail.cancelEdit')}
              </Button>
              <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                {saving ? (
                  <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                {t('detail.saveChanges')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon,
  mono = false,
  hideValue = false,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  mono?: boolean;
  hideValue?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
        {icon}
        {label}
      </p>
      {!hideValue && (
        <p className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value}</p>
      )}
    </div>
  );
}

function QuickStatCard({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
}) {
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${colorClass}`}>
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold truncate">{value}</p>
      </div>
    </div>
  );
}
