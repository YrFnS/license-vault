"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
	CheckSquare,
	Plus,
	Search,
	Clock,
	CheckCircle2,
	XCircle,
	Ban,
	FileText,
	GraduationCap,
	ShieldHalf,
	RefreshCw,
	MoreHorizontal,
	Eye,
	ChevronLeft,
	ChevronRight,
	Filter,
	AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useRole } from "@/hooks/useRole";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";

// Types
interface ApprovalItem {
	id: string;
	orgId: string;
	title: string;
	description: string | null;
	type: string;
	status: string;
	priority: string;
	entityId: string | null;
	entityType: string | null;
	requestData: string | null;
	requestedBy: string | null;
	reviewedBy: string | null;
	reviewNotes: string | null;
	reviewedAt: string | null;
	createdAt: string;
	updatedAt: string;
	requesterName: string | null;
	requesterEmail: string | null;
	reviewerName: string | null;
	reviewerEmail: string | null;
}

interface ApprovalStats {
	countsByStatus: {
		pending: number;
		approved: number;
		rejected: number;
		cancelled: number;
	};
	countsByType: { type: string; count: number }[];
	pendingByPriority: { priority: string; count: number }[];
	avgReviewTimeHours: number;
	total: number;
}

// Badge helpers
function getTypeBadge(type: string, t: (key: string) => string) {
	const config: Record<
		string,
		{ label: string; className: string; icon: any }
	> = {
		license_renewal: {
			label: t("licenseRenewal"),
			className:
				"bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border-teal-200 dark:border-teal-800",
			icon: RefreshCw,
		},
		document_review: {
			label: t("documentReview"),
			className:
				"bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
			icon: FileText,
		},
		ce_verification: {
			label: t("ceVerification"),
			className:
				"bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
			icon: GraduationCap,
		},
		insurance_update: {
			label: t("insuranceUpdate"),
			className:
				"bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
			icon: ShieldHalf,
		},
		other: {
			label: t("other"),
			className:
				"bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border-slate-200 dark:border-slate-700",
			icon: FileText,
		},
	};
	const c = config[type] || config.other;
	const Icon = c.icon;
	return (
		<Badge
			variant="outline"
			className={cn("text-xs gap-1 font-medium", c.className)}
		>
			<Icon className="size-3" />
			{c.label}
		</Badge>
	);
}

function getPriorityBadge(priority: string, t: (key: string) => string) {
	const config: Record<string, { label: string; className: string }> = {
		urgent: {
			label: t("urgent"),
			className:
				"bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800",
		},
		high: {
			label: t("high"),
			className:
				"bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800",
		},
		medium: {
			label: t("medium"),
			className:
				"bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
		},
		low: {
			label: t("low"),
			className:
				"bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border-teal-200 dark:border-teal-800",
		},
	};
	const c = config[priority] || config.medium;
	return (
		<Badge variant="outline" className={cn("text-xs font-medium", c.className)}>
			{(priority === "urgent" || priority === "high") && (
				<AlertTriangle className="size-3 me-1" />
			)}
			{c.label}
		</Badge>
	);
}

function getStatusBadge(status: string, t: (key: string) => string) {
	const config: Record<
		string,
		{ label: string; className: string; icon: any }
	> = {
		pending: {
			label: t("pending"),
			className:
				"bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
			icon: Clock,
		},
		approved: {
			label: t("approved"),
			className:
				"bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
			icon: CheckCircle2,
		},
		rejected: {
			label: t("rejected"),
			className:
				"bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800",
			icon: XCircle,
		},
		cancelled: {
			label: t("cancelled"),
			className:
				"bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border-slate-200 dark:border-slate-700",
			icon: Ban,
		},
	};
	const c = config[status] || config.pending;
	const Icon = c.icon;
	return (
		<Badge
			variant="outline"
			className={cn("text-xs gap-1 font-medium", c.className)}
		>
			<Icon className="size-3" />
			{c.label}
		</Badge>
	);
}

