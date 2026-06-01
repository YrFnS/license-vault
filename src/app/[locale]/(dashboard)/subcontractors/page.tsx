"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Plus,
	Search,
	HardHat,
	ShieldCheck,
	AlertTriangle,
	Pencil,
	Trash2,
	Eye,
	Send,
	Copy,
	FolderKanban,
	Loader2,
	Users,
	FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";

interface Subcontractor {
	id: string;
	orgId: string;
	companyName: string;
	contactName: string | null;
	email: string | null;
	phone: string | null;
	licenseNumber: string | null;
	licenseState: string | null;
	licenseExpiry: string | null;
	insuranceExpiry: string | null;
	insuranceStatus: string;
	complianceStatus: string;
	status: string;
	uploadToken: string | null;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
	computedInsuranceStatus: string;
	projectSubs?: { project: { id: string; name: string; status: string } }[];
}
interface PaginationInfo {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}
interface StatusCounts {
	total: number;
	active: number;
	compliant: number;
	non_compliant: number;
}

const LIMIT = 20;
const US_STATES = [
	"AL",
	"AK",
	"AZ",
	"AR",
	"CA",
	"CO",
	"CT",
	"DE",
	"FL",
	"GA",
	"HI",
	"ID",
	"IL",
	"IN",
	"IA",
	"KS",
	"KY",
	"LA",
	"ME",
	"MD",
	"MA",
	"MI",
	"MN",
	"MS",
	"MO",
	"MT",
	"NE",
	"NV",
	"NH",
	"NJ",
	"NM",
	"NY",
	"NC",
	"ND",
	"OH",
	"OK",
	"OR",
	"PA",
	"RI",
	"SC",
	"SD",
	"TN",
	"TX",
	"UT",
	"VT",
	"VA",
	"WA",
	"WV",
	"WI",
	"WY",
	"DC",
];

function StatusDot({ status }: { status: string }) {
	const color =
		status === "compliant"
			? "bg-emerald-500"
			: status === "non_compliant"
				? "bg-red-500"
				: status === "pending" || status === "pending_review"
					? "bg-amber-500"
					: "bg-slate-400";
	return <span className={cn("size-2 rounded-full shrink-0", color)} />;
}

function ComplianceBadge({ status }: { status: string }) {
	const t = useTranslations("subcontractors");
	const map: Record<string, { label: string; cls: string }> = {
		compliant: {
			label: t("compliant"),
			cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
		},
		pending: {
			label: t("pendingReview"),
			cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
		},
		pending_review: {
			label: t("pendingReview"),
			cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
		},
		non_compliant: {
			label: t("nonCompliant"),
			cls: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800",
		},
		unknown: {
			label: t("unknown"),
			cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
		},
	};
	const c = map[status] || map.unknown;
	return (
		<Badge variant="outline" className={cn("text-xs font-medium", c.cls)}>
			{c.label}
		</Badge>
	);
}

