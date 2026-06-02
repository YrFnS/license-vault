import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { XCircle, CheckCircle2 } from "lucide-react";
import type { ApprovalItem } from "../types";
import { getTypeBadge, getPriorityBadge, getStatusBadge, formatRelativeTime } from "../helpers";

interface ApprovalDialogsProps {
	// translators
	t: (key: string) => string;
	tc: (key: string) => string;
	// New request dialog
	showNewDialog: boolean;
	setShowNewDialog: (v: boolean) => void;
	newTitle: string;
	setNewTitle: (v: string) => void;
	newDescription: string;
	setNewDescription: (v: string) => void;
	newType: string;
	setNewType: (v: string) => void;
	newPriority: string;
	setNewPriority: (v: string) => void;
	handleCreate: () => void;
	submitting: boolean;
	// Review dialog
	showReviewDialog: boolean;
	setShowReviewDialog: (v: boolean) => void;
	selectedApproval: ApprovalItem | null;
	reviewNotes: string;
	setReviewNotes: (v: string) => void;
	handleReview: () => void;
	setReviewStatus: (s: "approved" | "rejected") => void;
	// Detail dialog
	showDetailDialog: boolean;
	setShowDetailDialog: (v: boolean) => void;
	canManage: boolean;
	setSelectedApproval: (a: ApprovalItem | null) => void;
	setShowCancelDialog: (v: boolean) => void;
	// Cancel dialog
	showCancelDialog: boolean;
	setShowCancelDialogCancel: (v: boolean) => void;
	handleCancel: () => void;
}

export function ApprovalDialogs({
	t,
	tc,
	showNewDialog,
	setShowNewDialog,
	newTitle,
	setNewTitle,
	newDescription,
	setNewDescription,
	newType,
	setNewType,
	newPriority,
	setNewPriority,
	handleCreate,
	submitting,
	showReviewDialog,
	setShowReviewDialog,
	selectedApproval,
	reviewNotes,
	setReviewNotes,
	handleReview,
	setReviewStatus,
	showDetailDialog,
	setShowDetailDialog,
	canManage,
	setSelectedApproval,
	setShowCancelDialog,
	showCancelDialog,
	setShowCancelDialogCancel,
	handleCancel,
}: ApprovalDialogsProps) {
	return (
		<>
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
			<AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialogCancel}>
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
		</>
	);
}


