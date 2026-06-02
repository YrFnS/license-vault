import { motion, AnimatePresence } from "framer-motion";
import { Eye, Ban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ApprovalItem } from "../types";
import { getTypeBadge, getPriorityBadge, getStatusBadge, formatRelativeTime } from "../helpers";

interface ApprovalCardsProps {
	approvals: ApprovalItem[];
	t: (key: string) => string;
	canManage: boolean;
	userId?: string;
	setSelectedApproval: (a: ApprovalItem | null) => void;
	setReviewStatus: (s: "approved" | "rejected") => void;
	setReviewNotes: (n: string) => void;
	setShowReviewDialog: (v: boolean) => void;
	setShowDetailDialog: (v: boolean) => void;
	setShowCancelDialog: (v: boolean) => void;
}

export function ApprovalCards({
	approvals,
	t,
	canManage,
	userId,
	setSelectedApproval,
	setReviewStatus,
	setReviewNotes,
	setShowReviewDialog,
	setShowDetailDialog,
	setShowCancelDialog,
}: ApprovalCardsProps) {
	return (
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
	);
}
