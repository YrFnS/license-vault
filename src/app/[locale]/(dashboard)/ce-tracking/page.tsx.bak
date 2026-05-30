'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  Clock,
  BookOpen,
  Award,
  TrendingUp,
  Loader2,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface License {
  id: string;
  name: string;
  type: string;
}

interface CERecord {
  id: string;
  orgId: string;
  licenseId: string;
  courseName: string;
  provider: string;
  hoursEarned: number;
  hoursRequired: number;
  completionDate: string;
  category: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  license: License;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

const categoryColors: Record<string, string> = {
  safety: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800',
  technical: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 border-teal-200 dark:border-teal-800',
  business: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  ethics: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  general: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

export default function CETrackingPage() {
  const t = useTranslations('ceTracking');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const { data: session } = useSession();

  const [records, setRecords] = useState<CERecord[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLicenseId, setFilterLicenseId] = useState<string>('all');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CERecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formLicenseId, setFormLicenseId] = useState('');
  const [formCourseName, setFormCourseName] = useState('');
  const [formProvider, setFormProvider] = useState('');
  const [formHoursEarned, setFormHoursEarned] = useState('');
  const [formHoursRequired, setFormHoursRequired] = useState('');
  const [formCompletionDate, setFormCompletionDate] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [formNotes, setFormNotes] = useState('');

  const canManage = ['owner', 'admin'].includes((session?.user as any)?.role || 'member');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const ceRes = await fetch(`/api/ce-tracking${filterLicenseId !== 'all' ? `?licenseId=${filterLicenseId}` : ''}`);
      if (ceRes.ok) {
        const data = await ceRes.json();
        setRecords(data.records);
      }

      const licRes = await fetch('/api/licenses?limit=100');
      if (licRes.ok) {
        const data = await licRes.json();
        setLicenses(data.licenses.map((l: any) => ({ id: l.id, name: l.name, type: l.type })));
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [filterLicenseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setFormLicenseId('');
    setFormCourseName('');
    setFormProvider('');
    setFormHoursEarned('');
    setFormHoursRequired('');
    setFormCompletionDate('');
    setFormCategory('general');
    setFormNotes('');
    setEditingRecord(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (record: CERecord) => {
    setEditingRecord(record);
    setFormLicenseId(record.licenseId);
    setFormCourseName(record.courseName);
    setFormProvider(record.provider);
    setFormHoursEarned(String(record.hoursEarned));
    setFormHoursRequired(String(record.hoursRequired));
    setFormCompletionDate(new Date(record.completionDate).toISOString().split('T')[0]);
    setFormCategory(record.category);
    setFormNotes(record.notes || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formLicenseId || !formCourseName || !formProvider || !formHoursEarned || !formCompletionDate) {
      toast.error(t('courseName'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        licenseId: formLicenseId,
        courseName: formCourseName,
        provider: formProvider,
        hoursEarned: parseFloat(formHoursEarned) || 0,
        hoursRequired: parseFloat(formHoursRequired) || 0,
        completionDate: formCompletionDate,
        category: formCategory,
        notes: formNotes || null,
      };

      const url = editingRecord ? `/api/ce-tracking/${editingRecord.id}` : '/api/ce-tracking';
      const method = editingRecord ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(t('saveSuccess'));
        setDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error');
      }
    } catch {
      toast.error('Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/ce-tracking/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('deleteSuccess'));
        setDeleteId(null);
        fetchData();
      } else {
        toast.error('Error');
      }
    } catch {
      toast.error('Error');
    } finally {
      setDeleting(false);
    }
  };

  // Computed summary values
  const totalHours = records.reduce((sum, r) => sum + r.hoursEarned, 0);
  const totalRequired = records.reduce((sum, r) => sum + r.hoursRequired, 0);
  const completedHours = records.length > 0 ? totalHours : 0;
  const remainingHours = Math.max(0, totalRequired - totalHours);
  const coursesCompleted = records.length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryLabel = (cat: string) => {
    const keys = ['safety', 'technical', 'business', 'ethics', 'general'] as const;
    if (keys.includes(cat as any)) {
      return t(`categories.${cat}`);
    }
    return cat;
  };

  const getLicenseName = (licenseId: string) => {
    const lic = licenses.find(l => l.id === licenseId);
    return lic?.name || licenseId;
  };

  // Summary cards data
  const summaryCards = [
    { key: 'totalHours', value: totalHours, icon: Clock, color: 'teal' },
    { key: 'completedHours', value: completedHours, icon: BookOpen, color: 'emerald' },
    { key: 'remainingHours', value: remainingHours, icon: TrendingUp, color: 'amber' },
    { key: 'coursesCompleted', value: coursesCompleted, icon: Award, color: 'emerald' },
  ] as const;

  const getCardGradient = (color: string) => {
    switch (color) {
      case 'teal': return 'from-teal-50/90 via-teal-50/60 to-teal-100/40 dark:from-teal-950/40 dark:via-teal-950/20 dark:to-teal-900/10';
      case 'emerald': return 'from-emerald-50/90 via-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-emerald-900/10';
      case 'amber': return 'from-amber-50/90 via-amber-50/60 to-amber-100/40 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-amber-900/10';
      default: return 'from-emerald-50/90 via-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-emerald-900/10';
    }
  };

  const getCardBorder = (color: string) => {
    switch (color) {
      case 'teal': return 'border-s-teal-400 dark:border-s-teal-600';
      case 'emerald': return 'border-s-emerald-400 dark:border-s-emerald-600';
      case 'amber': return 'border-s-amber-400 dark:border-s-amber-600';
      default: return 'border-s-emerald-400 dark:border-s-emerald-600';
    }
  };

  const getCardIconBg = (color: string) => {
    switch (color) {
      case 'teal': return 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400';
      case 'emerald': return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400';
      case 'amber': return 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400';
      default: return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900 shrink-0">
            <GraduationCap className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
          </div>
        </div>
        {canManage && (
          <Button
            onClick={openAddDialog}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm shrink-0"
          >
            <Plus className="size-4 me-2" />
            {t('addRecord')}
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.key} variants={itemVariants}>
              <Card className={`relative overflow-hidden border-s-4 ${getCardBorder(card.color)} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${getCardGradient(card.color)}`} />
                <CardContent className="relative p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{t(card.key)}</span>
                    <div className={`rounded-xl p-2 shadow-sm ${getCardIconBg(card.color)}`}>
                      <Icon className="size-4" />
                    </div>
                  </div>
                  <p className="text-2xl lg:text-3xl font-extrabold tabular-nums">{card.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Progress Bar */}
      {totalRequired > 0 && (
        <Card className="shadow-sm">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t('progress')}</span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {totalHours} / {totalRequired} {t('totalHours').toLowerCase()}
              </span>
            </div>
            <Progress
              value={Math.min(100, (totalHours / totalRequired) * 100)}
              className="h-3"
            />
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium whitespace-nowrap">{t('filterByLicense')}</Label>
        <Select value={filterLicenseId} onValueChange={setFilterLicenseId}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allLicenses')}</SelectItem>
            {licenses.map((lic) => (
              <SelectItem key={lic.id} value={lic.id}>
                {lic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty State */}
      {records.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 p-4 mb-4">
                <GraduationCap className="size-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{t('noRecords')}</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">{t('noRecordsDesc')}</p>
              {canManage && (
                <Button
                  onClick={openAddDialog}
                  variant="outline"
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                >
                  <Plus className="size-4 me-2" />
                  {t('addRecord')}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Desktop Table */}
      {records.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="hidden md:block"
        >
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('courseName')}
                      </th>
                      <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('provider')}
                      </th>
                      <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('hoursEarned')}
                      </th>
                      <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('completionDate')}
                      </th>
                      <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('category')}
                      </th>
                      <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('license')}
                      </th>
                      {canManage && (
                        <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {tCommon('actions')}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {records.map((record) => (
                        <motion.tr
                          key={record.id}
                          variants={itemVariants}
                          className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-sm">{record.courseName}</div>
                            {record.notes && (
                              <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-48">{record.notes}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">{record.provider}</td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold tabular-nums">{record.hoursEarned}</span>
                            {record.hoursRequired > 0 && (
                              <span className="text-xs text-muted-foreground"> / {record.hoursRequired}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(record.completionDate)}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`text-xs font-medium ${categoryColors[record.category] || categoryColors.general}`}>
                              {getCategoryLabel(record.category)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Shield className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-sm">{getLicenseName(record.licenseId)}</span>
                            </div>
                          </td>
                          {canManage && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 transition-colors"
                                  onClick={() => openEditDialog(record)}
                                >
                                  <Pencil className="size-3.5" />
                                  <span className="sr-only">{tCommon('edit')}</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors"
                                  onClick={() => setDeleteId(record.id)}
                                >
                                  <Trash2 className="size-3.5" />
                                  <span className="sr-only">{tCommon('delete')}</span>
                                </Button>
                              </div>
                            </td>
                          )}
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Mobile Cards */}
      {records.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="md:hidden space-y-3"
        >
          <AnimatePresence>
            {records.map((record) => (
              <motion.div key={record.id} variants={itemVariants}>
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm truncate">{record.courseName}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{record.provider}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs font-medium shrink-0 ${categoryColors[record.category] || categoryColors.general}`}>
                        {getCategoryLabel(record.category)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        <span className="font-semibold text-foreground tabular-nums">{record.hoursEarned}</span>
                        {record.hoursRequired > 0 && <span>/ {record.hoursRequired}</span>}
                      </span>
                      <span>{formatDate(record.completionDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Shield className="size-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{getLicenseName(record.licenseId)}</span>
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30"
                            onClick={() => openEditDialog(record)}
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                            onClick={() => setDeleteId(record.id)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {record.notes && (
                      <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">{record.notes}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRecord ? t('editRecord') : t('addRecord')}</DialogTitle>
            <DialogDescription>
              {editingRecord ? t('editRecord') : t('addRecord')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* License */}
            <div className="space-y-2">
              <Label htmlFor="ce-license">{t('license')}</Label>
              <Select value={formLicenseId} onValueChange={setFormLicenseId}>
                <SelectTrigger id="ce-license">
                  <SelectValue placeholder={t('licensePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {licenses.map((lic) => (
                    <SelectItem key={lic.id} value={lic.id}>
                      {lic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course Name */}
            <div className="space-y-2">
              <Label htmlFor="ce-course">{t('courseName')}</Label>
              <Input
                id="ce-course"
                value={formCourseName}
                onChange={(e) => setFormCourseName(e.target.value)}
                placeholder={t('courseNamePlaceholder')}
              />
            </div>

            {/* Provider */}
            <div className="space-y-2">
              <Label htmlFor="ce-provider">{t('provider')}</Label>
              <Input
                id="ce-provider"
                value={formProvider}
                onChange={(e) => setFormProvider(e.target.value)}
                placeholder={t('providerPlaceholder')}
              />
            </div>

            {/* Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ce-hours-earned">{t('hoursEarned')}</Label>
                <Input
                  id="ce-hours-earned"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formHoursEarned}
                  onChange={(e) => setFormHoursEarned(e.target.value)}
                  placeholder={t('hoursEarnedPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ce-hours-required">{t('hoursRequired')}</Label>
                <Input
                  id="ce-hours-required"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formHoursRequired}
                  onChange={(e) => setFormHoursRequired(e.target.value)}
                  placeholder={t('hoursRequiredPlaceholder')}
                />
              </div>
            </div>

            {/* Completion Date */}
            <div className="space-y-2">
              <Label htmlFor="ce-date">{t('completionDate')}</Label>
              <Input
                id="ce-date"
                type="date"
                value={formCompletionDate}
                onChange={(e) => setFormCompletionDate(e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="ce-category">{t('category')}</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger id="ce-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['safety', 'technical', 'business', 'ethics', 'general'].map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {getCategoryLabel(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="ce-notes">{t('notes')}</Label>
              <Textarea
                id="ce-notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formLicenseId || !formCourseName || !formProvider || !formHoursEarned || !formCompletionDate}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin me-2" />
                  {tCommon('loading')}
                </>
              ) : (
                tCommon('save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteRecord')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin me-2" />
                  {tCommon('loading')}
                </>
              ) : (
                tCommon('delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
