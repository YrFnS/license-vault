'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBoardSubmissions } from './components/useBoardSubmissions';
import { StatsCards } from './components/StatsCards';
import { SearchFilters } from './components/SearchFilters';
import { SubmissionList } from './components/SubmissionList';
import { SubmissionWizard } from './components/SubmissionWizard';
import { DetailDialog } from './components/DetailDialog';
import { ConfirmDialogs } from './components/ConfirmDialogs';
import { getSubmissionTypeLabel, getPriorityLabel } from './components/helpers';

export default function BoardSubmissionsPage() {
  const hook = useBoardSubmissions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            {hook.t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{hook.t('description')}</p>
        </div>
        <Button
          onClick={() => { hook.resetWizard(); hook.setWizardOpen(true); }}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/25"
        >
          <Plus className="size-4 me-2" />
          {hook.t('newSubmission')}
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards statCards={hook.statCards} />

      {/* Search & Filters */}
      <SearchFilters
        search={hook.search}
        onSearchChange={hook.setSearch}
        filterState={hook.filterState}
        onFilterStateChange={hook.setFilterState}
        filterType={hook.filterType}
        onFilterTypeChange={hook.setFilterType}
        filterPriority={hook.filterPriority}
        onFilterPriorityChange={hook.setFilterPriority}
        t={hook.t}
        tc={hook.tc}
      />

      {/* Tabs & List */}
      <SubmissionList
        submissions={hook.submissions}
        loading={hook.loading}
        activeTab={hook.activeTab}
        onTabChange={hook.setActiveTab}
        tabs={hook.tabs}
        onView={(sub) => { hook.setSelectedSubmission(sub); hook.setDetailOpen(true); }}
        onDelete={(sub) => { hook.setDeleteTarget(sub); hook.setDeleteOpen(true); }}
        onSubmitToBoard={(sub) => { hook.setSubmitTarget(sub); hook.setSubmitConfirmOpen(true); }}
        t={hook.t}
        tc={hook.tc}
        getStatusLabel={hook.getStatusLabel}
      />

      {/* New Submission Wizard */}
      <SubmissionWizard
        open={hook.wizardOpen}
        onOpenChange={hook.setWizardOpen}
        step={hook.wizardStep}
        onStepChange={hook.setWizardStep}
        data={hook.wizardData}
        onDataChange={hook.setWizardData}
        templates={hook.templates}
        selectedTemplate={hook.selectedTemplate}
        formFields={hook.formFields}
        onFormFieldsChange={hook.setFormFields}
        onFetchTemplates={hook.fetchTemplates}
        onSubmit={hook.handleCreate}
        onReset={hook.resetWizard}
        t={hook.t}
        tc={hook.tc}
        getSubmissionTypeLabel={getSubmissionTypeLabel}
        getPriorityLabel={getPriorityLabel}
      />

      {/* Detail Dialog */}
      <DetailDialog
        open={hook.detailOpen}
        onOpenChange={hook.setDetailOpen}
        submission={hook.selectedSubmission}
        onSubmitToBoard={(sub) => { hook.setSubmitTarget(sub); hook.setSubmitConfirmOpen(true); }}
        onDelete={(sub) => { hook.setDeleteTarget(sub); hook.setDeleteOpen(true); }}
        onMarkStatus={hook.handleMarkStatus}
        onToggleChecklist={hook.toggleChecklistItem}
        t={hook.t}
        tc={hook.tc}
        getStatusLabel={hook.getStatusLabel}
      />

      {/* Confirm Dialogs */}
      <ConfirmDialogs
        submitConfirmOpen={hook.submitConfirmOpen}
        onSubmitConfirmOpenChange={hook.setSubmitConfirmOpen}
        submitTarget={hook.submitTarget}
        submitting={hook.submitting}
        onSubmitToBoard={hook.handleSubmitToBoard}
        deleteOpen={hook.deleteOpen}
        onDeleteOpenChange={hook.setDeleteOpen}
        onDelete={hook.handleDelete}
        t={hook.t}
        tc={hook.tc}
      />
    </div>
  );
}
