'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { GraduationCap, Plus } from 'lucide-react';
import { useCETracking } from './components/useCETracking';
import { CELoadingSkeleton } from './components/CELoadingSkeleton';
import { SummaryCards } from './components/SummaryCards';
import { ProgressSection } from './components/ProgressSection';
import { CEFilter } from './components/CEFilter';
import { CEEmptyState } from './components/CEEmptyState';
import { CERecordsTable } from './components/CERecordsTable';
import { CERecordsCards } from './components/CERecordsCards';
import { CEFormDialog } from './components/CEFormDialog';
import { CEDeleteDialog } from './components/CEDeleteDialog';

export default function CETrackingPage() {
  const t = useTranslations('ceTracking');
  const {
    records,
    licenses,
    loading,
    canManage,
    filterLicenseId,
    setFilterLicenseId,
    dialogOpen,
    closeDialog,
    editingRecord,
    saving,
    deleteId,
    setDeleteId,
    deleting,
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
    openAddDialog,
    openEditDialog,
    handleSave,
    handleDelete,
    summaryCards,
    totalHours,
    totalRequired,
    formatDate,
    getCategoryLabel,
    getLicenseName,
  } = useCETracking();

  if (loading) {
    return <CELoadingSkeleton />;
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
      <SummaryCards cards={summaryCards} />

      {/* Progress Bar */}
      <ProgressSection totalHours={totalHours} totalRequired={totalRequired} />

      {/* Filter */}
      <CEFilter
        filterLicenseId={filterLicenseId}
        setFilterLicenseId={setFilterLicenseId}
        licenses={licenses}
      />

      {/* Empty State */}
      {records.length === 0 && (
        <CEEmptyState canManage={canManage} onAdd={openAddDialog} />
      )}

      {/* Desktop Table */}
      {records.length > 0 && (
        <CERecordsTable
          records={records}
          canManage={canManage}
          formatDate={formatDate}
          getCategoryLabel={getCategoryLabel}
          getLicenseName={getLicenseName}
          onEdit={openEditDialog}
          onDelete={setDeleteId}
        />
      )}

      {/* Mobile Cards */}
      {records.length > 0 && (
        <CERecordsCards
          records={records}
          canManage={canManage}
          formatDate={formatDate}
          getCategoryLabel={getCategoryLabel}
          getLicenseName={getLicenseName}
          onEdit={openEditDialog}
          onDelete={setDeleteId}
        />
      )}

      {/* Add/Edit Dialog */}
      <CEFormDialog
        open={dialogOpen}
        onOpenChange={closeDialog}
        editingRecord={!!editingRecord}
        saving={saving}
        licenses={licenses}
        formLicenseId={formLicenseId}
        setFormLicenseId={setFormLicenseId}
        formCourseName={formCourseName}
        setFormCourseName={setFormCourseName}
        formProvider={formProvider}
        setFormProvider={setFormProvider}
        formHoursEarned={formHoursEarned}
        setFormHoursEarned={setFormHoursEarned}
        formHoursRequired={formHoursRequired}
        setFormHoursRequired={setFormHoursRequired}
        formCompletionDate={formCompletionDate}
        setFormCompletionDate={setFormCompletionDate}
        formCategory={formCategory}
        setFormCategory={setFormCategory}
        formNotes={formNotes}
        setFormNotes={setFormNotes}
        getCategoryLabel={getCategoryLabel}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <CEDeleteDialog
        deleteId={deleteId}
        deleting={deleting}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
