'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { LIMIT } from './constants';
import type { Qualifier, QualifierForm, OrgLicense, StatusFilter, PaginationInfo, StatusCounts } from './types';

const emptyForm: QualifierForm = {
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
};

export function useQualifiers(canManage: boolean) {
  const t = useTranslations('qualifiers');

  const [qualifiers, setQualifiers] = useState<Qualifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: LIMIT, total: 0, totalPages: 0 });
  const [counts, setCounts] = useState<StatusCounts>({ all: 0, active: 0, expiring: 0, ce_deficient: 0 });

  const [addEditOpen, setAddEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQualifier, setSelectedQualifier] = useState<Qualifier | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState<QualifierForm>({ ...emptyForm });

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingQualifier, setLinkingQualifier] = useState<Qualifier | null>(null);
  const [orgLicenses, setOrgLicenses] = useState<OrgLicense[]>([]);
  const [selectedLicenseId, setSelectedLicenseId] = useState('');
  const [linkRole, setLinkRole] = useState('qualifier');
  const [linking, setLinking] = useState(false);

  const [detailQualifier, setDetailQualifier] = useState<Qualifier | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
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

  useEffect(() => { fetchQualifiers(); }, [fetchQualifiers]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const fetchOrgLicenses = useCallback(async () => {
    try {
      const res = await fetch('/api/licenses?limit=100');
      if (res.ok) {
        const json = await res.json();
        setOrgLicenses((json.licenses || []).map((l: any) => ({
          id: l.id, name: l.name, type: l.type, licenseNumber: l.licenseNumber,
        })));
      }
    } catch {}
  }, []);

  const resetForm = useCallback(() => {
    setForm({ ...emptyForm });
    setEditMode(false);
    setSelectedQualifier(null);
  }, []);

  const openAddDialog = useCallback(() => { resetForm(); setAddEditOpen(true); }, [resetForm]);

  const openEditDialog = useCallback((q: Qualifier) => {
    setForm({
      firstName: q.firstName, lastName: q.lastName,
      email: q.email || '', phone: q.phone || '',
      licenseNumber: q.licenseNumber || '', licenseState: q.licenseState || '',
      licenseType: q.licenseType || '',
      licenseExpiry: q.licenseExpiry ? q.licenseExpiry.split('T')[0] : '',
      ceHoursEarned: q.ceHoursEarned, ceHoursRequired: q.ceHoursRequired,
      status: q.status, notes: q.notes || '',
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
        firstName: form.firstName, lastName: form.lastName,
        email: form.email || undefined, phone: form.phone || undefined,
        licenseNumber: form.licenseNumber || undefined,
        licenseState: form.licenseState || undefined,
        licenseType: form.licenseType || undefined,
        licenseExpiry: form.licenseExpiry || undefined,
        ceHoursEarned: form.ceHoursEarned, ceHoursRequired: form.ceHoursRequired,
        status: form.status, notes: form.notes || undefined,
      };

      if (editMode && selectedQualifier) {
        const res = await fetch(`/api/qualifiers/${selectedQualifier.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to update qualifier'); }
        toast.success(t('updateSuccess'));
      } else {
        const res = await fetch('/api/qualifiers', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to create qualifier'); }
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
    } catch { toast.error('Failed to delete qualifier'); }
    finally { setDeleting(false); }
  }, [selectedQualifier, fetchQualifiers, t]);

  const handleLinkLicense = useCallback(async () => {
    if (!linkingQualifier || !selectedLicenseId) return;
    setLinking(true);
    try {
      const res = await fetch(`/api/qualifiers/${linkingQualifier.id}/link-license`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId: selectedLicenseId, role: linkRole }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to link license'); }
      toast.success(t('linkSuccess'));
      setLinkDialogOpen(false);
      setSelectedLicenseId('');
      setLinkRole('qualifier');
      if (detailOpen && detailQualifier) {
        const detailRes = await fetch(`/api/qualifiers/${detailQualifier.id}`);
        if (detailRes.ok) { const json = await detailRes.json(); setDetailQualifier(json.qualifier); }
      }
      fetchQualifiers();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to link license'); }
    finally { setLinking(false); }
  }, [linkingQualifier, selectedLicenseId, linkRole, detailOpen, detailQualifier, fetchQualifiers, t]);

  const handleUnlinkLicense = useCallback(async (qualifierId: string, licenseId: string) => {
    try {
      const res = await fetch(`/api/qualifiers/${qualifierId}/link-license/${licenseId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to unlink license');
      toast.success(t('unlinkSuccess'));
      if (detailQualifier) {
        const detailRes = await fetch(`/api/qualifiers/${detailQualifier.id}`);
        if (detailRes.ok) { const json = await detailRes.json(); setDetailQualifier(json.qualifier); }
      }
      fetchQualifiers();
    } catch { toast.error('Failed to unlink license'); }
  }, [detailQualifier, fetchQualifiers, t]);

  return {
    qualifiers, loading, error, counts, pagination,
    statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    addEditOpen, setAddEditOpen,
    detailOpen, setDetailOpen,
    deleteDialogOpen, setDeleteDialogOpen,
    selectedQualifier, setSelectedQualifier,
    editMode, saving, deleting,
    form, setForm,
    linkDialogOpen, setLinkDialogOpen,
    linkingQualifier, setLinkingQualifier,
    orgLicenses,
    selectedLicenseId, setSelectedLicenseId,
    linkRole, setLinkRole,
    linking,
    detailQualifier, detailLoading,
    fetchQualifiers, fetchOrgLicenses, resetForm,
    openAddDialog, openEditDialog, openDetailDialog,
    handleSave, handleDelete, handleLinkLicense, handleUnlinkLicense,
  } as const;
}
