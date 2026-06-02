'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import type { CERecord, License, SummaryCard } from './types';
import { Clock, BookOpen, TrendingUp, Award } from 'lucide-react';

const CATEGORY_KEYS = ['safety', 'technical', 'business', 'ethics', 'general'] as const;

export function useCETracking() {
  const t = useTranslations('ceTracking');
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

  const resetForm = useCallback(() => {
    setFormLicenseId('');
    setFormCourseName('');
    setFormProvider('');
    setFormHoursEarned('');
    setFormHoursRequired('');
    setFormCompletionDate('');
    setFormCategory('general');
    setFormNotes('');
    setEditingRecord(null);
  }, []);

  const openAddDialog = useCallback(() => {
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const openEditDialog = useCallback((record: CERecord) => {
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
  }, []);

  const handleSave = useCallback(async () => {
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
  }, [formLicenseId, formCourseName, formProvider, formHoursEarned, formCompletionDate, formHoursRequired, formCategory, formNotes, editingRecord, t, resetForm, fetchData]);

  const handleDelete = useCallback(async () => {
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
  }, [deleteId, t, fetchData]);

  const closeDialog = useCallback((open: boolean) => {
    if (!open) resetForm();
    setDialogOpen(open);
  }, [resetForm]);

  // Computed summary values
  const { totalHours, totalRequired, remainingHours, coursesCompleted, summaryCards } = useMemo(() => {
    const totalHours = records.reduce((sum, r) => sum + r.hoursEarned, 0);
    const totalRequired = records.reduce((sum, r) => sum + r.hoursRequired, 0);
    const completedHours = records.length > 0 ? totalHours : 0;
    const remainingHours = Math.max(0, totalRequired - totalHours);
    const coursesCompleted = records.length;

    const summaryCards: SummaryCard[] = [
      { key: 'totalHours', value: totalHours, icon: Clock, color: 'teal' },
      { key: 'completedHours', value: completedHours, icon: BookOpen, color: 'emerald' },
      { key: 'remainingHours', value: remainingHours, icon: TrendingUp, color: 'amber' },
      { key: 'coursesCompleted', value: coursesCompleted, icon: Award, color: 'emerald' },
    ];

    return { totalHours, totalRequired, remainingHours, coursesCompleted, summaryCards };
  }, [records]);

  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const getCategoryLabel = useCallback((cat: string) => {
    if (CATEGORY_KEYS.includes(cat as any)) {
      return t(`categories.${cat}`);
    }
    return cat;
  }, [t]);

  const getLicenseName = useCallback((licenseId: string) => {
    const lic = licenses.find(l => l.id === licenseId);
    return lic?.name || licenseId;
  }, [licenses]);

  return {
    // Data
    records,
    licenses,
    loading,
    canManage,
    // Filter
    filterLicenseId,
    setFilterLicenseId,
    // Dialog state
    dialogOpen,
    closeDialog,
    editingRecord,
    saving,
    // Delete state
    deleteId,
    setDeleteId,
    deleting,
    // Form state
    formLicenseId,
    setFormLicenseId,
    formCourseName,
    setFormCourseName,
    formProvider,
    setFormProvider,
    formHoursEarned,
    setFormHoursEarned,
    formHoursRequired,
    setFormHoursRequired,
    formCompletionDate,
    setFormCompletionDate,
    formCategory,
    setFormCategory,
    formNotes,
    setFormNotes,
    // Actions
    openAddDialog,
    openEditDialog,
    handleSave,
    handleDelete,
    // Computed
    summaryCards,
    totalHours,
    totalRequired,
    // Helpers
    formatDate,
    getCategoryLabel,
    getLicenseName,
    // Translations
    t,
  };
}
