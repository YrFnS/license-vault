"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plus, Send } from "lucide-react";
import { useSubcontractors } from "./hooks/useSubcontractors";
import type { Subcontractor } from "./types";
import LoadingState from "./components/LoadingState";
import ErrorState from "./components/ErrorState";
import SubcontractorStats from "./components/SubcontractorStats";
import SubcontractorFilters from "./components/SubcontractorFilters";
import SubcontractorTable from "./components/SubcontractorTable";
import EmptyState from "./components/EmptyState";
import PaginationBar from "./components/Pagination";
import BulkActionBar from "./components/BulkActionBar";
import AddEditDialog from "./components/AddEditDialog";
import DetailDialog from "./components/DetailDialog";
import DeleteDialog from "./components/DeleteDialog";
import BulkRequestDialog from "./components/BulkRequestDialog";

export default function SubcontractorsPage() {
  const t = useTranslations("subcontractors");
  const h = useSubcontractors();

  if (h.loading && h.subs.length === 0) return <LoadingState />;
  if (h.error) return <ErrorState error={h.error} onRetry={h.fetchSubs} />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t("title")}
          </h1>
          <p className="text-sm text-slate-500">{t("description")}</p>
        </div>
        {h.canManage && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => h.setBulkRequestOpen(true)}>
              <Send className="size-3.5 me-1.5" />
              {t("requestCOIs")}
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={h.openAdd}
            >
              <Plus className="size-3.5 me-1.5" />
              {t("addSubcontractor")}
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <SubcontractorStats counts={h.counts} />

      {/* Filters + Search */}
      <SubcontractorFilters
        counts={h.counts}
        complianceFilter={h.complianceFilter}
        onFilterChange={h.setComplianceFilter}
        searchQuery={h.searchQuery}
        onSearchChange={h.setSearchQuery}
      />

      {/* Bulk bar */}
      {h.selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={h.selectedIds.size}
          bulkRequesting={h.bulkRequesting}
          onBulkRequest={h.handleBulkSelectedRequest}
          onCancel={h.clearSelection}
        />
      )}

      {/* Content */}
      {h.subs.length === 0 ? (
        <EmptyState canManage={h.canManage} onAdd={h.openAdd} />
      ) : (
        <>
          <SubcontractorTable
            subs={h.subs}
            selectedIds={h.selectedIds}
            canManage={h.canManage}
            requestingDocs={h.requestingDocs}
            onToggleSelect={h.toggleSelect}
            onToggleSelectAll={h.toggleSelectAll}
            onView={h.openDetailDialog}
            onRequestDocs={h.handleRequestDocs}
            onEdit={h.openEdit}
            onDelete={(sub: Subcontractor) => {
              h.setSelectedSub(sub);
              h.setDeleteDialogOpen(true);
            }}
          />
          {h.pagination.totalPages > 1 && (
            <PaginationBar pagination={h.pagination} onPageChange={h.setPage} />
          )}
        </>
      )}

      {/* Dialogs */}
      <AddEditDialog
        open={h.addEditOpen}
        onOpenChange={h.setAddEditOpen}
        editMode={h.editMode}
        form={h.form}
        setForm={h.setForm}
        saving={h.saving}
        onSave={h.handleSave}
        onCancel={() => {
          h.resetForm();
          h.setAddEditOpen(false);
        }}
      />

      <DetailDialog
        open={h.detailOpen}
        onOpenChange={h.setDetailOpen}
        detailSub={h.detailSub}
        canManage={h.canManage}
        requestingDocs={h.requestingDocs}
        onRequestDocs={h.handleRequestDocs}
        onEdit={h.openEdit}
      />

      <DeleteDialog
        open={h.deleteDialogOpen}
        onOpenChange={h.setDeleteDialogOpen}
        deleting={h.deleting}
        onDelete={h.handleDelete}
      />

      <BulkRequestDialog
        open={h.bulkRequestOpen}
        onOpenChange={h.setBulkRequestOpen}
        bulkRequesting={h.bulkRequesting}
        subs={h.subs}
        onBulkRequest={h.handleBulkRequest}
      />
    </div>
  );
}
