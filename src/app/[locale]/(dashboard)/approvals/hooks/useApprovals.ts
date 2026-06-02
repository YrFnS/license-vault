import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRole } from "@/hooks/useRole";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import type { ApprovalItem, ApprovalStats } from "../types";

export function useApprovals() {
	const t = useTranslations("approvals");
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

	return {
		// Data
		approvals,
		stats,
		counts,
		loading,
		userId,
		// Pagination & filters
		activeTab,
		setActiveTab,
		search,
		setSearch,
		typeFilter,
		setTypeFilter,
		priorityFilter,
		setPriorityFilter,
		page,
		setPage,
		totalPages,
		total,
		// Dialog state
		showNewDialog,
		setShowNewDialog,
		showReviewDialog,
		setShowReviewDialog,
		showDetailDialog,
		setShowDetailDialog,
		showCancelDialog,
		setShowCancelDialog,
		selectedApproval,
		setSelectedApproval,
		reviewStatus,
		setReviewStatus,
		reviewNotes,
		setReviewNotes,
		submitting,
		// New request form
		newTitle,
		setNewTitle,
		newDescription,
		setNewDescription,
		newType,
		setNewType,
		newPriority,
		setNewPriority,
		// Actions
		handleCreate,
		handleReview,
		handleCancel,
		// Permissions
		canManage,
	};
}