function formatRelativeTime(
	dateStr: string,
	t: (key: string) => string,
): string {
	const now = new Date();
	const date = new Date(dateStr);
	const diffMs = now.getTime() - date.getTime();
	const diffMinutes = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMinutes < 1) return t("justNow");
	if (diffHours < 1) return `${diffMinutes}m`;
	if (diffHours < 24) return `${diffHours}h`;
	if (diffDays < 30) return `${diffDays} ${t("daysAgo")}`;
	return date.toLocaleDateString();
}

// Main component
export default function ApprovalsPage() {
	const t = useTranslations("approvals");
	const tc = useTranslations("common");
	const { canManage } = useRole();
	const { data: session } = useSession();
	const { toast } = useToast();

	const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
	const [stats, setStats] = useState<ApprovalStats | null>(null);
	const [counts, setCounts] = useState({
		pending: 0,
		approved: 0,
		rejected: 0,
	});
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("all");
	const [search, setSearch] = useState("");
	const [typeFilter, setTypeFilter] = useState("all");
	const [priorityFilter, setPriorityFilter] = useState("all");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);

	// Dialog states
	const [showNewDialog, setShowNewDialog] = useState(false);
	const [showReviewDialog, setShowReviewDialog] = useState(false);
	const [showDetailDialog, setShowDetailDialog] = useState(false);
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(
		null,
	);
	const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">(
		"approved",
	);
	const [reviewNotes, setReviewNotes] = useState("");
	const [submitting, setSubmitting] = useState(false);

	// New request form
	const [newTitle, setNewTitle] = useState("");
	const [newDescription, setNewDescription] = useState("");
	const [newType, setNewType] = useState("license_renewal");
	const [newPriority, setNewPriority] = useState("medium");

	const fetchApprovals = useCallback(async () => {
		try {
			const params = new URLSearchParams();
			params.set("page", String(page));
			params.set("limit", "20");
			if (activeTab !== "all") params.set("status", activeTab);
			if (search) params.set("search", search);
			if (typeFilter !== "all") params.set("type", typeFilter);
			if (priorityFilter !== "all") params.set("priority", priorityFilter);

			const res = await fetch(`/api/approvals?${params}`);
			if (res.ok) {
				const data = await res.json();
				setApprovals(data.approvals);
				setTotalPages(data.pagination.totalPages);
				setTotal(data.pagination.total);
				setCounts(data.counts);
			}
		} catch (err) {
			console.error("Failed to fetch approvals:", err);
		}
	}, [page, activeTab, search, typeFilter, priorityFilter]);

	const fetchStats = useCallback(async () => {
		try {
			const res = await fetch("/api/approvals/stats");
			if (res.ok) {
				const data = await res.json();
				setStats(data);
			}
		} catch (err) {
			console.error("Failed to fetch stats:", err);
		}
	}, []);

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			await Promise.all([fetchApprovals(), fetchStats()]);
			setLoading(false);
		};
		load();
	}, [fetchApprovals, fetchStats]);

	const handleCreate = async () => {
		if (!newTitle.trim()) return;
		setSubmitting(true);
		try {
			const res = await fetch("/api/approvals", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: newTitle,
					description: newDescription,
					type: newType,
					priority: newPriority,
				}),
			});
			if (res.ok) {
				toast({ title: t("createSuccess") });
				setShowNewDialog(false);
				setNewTitle("");
				setNewDescription("");
				setNewType("license_renewal");
				setNewPriority("medium");
				await fetchApprovals();
				await fetchStats();
			}
		} catch (err) {
			console.error("Create error:", err);
		}
		setSubmitting(false);
	};

	const handleReview = async () => {
		if (!selectedApproval) return;
		setSubmitting(true);
		try {
			const res = await fetch(`/api/approvals/${selectedApproval.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: reviewStatus, reviewNotes }),
			});
			if (res.ok) {
				toast({
					title:
						reviewStatus === "approved"
							? t("approveSuccess")
							: t("rejectSuccess"),
				});
				setShowReviewDialog(false);
				setReviewNotes("");
				setSelectedApproval(null);
				await fetchApprovals();
				await fetchStats();
			} else {
				const data = await res.json();
				toast({ title: data.error || "Error", variant: "destructive" });
			}
		} catch (err) {
			console.error("Review error:", err);
		}
		setSubmitting(false);
	};

	const handleCancel = async () => {
		if (!selectedApproval) return;
		setSubmitting(true);
		try {
			const res = await fetch(`/api/approvals/${selectedApproval.id}`, {
				method: "DELETE",
			});
			if (res.ok) {
				toast({ title: t("cancelSuccess") });
				setShowCancelDialog(false);
				setSelectedApproval(null);
				await fetchApprovals();
				await fetchStats();
			}
		} catch (err) {
			console.error("Cancel error:", err);
		}
		setSubmitting(false);
	};

	const userId = (session?.user as any)?.id;

	const fadeIn = {
		initial: { opacity: 0, y: 10 },
		animate: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: -10 },
	};

	// Stats cards data
	const statsCards = [
		{
			label: t("totalApprovals"),
			value: total,
			icon: CheckSquare,
			color: "text-teal-600 dark:text-teal-400",
			bg: "from-teal-50/90 via-teal-50/60 to-teal-100/40 dark:from-teal-950/30 dark:via-teal-950/20 dark:to-teal-950/10",
			border: "border-s-teal-400 dark:border-s-teal-600",
		},
		{
			label: t("pendingApprovals"),
			value: stats?.countsByStatus.pending ?? counts.pending,
			icon: Clock,
			color: "text-amber-600 dark:text-amber-400",
			bg: "from-amber-50/90 via-amber-50/60 to-amber-100/40 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-amber-950/10",
			border: "border-s-amber-400 dark:border-s-amber-600",
		},
		{
			label: t("approvedThisMonth"),
			value: stats?.countsByStatus.approved ?? counts.approved,
			icon: CheckCircle2,
			color: "text-emerald-600 dark:text-emerald-400",
			bg: "from-emerald-50/90 via-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/30 dark:via-emerald-950/20 dark:to-emerald-950/10",
			border: "border-s-emerald-400 dark:border-s-emerald-600",
		},
		{
			label: t("rejectedCount"),
			value: stats?.countsByStatus.rejected ?? counts.rejected,
			icon: XCircle,
			color: "text-red-600 dark:text-red-400",
			bg: "from-red-50/90 via-red-50/60 to-red-100/40 dark:from-red-950/30 dark:via-red-950/20 dark:to-red-950/10",
			border: "border-s-red-400 dark:border-s-red-600",
		},
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<motion.div
				{...fadeIn}
				className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
			>
				<div>
					<h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-foreground to-emerald-600 bg-clip-text text-transparent">
						{t("title")}
					</h1>
					<p className="text-muted-foreground mt-1">{t("description")}</p>
				</div>
				<Button
					onClick={() => setShowNewDialog(true)}
					className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02]"
				>
					<Plus className="size-4 me-2" />
					{t("newRequest")}
				</Button>
			</motion.div>

			{/* Stats Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
				{statsCards.map((card, i) => (
					<motion.div
						key={card.label}
						initial={{ opacity: 0, y: 15 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.05 }}
						whileHover={{ scale: 1.02, y: -2 }}
					>
						<Card
							className={cn(
								"bg-gradient-to-br border-s-4 shadow-sm hover:shadow-md transition-shadow duration-300",
								card.bg,
								card.border,
							)}
						>
							<CardContent className="p-3 md:p-4">
								<div className="flex items-center justify-between">
									<p className="text-xs uppercase tracking-wider text-muted-foreground/70 font-bold">
										{card.label}
									</p>
									<card.icon className={cn("size-4", card.color)} />
								</div>
								<p
									className={cn(
										"text-2xl lg:text-3xl font-extrabold tabular-nums mt-1",
										card.color,
									)}
								>
									{card.value}
								</p>
							</CardContent>
						</Card>
					</motion.div>
				))}
			</div>

			{/* Tabs + Search + Filters */}
			<motion.div {...fadeIn} className="space-y-4">
				<div className="flex flex-col sm:flex-row sm:items-center gap-3">
					<Tabs
						value={activeTab}
						onValueChange={(v) => {
							setActiveTab(v);
							setPage(1);
						}}
					>
						<TabsList className="bg-muted/50">
							<TabsTrigger value="all" className="text-xs">
								{tc("status") === "Status" ? "All" : "الكل"}
							</TabsTrigger>
							<TabsTrigger value="pending" className="text-xs gap-1">
								<Clock className="size-3" />
								{t("pending")} ({counts.pending})
							</TabsTrigger>
							<TabsTrigger value="approved" className="text-xs gap-1">
								<CheckCircle2 className="size-3" />
								{t("approved")} ({counts.approved})
							</TabsTrigger>
							<TabsTrigger value="rejected" className="text-xs gap-1">
								<XCircle className="size-3" />
								{t("rejected")} ({counts.rejected})
							</TabsTrigger>
						</TabsList>
					</Tabs>

					<div className="flex items-center gap-2 ms-auto">
						<div className="relative">
							<Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
							<Input
								placeholder={t("searchPlaceholder")}
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
									setPage(1);
								}}
								className="ps-9 h-9 w-48 md:w-64 bg-muted/30 border-border/50"
							/>
						</div>
						<Select
							value={typeFilter}
							onValueChange={(v) => {
								setTypeFilter(v);
								setPage(1);
							}}
						>
							<SelectTrigger className="h-9 w-32 bg-muted/30 border-border/50 text-xs">
								<Filter className="size-3 me-1" />
								<SelectValue placeholder={t("allTypes")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("allTypes")}</SelectItem>
								<SelectItem value="license_renewal">
									{t("licenseRenewal")}
								</SelectItem>
								<SelectItem value="document_review">
									{t("documentReview")}
								</SelectItem>
								<SelectItem value="ce_verification">
									{t("ceVerification")}
								</SelectItem>
								<SelectItem value="insurance_update">
									{t("insuranceUpdate")}
								</SelectItem>
								<SelectItem value="other">{t("other")}</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={priorityFilter}
							onValueChange={(v) => {
								setPriorityFilter(v);
								setPage(1);
							}}
						>
							<SelectTrigger className="h-9 w-32 bg-muted/30 border-border/50 text-xs hidden md:flex">
								<SelectValue placeholder={t("allPriorities")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("allPriorities")}</SelectItem>
								<SelectItem value="urgent">{t("urgent")}</SelectItem>
								<SelectItem value="high">{t("high")}</SelectItem>
								<SelectItem value="medium">{t("medium")}</SelectItem>
								<SelectItem value="low">{t("low")}</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</motion.div>

			{/* Content */}
			{loading ? (
				<div className="space-y-3">
					{[...Array(5)].map((_, i) => (
						<div
							key={i}
							className="h-20 rounded-lg bg-muted/30 animate-pulse"
						/>
					))}
				</div>
			) : approvals.length === 0 ? (
				<motion.div {...fadeIn} className="text-center py-20">
					<div className="relative inline-block mb-6">
						<div className="rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 p-6 ring-1 ring-border/20">
							<CheckSquare className="size-10 text-muted-foreground/60" />
						</div>
						<div className="absolute -bottom-1 -end-1 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 p-1.5 ring-2 ring-background">
							<Plus className="size-3 text-emerald-600 dark:text-emerald-400" />
						</div>
					</div>
					<h3 className="text-lg font-semibold text-muted-foreground">
						{t("noApprovals")}
					</h3>
					<p className="text-sm text-muted-foreground/70 mt-1 max-w-sm mx-auto">
						{t("noApprovalsDesc")}
					</p>
					<Button
						onClick={() => setShowNewDialog(true)}
						className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-sm shadow-emerald-500/20"
					>
						<Plus className="size-4 me-2" />
						{t("newRequest")}
					</Button>
				</motion.div>
			) : (
				<>
					{/* Desktop Table */}
					<div className="hidden md:block">
						<Card className="shadow-sm">
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className="border-b bg-muted/30">
											<th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
												{t("title_field")}
											</th>
											<th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
												{t("type")}
											</th>
											<th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
												{t("priority")}
											</th>
											<th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
												{t("requestedBy")}
											</th>
											{/* requestedBy field is on the approval object */}
											<th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
												{t("status")}
											</th>
											<th className="text-start px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
												{t("createdAt")}
											</th>
											<th className="text-end px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
												{tc("actions")}
											</th>
										</tr>
									</thead>
									<tbody>
										<AnimatePresence>
											{approvals.map((approval) => (
												<motion.tr
													key={approval.id}
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													className="border-b hover:bg-muted/30 transition-colors duration-150"
												>
													<td className="px-4 py-3">
														<div>
															<p className="font-medium text-sm">
																{approval.title}
															</p>
															{approval.description && (
																<p className="text-xs text-muted-foreground truncate max-w-xs">
																	{approval.description}
																</p>
															)}
														</div>
													</td>
													<td className="px-4 py-3">
														{getTypeBadge(approval.type, t)}
													</td>
													<td className="px-4 py-3">
														{getPriorityBadge(approval.priority, t)}
													</td>
													<td className="px-4 py-3">
														<span className="text-sm text-muted-foreground">
															{approval.requesterName || "—"}
														</span>
													</td>
													<td className="px-4 py-3">
														{getStatusBadge(approval.status, t)}
													</td>
													<td className="px-4 py-3">
														<span className="text-xs text-muted-foreground">
															{formatRelativeTime(approval.createdAt, t)}
														</span>
													</td>
													<td className="px-4 py-3 text-end">
														<div className="flex items-center justify-end gap-1">
															{approval.status === "pending" && canManage && (
																<Button
																	size="sm"
																	variant="outline"
																	className="h-7 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/50"
																	onClick={() => {
																		setSelectedApproval(approval);
																		setReviewStatus("approved");
																		setReviewNotes("");
																		setShowReviewDialog(true);
																	}}
																>
																	{t("reviewRequest")}
																</Button>
															)}
															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<Button
																		variant="ghost"
																		size="icon"
																		className="size-7"
																	>
																		<MoreHorizontal className="size-4" />
																	</Button>
																</DropdownMenuTrigger>
																<DropdownMenuContent align="end">
																	<DropdownMenuItem
																		onClick={() => {
																			setSelectedApproval(approval);
																			setShowDetailDialog(true);
																		}}
																	>
																		<Eye className="size-4 me-2" />
																		{t("requestDetails")}
																	</DropdownMenuItem>
																	{approval.status === "pending" &&
																		(approval.requestedBy === userId ||
																			canManage) && (
																			<DropdownMenuItem
																				className="text-destructive focus:text-destructive"
																				onClick={() => {
																					setSelectedApproval(approval);
																					setShowCancelDialog(true);
																				}}
																			>
																				<Ban className="size-4 me-2" />
																				{t("cancel")}
																			</DropdownMenuItem>
																		)}
																</DropdownMenuContent>
															</DropdownMenu>
														</div>
													</td>
												</motion.tr>
											))}
										</AnimatePresence>
									</tbody>
								</table>
							</div>
						</Card>
					</div>

					{/* Mobile Cards */}
					<div className="md:hidden space-y-3">
						<AnimatePresence>
							{approvals.map((approval) => (
								<motion.div
									key={approval.id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
								>
									<Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
										<CardContent className="p-4">
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0 flex-1">
													<p className="font-medium text-sm truncate">
														{approval.title}
													</p>
													{approval.description && (
														<p className="text-xs text-muted-foreground truncate mt-0.5">
															{approval.description}
														</p>
													)}
												</div>
												{getStatusBadge(approval.status, t)}
											</div>
											<div className="flex flex-wrap items-center gap-2 mt-3">
												{getTypeBadge(approval.type, t)}
												{getPriorityBadge(approval.priority, t)}
											</div>
											<Separator className="my-3" />
											<div className="flex items-center justify-between">
												<div className="text-xs text-muted-foreground">
													<span>{approval.requesterName || "—"}</span>
													<span className="mx-1">·</span>
													<span>
														{formatRelativeTime(approval.createdAt, t)}
													</span>
												</div>
												<div className="flex items-center gap-1">
													{approval.status === "pending" && canManage && (
														<Button
															size="sm"
															variant="outline"
															className="h-7 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
															onClick={() => {
																setSelectedApproval(approval);
																setReviewStatus("approved");
																setReviewNotes("");
																setShowReviewDialog(true);
															}}
														>
															{t("reviewRequest")}
														</Button>
													)}
													<Button
														variant="ghost"
														size="icon"
														className="size-7"
														onClick={() => {
															setSelectedApproval(approval);
															setShowDetailDialog(true);
														}}
													>
														<Eye className="size-4" />
													</Button>
													{approval.status === "pending" &&
														(approval.requestedBy === userId || canManage) && (
															<Button
																variant="ghost"
																size="icon"
																className="size-7 text-destructive hover:bg-destructive/10"
																onClick={() => {
																	setSelectedApproval(approval);
																	setShowCancelDialog(true);
																}}
															>
																<Ban className="size-4" />
															</Button>
														)}
												</div>
											</div>
										</CardContent>
									</Card>
								</motion.div>
							))}
						</AnimatePresence>
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex items-center justify-between pt-2">
							<p className="text-xs text-muted-foreground">
								{page} / {totalPages} · {total} {t("title").toLowerCase()}
							</p>
							<div className="flex items-center gap-1">
								<Button
									variant="outline"
									size="icon"
									className="size-8"
									disabled={page <= 1}
									onClick={() => setPage(page - 1)}
								>
									<ChevronLeft className="size-4" />
								</Button>
								<Button
									variant="outline"
									size="icon"
									className="size-8"
									disabled={page >= totalPages}
									onClick={() => setPage(page + 1)}
								>
									<ChevronRight className="size-4" />
								</Button>
							</div>
						</div>
					)}
				</>
			)}

			{/* New Request Dialog */}
			<Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t("newRequest")}</DialogTitle>
						<DialogDescription>{t("description")}</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label className="text-sm font-medium">
								{t("title_field")} *
							</Label>
							<Input
								value={newTitle}
								onChange={(e) => setNewTitle(e.target.value)}
								placeholder="e.g., Renew California Electrical License"
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-medium">
								{t("description_field")}
							</Label>
							<Textarea
								value={newDescription}
								onChange={(e) => setNewDescription(e.target.value)}
								placeholder="Add details about this request..."
								rows={3}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-sm font-medium">{t("type")}</Label>
								<Select value={newType} onValueChange={setNewType}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="license_renewal">
											{t("licenseRenewal")}
										</SelectItem>
										<SelectItem value="document_review">
											{t("documentReview")}
										</SelectItem>
										<SelectItem value="ce_verification">
											{t("ceVerification")}
										</SelectItem>
										<SelectItem value="insurance_update">
											{t("insuranceUpdate")}
										</SelectItem>
										<SelectItem value="other">{t("other")}</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label className="text-sm font-medium">{t("priority")}</Label>
								<Select value={newPriority} onValueChange={setNewPriority}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="low">{t("low")}</SelectItem>
										<SelectItem value="medium">{t("medium")}</SelectItem>
										<SelectItem value="high">{t("high")}</SelectItem>
										<SelectItem value="urgent">{t("urgent")}</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowNewDialog(false)}>
							{tc("cancel")}
						</Button>
						<Button
							onClick={handleCreate}
							disabled={!newTitle.trim() || submitting}
							className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
						>
							{submitting ? tc("loading") : tc("create")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Review Dialog */}
			<Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t("reviewRequest")}</DialogTitle>
						<DialogDescription>{selectedApproval?.title}</DialogDescription>
					</DialogHeader>
					{selectedApproval && (
						<div className="space-y-4">
							<div className="space-y-2 rounded-lg bg-muted/30 p-3">
								<div className="flex items-center gap-2">
									<span className="text-xs text-muted-foreground">
										{t("requestedBy")}:
									</span>
									<span className="text-sm font-medium">
										{selectedApproval.requesterName || "—"}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-xs text-muted-foreground">
										{t("type")}:
									</span>
									{getTypeBadge(selectedApproval.type, t)}
								</div>
								<div className="flex items-center gap-2">
									<span className="text-xs text-muted-foreground">
										{t("priority")}:
									</span>
									{getPriorityBadge(selectedApproval.priority, t)}
								</div>
								{selectedApproval.description && (
									<p className="text-xs text-muted-foreground mt-1">
										{selectedApproval.description}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label className="text-sm font-medium">
									{t("reviewNotes")}
								</Label>
								<Textarea
									value={reviewNotes}
									onChange={(e) => setReviewNotes(e.target.value)}
									placeholder={t("reviewNotesPlaceholder")}
									rows={3}
								/>
							</div>
						</div>
					)}
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={() => setShowReviewDialog(false)}
						>
							{tc("cancel")}
						</Button>
						<Button
							onClick={() => {
								setReviewStatus("rejected");
								handleReview();
							}}
							disabled={submitting}
							variant="outline"
							className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30"
						>
							<XCircle className="size-4 me-1" />
							{t("reject")}
						</Button>
						<Button
							onClick={() => {
								setReviewStatus("approved");
								handleReview();
							}}
							disabled={submitting}
							className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
						>
							<CheckCircle2 className="size-4 me-1" />
							{t("approve")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Detail Dialog */}
			<Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>{t("requestDetails")}</DialogTitle>
						<DialogDescription>{selectedApproval?.title}</DialogDescription>
					</DialogHeader>
					{selectedApproval && (
						<div className="space-y-4">
							{/* Info Grid */}
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">{t("type")}</p>
									{getTypeBadge(selectedApproval.type, t)}
								</div>
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">
										{t("priority")}
									</p>
									{getPriorityBadge(selectedApproval.priority, t)}
								</div>
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">{t("status")}</p>
									{getStatusBadge(selectedApproval.status, t)}
								</div>
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">
										{t("requestedBy")}
									</p>
									<p className="text-sm font-medium">
										{selectedApproval.requesterName || "—"}
									</p>
								</div>
							</div>

							{selectedApproval.description && (
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">
										{t("description_field")}
									</p>
									<p className="text-sm bg-muted/30 rounded-lg p-3">
										{selectedApproval.description}
									</p>
								</div>
							)}

							{/* Timeline */}
							<div className="space-y-2">
								<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
									{t("timeline")}
								</p>
								<div className="relative ps-6">
									<div className="absolute start-2 top-1 bottom-1 w-[2px] bg-gradient-to-b from-emerald-400 to-teal-400 rounded-full" />
									<div className="space-y-4">
										<div className="relative">
											<div className="absolute -start-4 top-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-background" />
											<p className="text-sm font-medium">
												{t("requestSubmitted")}
											</p>
											<p className="text-xs text-muted-foreground">
												{formatRelativeTime(selectedApproval.createdAt, t)}
											</p>
										</div>
										{selectedApproval.reviewedAt && (
											<div className="relative">
												<div
													className={cn(
														"absolute -start-4 top-0.5 size-3 rounded-full ring-2 ring-background",
														selectedApproval.status === "approved"
															? "bg-emerald-500"
															: "bg-red-500",
													)}
												/>
												<p className="text-sm font-medium">
													{t("requestReviewed")}
												</p>
												<p className="text-xs text-muted-foreground">
													{selectedApproval.reviewerName &&
														`by ${selectedApproval.reviewerName} · `}
													{formatRelativeTime(selectedApproval.reviewedAt, t)}
												</p>
												{selectedApproval.reviewNotes && (
													<p className="text-xs text-muted-foreground mt-1 bg-muted/30 rounded p-2">
														{selectedApproval.reviewNotes}
													</p>
												)}
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					)}
					<DialogFooter>
						{selectedApproval?.status === "pending" && canManage && (
							<Button
								onClick={() => {
									setShowDetailDialog(false);
									setReviewStatus("approved");
									setReviewNotes("");
									setShowReviewDialog(true);
								}}
								className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
							>
								{t("reviewRequest")}
							</Button>
						)}
						<Button
							variant="outline"
							onClick={() => setShowDetailDialog(false)}
						>
							{tc("close")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Cancel Confirmation */}
			<AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
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
							onClick={handleCancel}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("cancel")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
