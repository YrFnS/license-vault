"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { LicenseTable, type License } from "@/components/licenses/LicenseTable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRole } from "@/hooks/useRole";

type StatusFilter =
  | "all"
  | "active"
  | "expiring_soon"
  | "expired"
  | "renewal_needed";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface StatusCounts {
  all: number;
  active: number;
  expiring_soon: number;
  expired: number;
  renewal_needed: number;
}

const LIMIT = 20;

export default function LicensesPage() {
  const t = useTranslations("licenses");
  const tc = useTranslations("common");
  const tb = useTranslations("bulkActions");
  const tR = useTranslations("renewal");
  const locale = useLocale();
  const router = useRouter();
  const { canManage, canManageLicenses } = useRole();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 0,
  });
  const [counts, setCounts] = useState<StatusCounts>({
    all: 0,
    active: 0,
    expiring_soon: 0,
    expired: 0,
    renewal_needed: 0,
  });
  const [exporting, setExporting] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
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

  const getApiStatusParam = useCallback((filter: StatusFilter) => {
    if (filter === "all") return undefined;
    if (filter === "renewal_needed") return "renewalNeeded";
    return filter;
  }, []);

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      const statusParam = getApiStatusParam(statusFilter);
      if (statusParam) params.set("status", statusParam);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const response = await fetch(`/api/licenses?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to fetch licenses");

      const payload = await response.json();
      const nextPagination = payload.pagination || {
        page: 1,
        limit: LIMIT,
        total: 0,
        totalPages: 0,
      };
      const lastPage = Math.max(1, nextPagination.totalPages || 1);
      if (page > lastPage) {
        setPage(lastPage);
        return;
      }

      setLicenses(payload.licenses || []);
      setPagination(nextPagination);
      if (payload.counts) setCounts(payload.counts);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch, getApiStatusParam]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    setSelectedIds(new Set());
    setSelectMode(false);
    setDeleteDialogOpen(false);
  }, [page, statusFilter, debouncedSearch]);

  const handleDeleteLicense = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/licenses/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete");
        toast.success("License deleted");
        fetchLicenses();
      } catch {
        toast.error("Failed to delete license");
      }
    },
    [fetchLicenses],
  );

  const handleRenewLicense = useCallback(
    (id: string) => {
      router.push(`/licenses/${id}`);
    },
    [router],
  );

  const handleExportCSV = useCallback(async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/licenses/export", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to export");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "licenses-export.csv";
      document.body.appendChild(anchor);
      anchor.click();
      URL.revokeObjectURL(url);
      anchor.remove();
      toast.success(t("exportSuccess"));
    } catch {
      toast.error(t("exportError"));
    } finally {
      setExporting(false);
    }
  }, [t]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(licenses.map((license) => license.id)));
  }, [licenses]);

  const handleDeselectAll = useCallback(() => setSelectedIds(new Set()), []);

  const handleCancelSelect = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleBulkDelete = useCallback(async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    setBulkDeleting(true);
    try {
      const response = await fetch("/api/licenses/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Bulk delete failed");

      toast.success(
        tb("deleteSuccess", {
          count: payload.deleted,
          plural: payload.deleted > 1 ? "s" : "",
        }),
      );
      setSelectedIds(new Set());
      setSelectMode(false);
      setDeleteDialogOpen(false);

      if (ids.length === licenses.length && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      } else {
        fetchLicenses();
      }
    } catch {
      toast.error(tb("deleteError"));
    } finally {
      setBulkDeleting(false);
    }
  }, [selectedIds, tb, licenses.length, page, fetchLicenses]);

  const handleExportSelected = useCallback(() => {
    try {
      const selectedLicenses = licenses.filter((license) =>
        selectedIds.has(license.id),
      );
      if (selectedLicenses.length === 0) return;

      const headers = [
        "Name",
        "Type",
        "License Number",
        "Issued By",
        "Issue Date",
        "Expiration Date",
        "Status",
        "Notes",
      ];
      const rows = selectedLicenses.map((license) =>
        [
          license.name,
          license.type,
          license.licenseNumber,
          license.issuedBy,
          license.issueDate,
          license.expirationDate,
          license.status,
          license.notes || "",
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      );
      const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "licenses-selected-export.csv";
      document.body.appendChild(anchor);
      anchor.click();
      URL.revokeObjectURL(url);
      anchor.remove();
      toast.success(t("exportSuccess"));
    } catch {
      toast.error(t("exportError"));
    }
  }, [licenses, selectedIds, t]);

  const allSelected =
    licenses.length > 0 && selectedIds.size === licenses.length;
  const someSelected = selectedIds.size > 0 && !allSelected;
  const PreviousIcon = locale === "ar" ? ChevronRight : ChevronLeft;
  const NextIcon = locale === "ar" ? ChevronLeft : ChevronRight;

  const filterTabs: Array<{
    value: StatusFilter;
    label: string;
    count: number;
    dot?: string;
  }> = [
    { value: "all", label: t("all"), count: counts.all },
    {
      value: "active",
      label: t("active"),
      count: counts.active,
      dot: "bg-emerald-500",
    },
    {
      value: "expiring_soon",
      label: t("expiringSoon"),
      count: counts.expiring_soon,
      dot: "bg-amber-500",
    },
    {
      value: "expired",
      label: t("expired"),
      count: counts.expired,
      dot: "bg-red-500",
    },
    {
      value: "renewal_needed",
      label: tR("renewalNeeded"),
      count: counts.renewal_needed,
      dot: "bg-blue-500",
    },
  ];

  if (loading && licenses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="font-medium text-red-600">Failed to load licenses</p>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <Button onClick={fetchLicenses} variant="outline" className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t("title")}
          </h1>
          {pagination.total > 0 && (
            <span className="text-xs tabular-nums text-slate-500">
              {pagination.total} total
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!selectMode ? (
            <>
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectMode(true)}
                  disabled={counts.all === 0}
                >
                  <CheckSquare className="me-1.5 size-3.5" />
                  {tb("selectMode")}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={exporting || counts.all === 0}
              >
                <Download className="me-1.5 size-3.5" />
                {exporting ? tc("loading") : t("exportCsv")}
              </Button>
              {canManageLicenses && (
                <Button
                  size="sm"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  asChild
                >
                  <Link href="/licenses/new">
                    <Plus className="me-1.5 size-3.5" />
                    {t("addNew")}
                  </Link>
                </Button>
              )}
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={handleCancelSelect}>
              <X className="me-1.5 size-3.5" />
              {tb("cancelSelect")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={tc("search")}
            aria-label={tc("search")}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="border-slate-200 ps-9 dark:border-slate-700"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto" role="group">
          {filterTabs.map((tab) => (
            <button
              type="button"
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              aria-pressed={statusFilter === tab.value}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === tab.value
                  ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {tab.dot && <span className={`size-1.5 rounded-full ${tab.dot}`} />}
              {tab.label}
              <span className="tabular-nums text-slate-400">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {licenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
            <FileText className="size-8 text-slate-400" />
          </div>
          <p className="font-medium text-slate-700 dark:text-slate-300">
            {t("noLicenses")}
          </p>
          {counts.all === 0 && canManageLicenses && (
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/licenses/new">
                <Plus className="me-1 size-4" />
                {t("addNew")}
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <LicenseTable
              licenses={licenses}
              onDelete={handleDeleteLicense}
              onRenew={handleRenewLicense}
              selectMode={selectMode}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              allSelected={allSelected}
              someSelected={someSelected}
              canManage={canManageLicenses}
            />
          </CardContent>
        </Card>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs tabular-nums text-slate-500">
            {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={pagination.page <= 1}
              aria-label={locale === "ar" ? "الصفحة السابقة" : "Previous page"}
            >
              <PreviousIcon className="size-4" />
            </Button>
            <span className="px-2 text-xs tabular-nums text-slate-500">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((current) => Math.min(pagination.totalPages, current + 1))
              }
              disabled={pagination.page >= pagination.totalPages}
              aria-label={locale === "ar" ? "الصفحة التالية" : "Next page"}
            >
              <NextIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {selectMode && selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {tb("selected", { count: selectedIds.size })}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportSelected}>
                <Download className="me-1.5 size-3.5" />
                {tb("exportSelected")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="me-1.5 size-3.5" />
                {tb("deleteSelected")}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancelSelect}>
                {tb("cancelSelect")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc("confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tb("deleteConfirm", {
                count: selectedIds.size,
                plural: selectedIds.size > 1 ? "s" : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>
              {tc("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {bulkDeleting && <Loader2 className="me-2 size-4 animate-spin" />}
              {tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
