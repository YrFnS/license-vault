"use client";

import { useTranslations } from "next-intl";
import { Plus, Users, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { ProjectSub } from "./types";
import { SubStatusBadge } from "./status-badges";

interface SubcontractorsTabProps {
	projectSubs: ProjectSub[];
	onAddSub: () => void;
	onRemoveSub: (linkId: string) => void;
}

export function SubcontractorsTab({
	projectSubs,
	onAddSub,
	onRemoveSub,
}: SubcontractorsTabProps) {
	const t = useTranslations("projects");

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">{t("linkedSubs")}</h2>
				<Button
					onClick={onAddSub}
					size="sm"
					className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
				>
					<Plus className="size-4 me-1" />
					{t("addSubcontractor")}
				</Button>
			</div>

			{projectSubs.length === 0 ? (
				<Card className="border-dashed">
					<CardContent className="py-12 text-center">
						<Users className="size-10 mx-auto text-muted-foreground/40 mb-3" />
						<p className="text-muted-foreground">{t("noSubsLinked")}</p>
						<p className="text-xs text-muted-foreground/60 mt-1">
							{t("noSubsLinkedDesc")}
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-3">
					{projectSubs.map((ps, idx) => (
						<motion.div
							key={ps.id}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.03 }}
						>
							<Card className="hover:shadow-sm transition-shadow">
								<CardContent className="p-4">
									<div className="flex items-start justify-between gap-4">
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<span className="font-semibold">
													{ps.subcontractor.companyName}
												</span>
												{ps.role && (
													<Badge variant="outline" className="text-xs">
														{ps.role}
													</Badge>
												)}
												<SubStatusBadge status={ps.complianceStatus} />
											</div>
											<div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
												{ps.subcontractor.tradeType && (
													<span>{ps.subcontractor.tradeType}</span>
												)}
												<span>{ps.subcontractor.email}</span>
											</div>
											{ps.notes && (
												<p className="text-xs text-muted-foreground/70 mt-1">
													{ps.notes}
												</p>
											)}
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="shrink-0 text-muted-foreground hover:text-destructive"
											onClick={() => onRemoveSub(ps.id)}
										>
											<Trash2 className="size-4" />
										</Button>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</div>
			)}
		</div>
	);
}
