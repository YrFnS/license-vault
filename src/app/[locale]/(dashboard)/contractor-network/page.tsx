"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Users, Plus, ShieldCheck, Ban, Loader2, Upload, Download,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";

import type { Contractor, PaginationInfo, DirectoryStats, ScoreBreakdown } from "./components/types";
import { LIMIT, fadeIn } from "./components/types";
import { StatsCards } from "./components/StatsCards";
import { SearchFilterBar } from "./components/SearchFilterBar";
import { ContractorCard } from "./components/ContractorCard";
import { ContractorTable } from "./components/ContractorTable";
import { AddContractorDialog } from "./components/AddContractorDialog";
import { ContractorDetailDialog } from "./components/ContractorDetailDialog";
import { ImportDialog } from "./components/ImportDialog";
import { VerifyBlacklistDialogs } from "./components/VerifyBlacklistDialogs";

const EMPTY_FORM = {
	companyName: "",
	tradeType: "general",
	licenseNumber: "",
	licenseState: "",
	licenseStatus: "unknown",
	licenseExpiry: "",
	contactName: "",
	contactEmail: "",
	contactPhone: "",
	address: "",
	city: "",
	state: "",
	zip: "",
	website: "",
	insuranceProvider: "",
	insuranceExpiry: "",
	insuranceStatus: "unknown",
	bondingCapacity: "",
	totalProjects: "",
	completedProjects: "",
	rating: "",
	yearsInBusiness: "",
	employeeCount: "",
	notes: "",
};

