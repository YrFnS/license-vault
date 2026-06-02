import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Eye, Ban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ApprovalItem } from "../types";
import { getTypeBadge, getPriorityBadge, getStatusBadge, formatRelativeTime } from "../helpers";

interface ApprovalTableProps {
	approvals: ApprovalItem[];
	t: (key: string) => string;
	tc: (key: string) => string;
	canManage: boolean;
	userId?: string;
	setSelectedApproval: (a: ApprovalItem | null) => void;
	setReviewStatus: (s: "approved" | "rejected") => void;
	setReviewNotes: (n: string) => void;
	setShowReviewDialog: (v: boolean) => void;
	setShowDetailDialog: (v: boolean) => void;
	setShowCancelDialog: (v: boolean) => void;
}

export function ApprovalTable({
	approvals,
	t,
	tc,
	canManage,
	userId,
	setSelectedApproval,
	setReviewStatus,
	setReviewNotes,
	setShowReviewDialog,
	setShowDetailDialog,
	setShowCancelDialog,
}: ApprovalTableProps) {
	return (
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
	);
}
