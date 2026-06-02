'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, FileIcon, Activity } from 'lucide-react';
import { RenewalDialog } from '@/components/licenses/RenewalDialog';
import { DocumentManager } from '@/components/licenses/DocumentManager';
import { toast } from 'sonner';
import { useRole } from '@/hooks/useRole';
import type { LicenseData, ActivityEntry } from './components/types';
import {
  LicenseHeader, MobileActionBar, QuickStatsGrid, RenewalPreview,
  LicenseEditForm, LicenseViewCard, RenewalSection, ActivityTimeline,
  LoadingState, ErrorState,
} from './components';

export default function LicenseDetailPage() {
  const t = useTranslations('licenses');
  const tc = useTranslations('common');
  const tR = useTranslations('renewal');
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
  const [editForm, setEditForm] = useState({
    name: '', type: '', licenseNumber: '', issuedBy: '',
    issueDate: '', expirationDate: '', notes: '',
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
    } catch { /* silently fail */ }
    finally { setActivityLoading(false); }
  }, [id]);

  useEffect(() => { fetchLicense(); }, [fetchLicense]);
  useEffect(() => { if (activeTab === 'activity') fetchActivity(); }, [activeTab, fetchActivity]);

  const enterEditMode = useCallback(() => {
    if (!license) return;
    setEditForm({
      name: license.name, type: license.type,
      licenseNumber: license.licenseNumber, issuedBy: license.issuedBy,
      issueDate: license.issueDate.split('T')[0],
      expirationDate: license.expirationDate.split('T')[0],
      notes: license.notes || '',
    });
    setIsEditing(true);
  }, [license]);

  const handleSave = async () => {
    if (!license) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/licenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name, type: editForm.type,
          licenseNumber: editForm.licenseNumber, issuedBy: editForm.issuedBy,
          issueDate: editForm.issueDate, expirationDate: editForm.expirationDate,
          notes: editForm.notes || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(t('detail.editSuccess'));
      setIsEditing(false);
      fetchLicense();
    } catch { toast.error(t('detail.editError')); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('License deleted successfully');
      router.push('/licenses');
    } catch { toast.error('Failed to delete license'); }
  };

  const handleRenewed = useCallback(() => {
    toast.success(tR('success'));
    fetchLicense();
  }, [fetchLicense, tR]);

  const daysUntilExpiration = useMemo(() => {
    if (!license) return null;
    return Math.ceil((new Date(license.expirationDate).getTime() - Date.now()) / 86400000);
  }, [license]);

  const daysActive = useMemo(() => {
    if (!license) return null;
    return Math.max(0, Math.floor((Date.now() - new Date(license.issueDate).getTime()) / 86400000));
  }, [license]);

  if (loading) return <LoadingState />;
  if (error || !license) return <ErrorState error={error} onRetry={fetchLicense} />;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <LicenseHeader
        license={license} isEditing={isEditing} saving={saving}
        daysUntilExpiration={daysUntilExpiration} canManageLicenses={canManageLicenses}
        onEnterEditMode={enterEditMode} onCancelEdit={() => setIsEditing(false)}
        onSave={handleSave} onDelete={handleDelete}
        onRenewClick={() => setRenewalDialogOpen(true)}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview" className="gap-1.5"><FileText className="size-3.5" />{t('tabOverview')}</TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5"><FileIcon className="size-3.5" />{t('tabDocuments')}</TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5"><Activity className="size-3.5" />{t('tabActivity')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <QuickStatsGrid daysActive={daysActive} daysUntilExpiration={daysUntilExpiration} isRenewed={license.isRenewed} />

          {!isEditing && canManageLicenses && (
            <RenewalPreview daysUntilExpiration={daysUntilExpiration} onRenewClick={() => setRenewalDialogOpen(true)} />
          )}

          <Card className={`transition-colors duration-300 ${isEditing ? 'border-teal-400 dark:border-teal-600 bg-teal-50/30 dark:bg-teal-950/10' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                {tc('viewDetails')}
                {isEditing && <Badge variant="outline" className="ms-2 border-teal-400 text-teal-700 dark:border-teal-600 dark:text-teal-400 text-xs">{t('detail.editing')}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? <LicenseEditForm editForm={editForm} setEditForm={setEditForm} /> : <LicenseViewCard license={license} />}
            </CardContent>
          </Card>

          {!isEditing && canManageLicenses && (
            <RenewalSection license={license} autoRenew={autoRenew} setAutoRenew={setAutoRenew} daysUntilExpiration={daysUntilExpiration} />
          )}
        </TabsContent>

        <TabsContent value="documents">
          <DocumentManager licenseId={id} userRole={role} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityTimeline activityEntries={activityEntries} activityLoading={activityLoading} />
        </TabsContent>
      </Tabs>

      {license && <RenewalDialog open={renewalDialogOpen} onOpenChange={setRenewalDialogOpen} license={license} onRenewed={handleRenewed} />}

      <MobileActionBar
        license={license} isEditing={isEditing} saving={saving} canManageLicenses={canManageLicenses}
        onEnterEditMode={enterEditMode} onCancelEdit={() => setIsEditing(false)}
        onSave={handleSave} onDelete={handleDelete} onRenewClick={() => setRenewalDialogOpen(true)}
      />
    </div>
  );
}
