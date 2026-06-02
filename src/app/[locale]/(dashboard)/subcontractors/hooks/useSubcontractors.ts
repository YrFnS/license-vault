"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRole } from "@/hooks/useRole";
import { toast } from "sonner";
import type { Subcontractor, PaginationInfo, StatusCounts, SubcontractorForm } from "../types";
import { EMPTY_FORM } from "../types";
import { LIMIT } from "../constants";
import { toPayload, toForm } from "../helpers";

export function useSubcontractors() {
  const t = useTranslations("subcontractors");
  const { canManage } = useRole();

  const [subs, setSubs] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [complianceFilter, setComplianceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 0,
  });
  const [counts, setCounts] = useState<StatusCounts>({
    total: 0,
    active: 0,
    compliant: 0,
    non_compliant: 0,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkRequestOpen, setBulkRequestOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subcontractor | null>(null);
  const [detailSub, setDetailSub] = useState<Subcontractor | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [requestingDocs, setRequestingDocs] = useState(false);
  const [bulkRequesting, setBulkRequesting] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [form, setForm] = useState<SubcontractorForm>(EMPTY_FORM);

  // Debounced search
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

  // Fetch
  const fetchSubs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (complianceFilter !== "all") params.set("compliance", complianceFilter);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      const res = await fetch(`/api/subcontractors?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setSubs(json.subcontractors || []);
      setPagination(
        json.pagination || { page: 1, limit: LIMIT, total: 0, totalPages: 0 },
      );
      if (json.counts) setCounts(json.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, complianceFilter, debouncedSearch]);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  useEffect(() => {
    setPage(1);
  }, [complianceFilter]);

  // Form helpers
  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditMode(false);
    setSelectedSub(null);
  }, []);

  const openAdd = useCallback(() => {
    resetForm();
    setAddEditOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((sub: Subcontractor) => {
    setForm(toForm(sub));
    setSelectedSub(sub);
    setEditMode(true);
    setAddEditOpen(true);
  }, []);

  const openDetailDialog = useCallback(async (sub: Subcontractor) => {
    setDetailOpen(true);
    setDetailSub(sub);
    try {
      const res = await fetch(`/api/subcontractors/${sub.id}`);
      if (res.ok) setDetailSub((await res.json()).subcontractor);
    } catch {
      /* ignore */
    }
  }, []);

  // CRUD
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload = toPayload(form);
      if (editMode && selectedSub) {
        const res = await fetch(`/api/subcontractors/${selectedSub.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed");
        toast.success(t("updateSuccess"));
      } else {
        const res = await fetch("/api/subcontractors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed");
        toast.success(t("createSuccess"));
      }
      setAddEditOpen(false);
      resetForm();
      fetchSubs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }, [editMode, selectedSub, form, fetchSubs, resetForm, t]);

  const handleDelete = useCallback(async () => {
    if (!selectedSub) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/subcontractors/${selectedSub.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(t("deleteSuccess"));
      setDeleteDialogOpen(false);
      setSelectedSub(null);
      fetchSubs();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  }, [selectedSub, fetchSubs, t]);

  // Doc requests
  const handleRequestDocs = useCallback(
    async (sub: Subcontractor) => {
      setRequestingDocs(true);
      try {
        const res = await fetch(`/api/subcontractors/${sub.id}/request-docs`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        toast.success(t("docsRequested"));
        if (data.uploadUrl) {
          await navigator.clipboard.writeText(
            window.location.origin + data.uploadUrl,
          );
          toast.success(t("uploadLinkCopied"));
        }
      } catch {
        toast.error("Failed");
      } finally {
        setRequestingDocs(false);
      }
    },
    [t],
  );

  const handleBulkRequest = useCallback(async () => {
    setBulkRequesting(true);
    try {
      const targets = subs.filter(
        (s) =>
          s.complianceStatus === "non_compliant" ||
          s.complianceStatus === "pending",
      );
      let ok = 0;
      for (const sub of targets) {
        const r = await fetch(`/api/subcontractors/${sub.id}/request-docs`, {
          method: "POST",
        });
        if (r.ok) ok++;
      }
      toast.success(t("bulkRequestSent", { count: ok }));
      setBulkRequestOpen(false);
      fetchSubs();
    } catch {
      toast.error("Failed");
    } finally {
      setBulkRequesting(false);
    }
  }, [subs, fetchSubs, t]);

  // Selection
  const toggleSelect = useCallback(
    (id: string) =>
      setSelectedIds((prev) => {
        const n = new Set(prev);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      }),
    [],
  );

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === subs.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(subs.map((s) => s.id)));
  }, [selectedIds.size, subs]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  return {
    // Data
    subs,
    loading,
    error,
    pagination,
    counts,
    searchQuery,
    debouncedSearch,
    complianceFilter,
    form,
    selectedIds,
    // Dialogs
    addEditOpen,
    detailOpen,
    deleteDialogOpen,
    bulkRequestOpen,
    selectedSub,
    detailSub,
    editMode,
    // Loading states
    saving,
    deleting,
    requestingDocs,
    bulkRequesting,
    // Permissions
    canManage,
    // Setters
    setSearchQuery,
    setComplianceFilter,
    setPage,
    setForm,
    setSelectedSub,
    setDetailSub,
    setAddEditOpen,
    setDetailOpen,
    setDeleteDialogOpen,
    setBulkRequestOpen,
    // Actions
    fetchSubs,
    resetForm,
    openAdd,
    openEdit,
    openDetailDialog,
    handleSave,
    handleDelete,
    handleRequestDocs,
    handleBulkRequest,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
  };
}