export default function SubcontractorsPage() {
	const t = useTranslations("subcontractors");
	const tc = useTranslations("common");
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

	const emptyForm = {
		companyName: "",
		contactName: "",
		email: "",
		phone: "",
		licenseNumber: "",
		licenseState: "",
		licenseExpiry: "",
		insuranceExpiry: "",
		insuranceStatus: "unknown",
		notes: "",
	};
	const [form, setForm] = useState(emptyForm);

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

	const fetchSubs = useCallback(async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: String(page),
				limit: String(LIMIT),
			});
			if (complianceFilter !== "all")
				params.set("compliance", complianceFilter);
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

	const resetForm = useCallback(() => {
		setForm(emptyForm);
		setEditMode(false);
		setSelectedSub(null);
	}, []);
	const openAdd = useCallback(() => {
		resetForm();
		setAddEditOpen(true);
	}, [resetForm]);
	const openEdit = useCallback((sub: Subcontractor) => {
		setForm({
			companyName: sub.companyName,
			contactName: sub.contactName || "",
			email: sub.email || "",
			phone: sub.phone || "",
			licenseNumber: sub.licenseNumber || "",
			licenseState: sub.licenseState || "",
			licenseExpiry: sub.licenseExpiry ? sub.licenseExpiry.split("T")[0] : "",
			insuranceExpiry: sub.insuranceExpiry
				? sub.insuranceExpiry.split("T")[0]
				: "",
			insuranceStatus: sub.insuranceStatus || "unknown",
			notes: sub.notes || "",
		});
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

	const handleSave = useCallback(async () => {
		setSaving(true);
		try {
			const payload = {
				companyName: form.companyName,
				contactName: form.contactName || undefined,
				email: form.email || undefined,
				phone: form.phone || undefined,
				licenseNumber: form.licenseNumber || undefined,
				licenseState: form.licenseState || undefined,
				licenseExpiry: form.licenseExpiry || undefined,
				insuranceExpiry: form.insuranceExpiry || undefined,
				insuranceStatus: form.insuranceStatus || undefined,
				notes: form.notes || undefined,
			};
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

	const toggleSelect = (id: string) =>
		setSelectedIds((prev) => {
			const n = new Set(prev);
			if (n.has(id)) n.delete(id);
			else n.add(id);
			return n;
		});
	const toggleSelectAll = () => {
		if (selectedIds.size === subs.length) setSelectedIds(new Set());
		else setSelectedIds(new Set(subs.map((s) => s.id)));
	};

	if (loading && subs.length === 0)
		return (
			<div className="space-y-4">
				<div className="flex justify-between">
					<Skeleton className="h-7 w-40" />
					<Skeleton className="h-9 w-28" />
				</div>
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
					{[0, 1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-20" />
					))}
				</div>
				<Skeleton className="h-10 w-64" />
				<Card>
					<CardContent className="p-4">
						{[0, 1, 2, 3, 4].map((i) => (
							<Skeleton key={i} className="h-10 w-full mb-2" />
						))}
					</CardContent>
				</Card>
			</div>
		);

	if (error)
		return (
			<div className="flex items-center justify-center min-h-[40vh]">
				<Card className="max-w-md">
					<CardContent className="p-6 text-center">
						<p className="text-red-600 font-medium">Failed to load</p>
						<p className="text-slate-500 text-sm mt-1">{error}</p>
						<Button onClick={fetchSubs} variant="outline" className="mt-4">
							Retry
						</Button>
					</CardContent>
				</Card>
			</div>
		);

	const filterTabs = [
		{ value: "all", label: t("allStatus"), count: counts.total },
		{
			value: "compliant",
			label: t("compliant"),
			count: counts.compliant,
			dot: "bg-emerald-500",
		},
		{
			value: "pending",
			label: t("pendingReview"),
			count: 0,
			dot: "bg-amber-500",
		},
		{
			value: "non_compliant",
			label: t("nonCompliant"),
			count: counts.non_compliant,
			dot: "bg-red-500",
		},
	];

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
				{canManage && (
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setBulkRequestOpen(true)}
						>
							<Send className="size-3.5 me-1.5" />
							{t("requestCOIs")}
						</Button>
						<Button
							size="sm"
							className="bg-emerald-600 hover:bg-emerald-700 text-white"
							onClick={openAdd}
						>
							<Plus className="size-3.5 me-1.5" />
							{t("addSubcontractor")}
						</Button>
					</div>
				)}
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				{[
					{
						label: t("totalSubcontractors"),
						value: counts.total,
						icon: HardHat,
						border: "border-l-slate-400",
					},
					{
						label: t("activeCount"),
						value: counts.active,
						icon: Users,
						border: "border-l-emerald-500",
					},
					{
						label: t("compliantCount"),
						value: counts.compliant,
						icon: ShieldCheck,
						border: "border-l-emerald-500",
					},
					{
						label: t("nonCompliantCount"),
						value: counts.non_compliant,
						icon: AlertTriangle,
						border: "border-l-red-500",
					},
				].map(({ label, value, icon: Icon, border }) => (
					<Card key={label} className={cn("border-l-2", border)}>
						<CardContent className="p-3 flex items-center gap-3">
							<div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2">
								<Icon className="size-4 text-slate-500" />
							</div>
							<div>
								<p className="text-xs text-slate-500">{label}</p>
								<p className="text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
									{value}
								</p>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Filters + Search */}
			<div className="flex flex-col sm:flex-row gap-3">
				<div className="flex gap-1 overflow-x-auto">
					{filterTabs.map((tab) => (
						<button
							key={tab.value}
							onClick={() => setComplianceFilter(tab.value)}
							className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
								complianceFilter === tab.value
									? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100"
									: "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
							}`}
						>
							{tab.dot && (
								<span className={cn("size-1.5 rounded-full", tab.dot)} />
							)}
							{tab.label}
							<span className="tabular-nums text-slate-400">{tab.count}</span>
						</button>
					))}
				</div>
				<div className="relative flex-1 max-w-sm ms-auto">
					<Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
					<Input
						placeholder={t("searchPlaceholder")}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="ps-9"
					/>
				</div>
			</div>

			{/* Bulk bar */}
			{selectedIds.size > 0 && (
				<div className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 py-3">
					<div className="mx-auto max-w-6xl flex items-center justify-between">
						<span className="text-sm text-slate-600 dark:text-slate-400">
							<span className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
								{selectedIds.size}
							</span>{" "}
							selected
						</span>
						<div className="flex gap-2">
							<Button
								size="sm"
								onClick={() => {
									const targets = subs.filter((s) => selectedIds.has(s.id));
									setBulkRequesting(true);
									Promise.all(
										targets.map((s) =>
											fetch(`/api/subcontractors/${s.id}/request-docs`, {
												method: "POST",
											}),
										),
									)
										.then(() => {
											toast.success(
												t("bulkRequestSent", { count: targets.length }),
											);
											setSelectedIds(new Set());
											fetchSubs();
										})
										.catch(() => toast.error("Failed"))
										.finally(() => setBulkRequesting(false));
								}}
								disabled={bulkRequesting}
							>
								{bulkRequesting ? (
									<Loader2 className="size-3.5 animate-spin me-1" />
								) : (
									<Send className="size-3.5 me-1" />
								)}
								{t("requestDocs")}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setSelectedIds(new Set())}
							>
								{tc("cancel")}
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Content */}
			{subs.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-4 mb-3">
						<HardHat className="size-8 text-slate-400" />
					</div>
					<p className="font-medium text-slate-700 dark:text-slate-300">
						{t("noSubcontractors")}
					</p>
					<p className="text-sm text-slate-500 mt-1 max-w-xs">
						{t("noSubcontractorsDesc")}
					</p>
					{canManage && (
						<Button
							size="sm"
							className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
							onClick={openAdd}
						>
							<Plus className="size-4 me-1" />
							{t("addSubcontractor")}
						</Button>
					)}
				</div>
			) : (
				<Card>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
										<th className="p-3 w-10">
											<input
												type="checkbox"
												checked={
													selectedIds.size === subs.length && subs.length > 0
												}
												onChange={toggleSelectAll}
												className="rounded border-slate-300"
											/>
										</th>
										<th className="text-start p-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
											{t("companyName")}
										</th>
										<th className="text-start p-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
											{t("contactName")}
										</th>
										<th className="text-start p-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
											{t("licenseNumber")}
										</th>
										<th className="text-start p-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
											{t("licenseExpiry")}
										</th>
										<th className="text-start p-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
											{t("complianceStatus")}
										</th>
										<th className="text-end p-3 font-medium text-slate-500 text-xs uppercase tracking-wider w-40">
											{tc("actions")}
										</th>
									</tr>
								</thead>
								<tbody>
									{subs.map((sub) => (
										<tr
											key={sub.id}
											className={cn(
												"border-b border-slate-100 dark:border-slate-800 transition-colors",
												selectedIds.has(sub.id)
													? "bg-emerald-50/50 dark:bg-emerald-950/10"
													: "hover:bg-slate-50 dark:hover:bg-slate-900/50",
											)}
										>
											<td className="p-3">
												<input
													type="checkbox"
													checked={selectedIds.has(sub.id)}
													onChange={() => toggleSelect(sub.id)}
													className="rounded border-slate-300"
												/>
											</td>
											<td className="p-3">
												<div className="flex items-center gap-2">
													<StatusDot status={sub.complianceStatus} />
													<div>
														<p className="font-medium text-slate-900 dark:text-slate-100">
															{sub.companyName}
														</p>
														{sub.email && (
															<p className="text-xs text-slate-500">
																{sub.email}
															</p>
														)}
													</div>
												</div>
											</td>
											<td className="p-3 text-slate-600 dark:text-slate-400">
												{sub.contactName || "—"}
											</td>
											<td className="p-3 text-slate-600 dark:text-slate-400 tabular-nums">
												{sub.licenseNumber || "—"}
											</td>
											<td className="p-3 text-slate-600 dark:text-slate-400 tabular-nums">
												{sub.licenseExpiry
													? new Date(sub.licenseExpiry).toLocaleDateString()
													: "—"}
											</td>
											<td className="p-3">
												<ComplianceBadge status={sub.complianceStatus} />
											</td>
											<td className="p-3">
												<div className="flex items-center justify-end gap-1">
													<Button
														variant="ghost"
														size="icon"
														className="size-7"
														onClick={() => openDetailDialog(sub)}
													>
														<Eye className="size-3.5" />
													</Button>
													{canManage && (
														<>
															<Button
																variant="ghost"
																size="icon"
																className="size-7"
																onClick={() => handleRequestDocs(sub)}
																disabled={requestingDocs}
															>
																<Send className="size-3.5" />
															</Button>
															<Button
																variant="ghost"
																size="icon"
																className="size-7"
																onClick={() => openEdit(sub)}
															>
																<Pencil className="size-3.5" />
															</Button>
															<Button
																variant="ghost"
																size="icon"
																className="size-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
																onClick={() => {
																	setSelectedSub(sub);
																	setDeleteDialogOpen(true);
																}}
															>
																<Trash2 className="size-3.5" />
															</Button>
														</>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Pagination */}
			{pagination.totalPages > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-xs text-slate-500 tabular-nums">
						{(pagination.page - 1) * pagination.limit + 1}–
						{Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
						{pagination.total}
					</p>
					<div className="flex items-center gap-1">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={pagination.page <= 1}
						>
							Previous
						</Button>
						<span className="text-xs text-slate-500 tabular-nums px-2">
							{pagination.page} / {pagination.totalPages}
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								setPage((p) => Math.min(pagination.totalPages, p + 1))
							}
							disabled={pagination.page >= pagination.totalPages}
						>
							Next
						</Button>
					</div>
				</div>
			)}

			{/* Add/Edit Dialog */}
			<Dialog
				open={addEditOpen}
				onOpenChange={(open) => {
					if (!open) resetForm();
					setAddEditOpen(open);
				}}
			>
				<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{editMode ? t("editSubcontractor") : t("addSubcontractor")}
						</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="space-y-1.5">
							<Label htmlFor="companyName">{t("companyName")} *</Label>
							<Input
								id="companyName"
								value={form.companyName}
								onChange={(e) =>
									setForm({ ...form, companyName: e.target.value })
								}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="contactName">{t("contactName")}</Label>
								<Input
									id="contactName"
									value={form.contactName}
									onChange={(e) =>
										setForm({ ...form, contactName: e.target.value })
									}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="email">{t("email")}</Label>
								<Input
									id="email"
									type="email"
									value={form.email}
									onChange={(e) => setForm({ ...form, email: e.target.value })}
								/>
							</div>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="phone">{t("phone")}</Label>
							<Input
								id="phone"
								value={form.phone}
								onChange={(e) => setForm({ ...form, phone: e.target.value })}
							/>
						</div>
						<hr className="border-slate-200 dark:border-slate-700" />
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="licenseNumber">{t("licenseNumber")}</Label>
								<Input
									id="licenseNumber"
									value={form.licenseNumber}
									onChange={(e) =>
										setForm({ ...form, licenseNumber: e.target.value })
									}
								/>
							</div>
							<div className="space-y-1.5">
								<Label>{t("licenseState")}</Label>
								<Select
									value={form.licenseState}
									onValueChange={(v) =>
										setForm({
											...form,
											licenseState: v === "__none__" ? "" : v,
										})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="__none__">None</SelectItem>
										{US_STATES.map((s) => (
											<SelectItem key={s} value={s}>
												{s}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="licenseExpiry">{t("licenseExpiry")}</Label>
								<Input
									id="licenseExpiry"
									type="date"
									value={form.licenseExpiry}
									onChange={(e) =>
										setForm({ ...form, licenseExpiry: e.target.value })
									}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="insuranceExpiry">{t("insuranceExpiry")}</Label>
								<Input
									id="insuranceExpiry"
									type="date"
									value={form.insuranceExpiry}
									onChange={(e) =>
										setForm({ ...form, insuranceExpiry: e.target.value })
									}
								/>
							</div>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="notes">{t("notes")}</Label>
							<Textarea
								id="notes"
								value={form.notes}
								onChange={(e) => setForm({ ...form, notes: e.target.value })}
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setAddEditOpen(false);
								resetForm();
							}}
						>
							{tc("cancel")}
						</Button>
						<Button
							onClick={handleSave}
							disabled={saving || !form.companyName}
							className="bg-emerald-600 hover:bg-emerald-700 text-white"
						>
							{saving && <Loader2 className="size-4 animate-spin me-2" />}
							{editMode ? tc("save") : tc("create")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Detail Dialog */}
			<Dialog open={detailOpen} onOpenChange={setDetailOpen}>
				<DialogContent className="max-w-lg max-h-[90vh]">
					<DialogHeader>
						<DialogTitle>{t("subcontractorDetails")}</DialogTitle>
					</DialogHeader>
					{detailSub ? (
						<ScrollArea className="max-h-[70vh]">
							<div className="space-y-4 pr-4">
								<div className="flex items-start gap-3">
									<div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2.5">
										<HardHat className="size-5 text-slate-500" />
									</div>
									<div className="flex-1">
										<h3 className="font-semibold">{detailSub.companyName}</h3>
										{detailSub.contactName && (
											<p className="text-sm text-slate-500">
												{detailSub.contactName}
											</p>
										)}
									</div>
									<ComplianceBadge status={detailSub.complianceStatus} />
								</div>
								{(detailSub.email || detailSub.phone) && (
									<div className="grid grid-cols-2 gap-2 text-sm">
										{detailSub.email && (
											<div>
												<span className="text-slate-500">Email:</span>
												<p className="font-medium">{detailSub.email}</p>
											</div>
										)}
										{detailSub.phone && (
											<div>
												<span className="text-slate-500">Phone:</span>
												<p className="font-medium">{detailSub.phone}</p>
											</div>
										)}
									</div>
								)}
								{(detailSub.licenseNumber ||
									detailSub.licenseState ||
									detailSub.licenseExpiry) && (
									<>
										<hr className="border-slate-200 dark:border-slate-700" />
										<div className="text-sm space-y-1">
											{detailSub.licenseNumber && (
												<div>
													<span className="text-slate-500">License #:</span>{" "}
													<span className="font-medium">
														{detailSub.licenseNumber}
													</span>
												</div>
											)}
											{detailSub.licenseState && (
												<div>
													<span className="text-slate-500">State:</span>{" "}
													<span className="font-medium">
														{detailSub.licenseState}
													</span>
												</div>
											)}
											{detailSub.licenseExpiry && (
												<div>
													<span className="text-slate-500">Expires:</span>{" "}
													<span className="font-medium">
														{new Date(
															detailSub.licenseExpiry,
														).toLocaleDateString()}
													</span>
												</div>
											)}
										</div>
									</>
								)}
								{detailSub.notes && (
									<>
										<hr className="border-slate-200 dark:border-slate-700" />
										<div>
											<span className="text-sm text-slate-500">Notes:</span>
											<p className="text-sm">{detailSub.notes}</p>
										</div>
									</>
								)}
								{detailSub.projectSubs && detailSub.projectSubs.length > 0 && (
									<>
										<hr className="border-slate-200 dark:border-slate-700" />
										<div>
											<span className="text-sm font-medium">Projects:</span>
											<div className="mt-1 space-y-1">
												{detailSub.projectSubs.map((ps) => (
													<div
														key={ps.project.id}
														className="flex items-center gap-2 text-sm"
													>
														<FolderKanban className="size-3.5 text-slate-400" />
														<span>{ps.project.name}</span>
													</div>
												))}
											</div>
										</div>
									</>
								)}
								{canManage && (
									<>
										<hr className="border-slate-200 dark:border-slate-700" />
										<div className="flex flex-wrap gap-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleRequestDocs(detailSub)}
												disabled={requestingDocs}
											>
												<FileText className="size-3.5 me-1" />
												{t("requestDocs")}
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => {
													if (detailSub.uploadToken)
														navigator.clipboard.writeText(
															window.location.origin +
																`/subcontractor-upload?token=${detailSub.uploadToken}`,
														);
													toast.success(t("uploadLinkCopied"));
												}}
											>
												<Copy className="size-3.5 me-1" />
												{t("copyUploadLink")}
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => {
													setDetailOpen(false);
													openEdit(detailSub);
												}}
											>
												<Pencil className="size-3.5 me-1" />
												{tc("edit")}
											</Button>
										</div>
									</>
								)}
							</div>
						</ScrollArea>
					) : (
						<div className="py-8 text-center text-slate-500">Loading...</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Delete */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("deleteWarning")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							{deleting && <Loader2 className="size-4 animate-spin me-1" />}
							{tc("delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Bulk Request */}
			<AlertDialog open={bulkRequestOpen} onOpenChange={setBulkRequestOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("requestCOIs")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("bulkRequestConfirm", {
								count: subs.filter(
									(s) =>
										s.complianceStatus === "non_compliant" ||
										s.complianceStatus === "pending",
								).length,
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleBulkRequest}
							disabled={bulkRequesting}
							className="bg-emerald-600 hover:bg-emerald-700 text-white"
						>
							{bulkRequesting ? (
								<Loader2 className="size-4 animate-spin me-1" />
							) : (
								<Send className="size-4 me-1" />
							)}
							{t("requestCOIs")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