export default function ContractorNetworkPage() {
	const t = useTranslations("contractorNetwork");
	const tc = useTranslations("common");
	const { canManage } = useRole();

	const [contractors, setContractors] = useState<Contractor[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [tradeFilter, setTradeFilter] = useState("all");
	const [stateFilter, setStateFilter] = useState("all");
	const [licenseStatusFilter, setLicenseStatusFilter] = useState("all");
	const [insuranceStatusFilter, setInsuranceStatusFilter] = useState("all");
	const [page, setPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: LIMIT, total: 0, totalPages: 0 });
	const [stats, setStats] = useState<DirectoryStats | null>(null);
	const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [addOpen, setAddOpen] = useState(false);
	const [detailOpen, setDetailOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);
	const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
	const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
	const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
	const [detailContractor, setDetailContractor] = useState<Contractor | null>(null);
	const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
	const [saving, setSaving] = useState(false);
	const [importing, setImporting] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [form, setForm] = useState({ ...EMPTY_FORM });

	const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => {
		if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		searchTimerRef.current = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(1); }, 300);
		return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
	}, [searchQuery]);

	const fetchContractors = useCallback(async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
			if (tradeFilter !== "all") params.set("tradeType", tradeFilter);
			if (stateFilter !== "all") params.set("state", stateFilter);
			if (licenseStatusFilter !== "all") params.set("licenseStatus", licenseStatusFilter);
			if (insuranceStatusFilter !== "all") params.set("insuranceStatus", insuranceStatusFilter);
			if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
			const res = await fetch(`/api/contractor-directory?${params.toString()}`);
			if (!res.ok) throw new Error("Failed to fetch contractors");
			const json = await res.json();
			setContractors(json.contractors || []);
			setPagination(json.pagination || { page: 1, limit: LIMIT, total: 0, totalPages: 0 });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setLoading(false);
		}
	}, [page, tradeFilter, stateFilter, licenseStatusFilter, insuranceStatusFilter, debouncedSearch]);

	const fetchStats = useCallback(async () => {
		try {
			const res = await fetch("/api/contractor-directory/stats");
			if (res.ok) { const json = await res.json(); setStats(json); }
		} catch { /* ignore */ }
	}, []);

	useEffect(() => { fetchContractors(); }, [fetchContractors]);
	useEffect(() => { fetchStats(); }, [fetchStats]);
	useEffect(() => { setPage(1); }, [tradeFilter, stateFilter, licenseStatusFilter, insuranceStatusFilter]);

	const resetForm = useCallback(() => { setForm({ ...EMPTY_FORM }); }, []);

	const openDetail = useCallback(async (c: Contractor) => {
		setDetailOpen(true);
		setDetailContractor(c);
		try {
			const [detailRes, scoreRes] = await Promise.all([
				fetch(`/api/contractor-directory/${c.id}`),
				fetch(`/api/contractor-directory/${c.id}/score`),
			]);
			if (detailRes.ok) { const json = await detailRes.json(); setDetailContractor(json.contractor); }
			if (scoreRes.ok) { const json = await scoreRes.json(); setScoreBreakdown(json.breakdown); }
		} catch { /* ignore */ }
	}, []);

	const handleSave = useCallback(async () => {
		if (!form.companyName || !form.tradeType) { toast.error("Company name and trade type are required"); return; }
		setSaving(true);
		try {
			const payload: any = {
				companyName: form.companyName, tradeType: form.tradeType,
				licenseNumber: form.licenseNumber || undefined,
				licenseState: form.licenseState || undefined,
				licenseStatus: form.licenseStatus || undefined,
				licenseExpiry: form.licenseExpiry || undefined,
				contactName: form.contactName || undefined,
				contactEmail: form.contactEmail || undefined,
				contactPhone: form.contactPhone || undefined,
				address: form.address || undefined, city: form.city || undefined,
				state: form.state || undefined, zip: form.zip || undefined,
				website: form.website || undefined,
				insuranceProvider: form.insuranceProvider || undefined,
				insuranceExpiry: form.insuranceExpiry || undefined,
				insuranceStatus: form.insuranceStatus || undefined,
				bondingCapacity: form.bondingCapacity ? parseFloat(form.bondingCapacity) : undefined,
				totalProjects: form.totalProjects ? parseInt(form.totalProjects) : undefined,
				completedProjects: form.completedProjects ? parseInt(form.completedProjects) : undefined,
				rating: form.rating ? parseFloat(form.rating) : undefined,
				yearsInBusiness: form.yearsInBusiness ? parseInt(form.yearsInBusiness) : undefined,
				employeeCount: form.employeeCount || undefined,
				notes: form.notes || undefined,
			};
			const res = await fetch("/api/contractor-directory", {
				method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
			});
			if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Failed to create contractor"); }
			toast.success("Contractor added successfully");
			setAddOpen(false); resetForm(); fetchContractors(); fetchStats();
		} catch (err) { toast.error(err instanceof Error ? err.message : "An error occurred"); }
		finally { setSaving(false); }
	}, [form, fetchContractors, fetchStats, resetForm]);

	const handleVerify = useCallback(async () => {
		if (!selectedContractor) return;
		try {
			const res = await fetch(`/api/contractor-directory/${selectedContractor.id}/verify`, { method: "POST" });
			if (!res.ok) throw new Error("Failed to verify contractor");
			toast.success("Contractor verified successfully");
			setVerifyDialogOpen(false); setSelectedContractor(null);
			fetchContractors(); fetchStats();
			if (detailOpen && detailContractor?.id === selectedContractor.id) {
				openDetail({ ...selectedContractor, isVerified: true });
			}
		} catch { toast.error("Failed to verify contractor"); }
	}, [selectedContractor, fetchContractors, fetchStats, detailOpen, detailContractor, openDetail]);

	const handleBlacklist = useCallback(async () => {
		if (!selectedContractor) return;
		try {
			const res = await fetch(`/api/contractor-directory/${selectedContractor.id}`, {
				method: "PUT", headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isBlacklisted: !selectedContractor.isBlacklisted }),
			});
			if (!res.ok) throw new Error("Failed to update contractor");
			toast.success(selectedContractor.isBlacklisted ? "Contractor removed from blacklist" : "Contractor blacklisted");
			setBlacklistDialogOpen(false); setSelectedContractor(null);
			fetchContractors(); fetchStats();
		} catch { toast.error("Failed to update contractor"); }
	}, [selectedContractor, fetchContractors, fetchStats]);

	const handleBulkVerify = useCallback(async () => {
		setSaving(true);
		try {
			let count = 0;
			for (const id of selectedIds) {
				const res = await fetch(`/api/contractor-directory/${id}/verify`, { method: "POST" });
				if (res.ok) count++;
			}
			toast.success(`${count} contractor(s) verified`);
			setSelectedIds(new Set()); fetchContractors(); fetchStats();
		} catch { toast.error("Failed to verify some contractors"); }
		finally { setSaving(false); }
	}, [selectedIds, fetchContractors, fetchStats]);

	const handleBulkBlacklist = useCallback(async () => {
		setSaving(true);
		try {
			let count = 0;
			for (const id of selectedIds) {
				const res = await fetch(`/api/contractor-directory/${id}`, {
					method: "PUT", headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ isBlacklisted: true }),
				});
				if (res.ok) count++;
			}
			toast.success(`${count} contractor(s) blacklisted`);
			setSelectedIds(new Set()); fetchContractors(); fetchStats();
		} catch { toast.error("Failed to blacklist some contractors"); }
		finally { setSaving(false); }
	}, [selectedIds, fetchContractors, fetchStats]);

	const handleExport = useCallback(() => {
		const headers = ["Company Name", "Trade Type", "License Number", "License State", "License Status",
			"Contact Name", "Contact Email", "Contact Phone", "City", "State", "Compliance Score", "Rating", "Verified", "Preferred"];
		const rows = contractors.map((c) => [c.companyName, c.tradeType, c.licenseNumber || "", c.licenseState || "",
			c.licenseStatus, c.contactName || "", c.contactEmail || "", c.contactPhone || "",
			c.city || "", c.state || "", c.complianceScore, c.rating, c.isVerified ? "Yes" : "No", c.isPreferred ? "Yes" : "No"]);
		const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a"); a.href = url; a.download = "contractor-directory.csv"; a.click();
		URL.revokeObjectURL(url);
		toast.success("Exported successfully");
	}, [contractors]);

	const handleImport = useCallback(async () => {
		setImporting(true);
		try {
			const input = document.createElement("input");
			input.type = "file"; input.accept = ".csv";
			input.onchange = async (e: any) => {
				const file = e.target.files?.[0];
				if (!file) { setImporting(false); return; }
				const text = await file.text();
				const lines = text.split("\n").filter((l) => l.trim());
				if (lines.length < 2) { toast.error("CSV file must have a header row and at least one data row"); setImporting(false); return; }
				const headerLine = lines[0];
				const headers = headerLine.split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase().replace(/\s+/g, ""));
				const parsedContractors: Record<string, string>[] = [];
				for (let i = 1; i < lines.length; i++) {
					const values = lines[i].match(/(".*?"|[^",]+)/g)?.map((v) => v.trim().replace(/^"|"$/g, "")) || [];
					const row = {};
					headers.forEach((h, idx) => { row[h] = values[idx] || ""; });
					parsedContractors.push(row);
				}
				const res = await fetch("/api/contractor-directory/import" as string, {
					method: "POST", headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ contractors: parsedContractors }),
				});
				if (!res.ok) throw new Error("Import failed");
				const data = await res.json();
				toast.success(`${data.imported} contractor(s) imported${data.errors > 0 ? ` (${data.errors} errors)` : ""}`);
				setImportOpen(false); fetchContractors(); fetchStats(); setImporting(false);
			};
			input.click();
		} catch { toast.error("Import failed"); setImporting(false); }
	}, [fetchContractors, fetchStats]);

	const toggleSelect = (id: string) => {
		setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
	};
	const toggleSelectAll = () => {
		if (selectedIds.size === contractors.length) setSelectedIds(new Set());
		else setSelectedIds(new Set(contractors.map((c) => c.id)));
	};

	const openVerifyDialog = useCallback((c: Contractor) => {
		setSelectedContractor(c); setVerifyDialogOpen(true);
	}, []);

	const openBlacklistDialog = useCallback((c: Contractor) => {
		setSelectedContractor(c); setBlacklistDialogOpen(true);
	}, []);

	/* ── Loading skeleton ─────────────────────────────────────── */
	if (loading && contractors.length === 0) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-9 w-32" />
				</div>
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
				</div>
				<Skeleton className="h-10 w-full max-w-md" />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
				</div>
			</div>
		);
	}

	/* ── Error state ──────────────────────────────────────────── */
	if (error) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Card className="max-w-md w-full">
					<CardContent className="p-6 text-center">
						<p className="text-destructive font-medium">Failed to load contractors</p>
						<p className="text-muted-foreground text-sm mt-1">{error}</p>
						<Button onClick={() => { setError(null); fetchContractors(); }} variant="outline" className="mt-4">
							{tc("retry")}
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	/* ── Main render ──────────────────────────────────────────── */
	return (
		<div className="space-y-6 pb-8">
			{/* Header */}
			<motion.div {...fadeIn} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">{t("title")}</h1>
					<p className="text-muted-foreground text-sm mt-1">{t("description")}</p>
				</div>
				{canManage && (
					<div className="flex items-center gap-2">
						<Button size="sm" variant="outline" onClick={handleExport}>
							<Download className="size-4 me-1.5" />{tc("export")}
						</Button>
						<Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
							<Upload className="size-4 me-1.5" />{t("import")}
						</Button>
						<Button size="sm" onClick={() => { resetForm(); setAddOpen(true); }}
							className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/25">
							<Plus className="size-4 me-1.5" />{t("addContractor")}
						</Button>
					</div>
				)}
			</motion.div>

			{/* Stats Cards */}
			<StatsCards stats={stats} />

			{/* Search + Filters + View Toggle */}
			<SearchFilterBar
				searchQuery={searchQuery} onSearchChange={setSearchQuery}
				tradeFilter={tradeFilter} onTradeFilterChange={setTradeFilter}
				stateFilter={stateFilter} onStateFilterChange={setStateFilter}
				licenseStatusFilter={licenseStatusFilter} onLicenseStatusFilterChange={setLicenseStatusFilter}
				insuranceStatusFilter={insuranceStatusFilter} onInsuranceStatusFilterChange={setInsuranceStatusFilter}
				viewMode={viewMode} onViewModeChange={setViewMode}
				showFilters={showFilters} onToggleFilters={() => setShowFilters(!showFilters)}
			/>

			{/* Bulk Action Bar */}
			{selectedIds.size > 0 && (
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
					className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50">
					<div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card border border-border shadow-lg">
						<span className="text-sm font-medium">{selectedIds.size} selected</span>
						{canManage && (
							<>
								<Button size="sm" onClick={handleBulkVerify} disabled={saving}
									className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
									{saving ? <Loader2 className="size-4 animate-spin me-1" /> : <ShieldCheck className="size-4 me-1" />}
									{t("bulkVerify")}
								</Button>
								<Button size="sm" variant="destructive" onClick={handleBulkBlacklist} disabled={saving}>
									<Ban className="size-4 me-1" />{t("bulkBlacklist")}
								</Button>
							</>
						)}
						<Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>{tc("cancel")}</Button>
					</div>
				</motion.div>
			)}

			{/* Empty State */}
			{contractors.length === 0 ? (
				<motion.div {...fadeIn} className="flex flex-col items-center justify-center py-20 text-center">
					<div className="relative mb-6">
						<div className="rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 p-6 ring-1 ring-border/20">
							<Users className="size-12 text-muted-foreground/60" />
						</div>
					</div>
					<h3 className="font-semibold text-lg">{t("noContractors")}</h3>
					<p className="text-muted-foreground text-sm mt-1 max-w-sm">{t("noContractorsDesc")}</p>
					{canManage && (
						<Button size="sm" className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/20"
							onClick={() => { resetForm(); setAddOpen(true); }}>
							<Plus className="size-4 me-1" />{t("addContractor")}
						</Button>
					)}
				</motion.div>
			) : (
				<>
					{/* Grid View */}
					<motion.div
						initial="initial" animate="animate"
						variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
						className={cn(viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "hidden")}
					>
						{contractors.map((c) => (
							<ContractorCard key={c.id} contractor={c}
								isSelected={selectedIds.has(c.id)} canManage={canManage}
								onToggleSelect={() => toggleSelect(c.id)}
								onOpenDetail={() => openDetail(c)}
								onVerify={() => openVerifyDialog(c)} />
						))}
					</motion.div>

					{/* Table View */}
					<motion.div {...fadeIn} className={cn(viewMode === "table" ? "" : "hidden")}>
						<ContractorTable
							contractors={contractors} selectedIds={selectedIds} canManage={canManage}
							onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll}
							onOpenDetail={openDetail} onVerify={openVerifyDialog}
							onBlacklist={openBlacklistDialog} />
					</motion.div>

					{/* Pagination */}
					{pagination.totalPages > 1 && (
						<div className="flex items-center justify-center gap-2">
							<Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
							<span className="text-sm text-muted-foreground">Page {page} of {pagination.totalPages}</span>
							<Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
						</div>
					)}
				</>
			)}

			{/* Dialogs */}
			<AddContractorDialog open={addOpen} onOpenChange={setAddOpen} form={form} onFormChange={setForm} onSave={handleSave} saving={saving} />
			<ContractorDetailDialog open={detailOpen} onOpenChange={setDetailOpen} contractor={detailContractor}
				scoreBreakdown={scoreBreakdown} canManage={canManage}
				onVerify={() => { if (detailContractor) { setSelectedContractor(detailContractor); setVerifyDialogOpen(true); } }}
				onBlacklist={() => { if (detailContractor) { setSelectedContractor(detailContractor); setBlacklistDialogOpen(true); } }} />
			<ImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} importing={importing} />
			<VerifyBlacklistDialogs
				verifyDialogOpen={verifyDialogOpen} onVerifyDialogOpenChange={setVerifyDialogOpen}
				blacklistDialogOpen={blacklistDialogOpen} onBlacklistDialogOpenChange={setBlacklistDialogOpen}
				selectedContractor={selectedContractor} onVerify={handleVerify} onBlacklist={handleBlacklist} />
		</div>
	);
}
