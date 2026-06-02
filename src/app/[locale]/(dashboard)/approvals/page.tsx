"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useApprovals } from "./hooks/useApprovals";
import { StatsCards } from "./components/StatsCards";
import { ApprovalFilters } from "./components/ApprovalFilters";
import { ApprovalTable } from "./components/ApprovalTable";
import { ApprovalCards } from "./components/ApprovalCards";
import { ApprovalPagination } from "./components/ApprovalPagination";
import { ApprovalDialogs } from "./components/ApprovalDialogs";
import { EmptyState } from "./components/EmptyState";
import { fadeIn } from "./constants";

export default function ApprovalsPage() {
	const t = useTranslations("approvals");
	const tc = useTranslations("common");
	const hook = useApprovals();

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
					onClick={() => hook.setShowNewDialog(true)}
					className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02]"
				>
					<Plus className="size-4 me-2" />
					{t("newRequest")}
				</Button>
			</motion.div>

			{/* Stats Cards */}
			<StatsCards
				t={t}
				total={hook.total}
				pending={hook.stats?.countsByStatus.pending ?? hook.counts.pending}
				approved={hook.stats?.countsByStatus.approved ?? hook.counts.approved}
				rejected={hook.stats?.countsByStatus.rejected ?? hook.counts.rejected}
			/>

			{/* Tabs + Search + Filters */}
			<ApprovalFilters
				t={t}
				tc={tc}
				activeTab={hook.activeTab}
				setActiveTab={hook.setActiveTab}
				search={hook.search}
				setSearch={hook.setSearch}
				typeFilter={hook.typeFilter}
				setTypeFilter={hook.setTypeFilter}
				priorityFilter={hook.priorityFilter}
				setPriorityFilter={hook.setPriorityFilter}
				setPage={hook.setPage}
				counts={hook.counts}
			/>

			{/* Content */}
			{hook.loading ? (
				<div className="space-y-3">
					{[...Array(5)].map((_, i) => (
						<div
							key={i}
							className="h-20 rounded-lg bg-muted/30 animate-pulse"
						/>
					))}
				</div>
			) : hook.approvals.length === 0 ? (
				<EmptyState t={t} onNewRequest={() => hook.setShowNewDialog(true)} />
			) : (
				<>
					{/* Desktop Table */}
					<ApprovalTable
						approvals={hook.approvals}
						t={t}
						tc={tc}
						canManage={hook.canManage}
						userId={hook.userId}
						setSelectedApproval={hook.setSelectedApproval}
						setReviewStatus={hook.setReviewStatus}
						setReviewNotes={hook.setReviewNotes}
						setShowReviewDialog={hook.setShowReviewDialog}
						setShowDetailDialog={hook.setShowDetailDialog}
						setShowCancelDialog={hook.setShowCancelDialog}
					/>

					{/* Mobile Cards */}
					<ApprovalCards
						approvals={hook.approvals}
						t={t}
						canManage={hook.canManage}
						userId={hook.userId}
						setSelectedApproval={hook.setSelectedApproval}
						setReviewStatus={hook.setReviewStatus}
						setReviewNotes={hook.setReviewNotes}
						setShowReviewDialog={hook.setShowReviewDialog}
						setShowDetailDialog={hook.setShowDetailDialog}
						setShowCancelDialog={hook.setShowCancelDialog}
					/>

					{/* Pagination */}
					<ApprovalPagination
						page={hook.page}
						totalPages={hook.totalPages}
						total={hook.total}
						setPage={hook.setPage}
						t={t}
					/>
				</>
			)}

			{/* Dialogs */}
			<ApprovalDialogs
				t={t}
				tc={tc}
				showNewDialog={hook.showNewDialog}
				setShowNewDialog={hook.setShowNewDialog}
				newTitle={hook.newTitle}
				setNewTitle={hook.setNewTitle}
				newDescription={hook.newDescription}
				setNewDescription={hook.setNewDescription}
				newType={hook.newType}
				setNewType={hook.setNewType}
				newPriority={hook.newPriority}
				setNewPriority={hook.setNewPriority}
				handleCreate={hook.handleCreate}
				submitting={hook.submitting}
				showReviewDialog={hook.showReviewDialog}
				setShowReviewDialog={hook.setShowReviewDialog}
				selectedApproval={hook.selectedApproval}
				setReviewStatus={hook.setReviewStatus}
				reviewNotes={hook.reviewNotes}
				setReviewNotes={hook.setReviewNotes}
				handleReview={hook.handleReview}
				showDetailDialog={hook.showDetailDialog}
				setShowDetailDialog={hook.setShowDetailDialog}
				canManage={hook.canManage}
				setSelectedApproval={hook.setSelectedApproval}
				setShowCancelDialog={hook.setShowCancelDialog}
				showCancelDialog={hook.showCancelDialog}
				setShowCancelDialogCancel={hook.setShowCancelDialog}
				handleCancel={hook.handleCancel}
			/>
		</div>
	);
}
