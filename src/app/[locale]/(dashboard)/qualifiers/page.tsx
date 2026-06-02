'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Plus, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRole } from '@/hooks/useRole';
import { fadeIn } from './components/constants';
import { useQualifiers } from './components/useQualifiers';
import { QualifiersLoadingSkeleton } from './components/QualifierBadges';
import { QualifiersStatsCards } from './components/QualifiersStatsCards';
import { QualifiersFilterBar } from './components/QualifiersFilterBar';
import { QualifiersTable } from './components/QualifiersTable';
import { QualifiersMobileCards } from './components/QualifiersMobileCards';
import { QualifiersFormDialog } from './components/QualifiersFormDialog';
import { QualifiersDetailDialog } from './components/QualifiersDetailDialog';
import { DeleteQualifierDialog } from './components/DeleteQualifierDialog';
import { LinkQualifierLicenseDialog } from './components/LinkQualifierLicenseDialog';

export default function QualifiersPage() {
  const t = useTranslations('qualifiers');
  const tc = useTranslations('common');
  const { canManage } = useRole();
  const q = useQualifiers(canManage);

  if (q.loading && q.qualifiers.length === 0) {
    return <QualifiersLoadingSkeleton />;
  }

  if (q.error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="max-w-md w-full rounded-lg border p-6 text-center">
          <p className="text-destructive font-medium">Failed to load qualifiers</p>
          <p className="text-muted-foreground text-sm mt-1">{q.error}</p>
          <Button onClick={q.fetchQualifiers} variant="outline" className="mt-4">
            {tc('retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div {...fadeIn} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('description')}</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={q.openAddDialog}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/25">
            <Plus className="size-4 me-1.5" />
            {t('addQualifier')}
          </Button>
        )}
      </motion.div>

      <QualifiersStatsCards counts={q.counts} />

      <QualifiersFilterBar
        searchQuery={q.searchQuery}
        onSearchChange={q.setSearchQuery}
        statusFilter={q.statusFilter}
        onStatusFilterChange={q.setStatusFilter}
      />

      {q.qualifiers.length === 0 ? (
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
            <Button size="sm" className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/20" onClick={q.openAddDialog}>
              <Plus className="size-4 me-1" />
              {t('addQualifier')}
            </Button>
          )}
        </motion.div>
      ) : (
        <>
          <QualifiersTable qualifiers={q.qualifiers} canManage={canManage} onView={q.openDetailDialog} onEdit={q.openEditDialog} onDelete={(qual) => { q.setSelectedQualifier(qual); q.setDeleteDialogOpen(true); }} />
          <QualifiersMobileCards qualifiers={q.qualifiers} canManage={canManage} onView={q.openDetailDialog} onEdit={q.openEditDialog} onDelete={(qual) => { q.setSelectedQualifier(qual); q.setDeleteDialogOpen(true); }} />
        </>
      )}

      <QualifiersFormDialog open={q.addEditOpen} onOpenChange={(open) => { if (!open) q.resetForm(); q.setAddEditOpen(open); }} editMode={q.editMode} form={q.form} onFormChange={q.setForm} saving={q.saving} onSave={q.handleSave} onCancel={() => { q.setAddEditOpen(false); q.resetForm(); }} />

      <QualifiersDetailDialog open={q.detailOpen} onOpenChange={q.setDetailOpen} detailQualifier={q.detailQualifier} detailLoading={q.detailLoading} canManage={canManage} onLinkLicense={() => { q.setLinkingQualifier(q.detailQualifier); q.fetchOrgLicenses(); q.setLinkDialogOpen(true); }} onEdit={() => { q.setDetailOpen(false); if (q.detailQualifier) q.openEditDialog(q.detailQualifier); }} onDelete={() => { q.setDetailOpen(false); q.setSelectedQualifier(q.detailQualifier); q.setDeleteDialogOpen(true); }} onUnlinkLicense={q.handleUnlinkLicense} />

      <DeleteQualifierDialog open={q.deleteDialogOpen} onOpenChange={q.setDeleteDialogOpen} deleting={q.deleting} onDelete={q.handleDelete} />

      <LinkQualifierLicenseDialog open={q.linkDialogOpen} onOpenChange={q.setLinkDialogOpen} linkingQualifier={q.linkingQualifier} orgLicenses={q.orgLicenses} selectedLicenseId={q.selectedLicenseId} onSelectedLicenseIdChange={q.setSelectedLicenseId} linkRole={q.linkRole} onLinkRoleChange={q.setLinkRole} linking={q.linking} onLink={q.handleLinkLicense} />
    </div>
  );
}
