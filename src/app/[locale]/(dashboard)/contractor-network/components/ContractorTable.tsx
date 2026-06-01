"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, ShieldCheck, Ban, Verified, Award } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Contractor } from "./types";
import { ScoreRing, StarRating, TradeBadge, LicenseStatusBadge, InsuranceStatusBadge } from "./ui-components";

interface ContractorTableProps {
	contractors: Contractor[];
	selectedIds: Set<string>;
	canManage: boolean;
	onToggleSelect: (id: string) => void;
	onToggleSelectAll: () => void;
	onOpenDetail: (c: Contractor) => void;
	onVerify: (c: Contractor) => void;
	onBlacklist: (c: Contractor) => void;
}

export function ContractorTable({
	contractors, selectedIds, canManage, onToggleSelect, onToggleSelectAll,
	onOpenDetail, onVerify, onBlacklist,
}: ContractorTableProps) {
	const t = useTranslations("contractorNetwork");
	const tc = useTranslations("common");

	return (
		<Card className="shadow-sm">
			<CardContent className="p-0">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/50">
								<th className="p-3 w-10">
									<Checkbox
										checked={selectedIds.size === contractors.length && contractors.length > 0}
										onCheckedChange={onToggleSelectAll}
									/>
								</th>
								<th className="text-start p-3 font-medium text-muted-foreground">Company</th>
								<th className="text-start p-3 font-medium text-muted-foreground">Trade</th>
								<th className="text-start p-3 font-medium text-muted-foreground">Location</th>
								<th className="text-start p-3 font-medium text-muted-foreground">Score</th>
								<th className="text-start p-3 font-medium text-muted-foreground">Rating</th>
								<th className="text-start p-3 font-medium text-muted-foreground">License</th>
								<th className="text-start p-3 font-medium text-muted-foreground">Insurance</th>
								<th className="text-end p-3 font-medium text-muted-foreground">{tc("actions")}</th>
							</tr>
						</thead>
						<tbody>
							<AnimatePresence>
								{contractors.map((c) => (
									<motion.tr
										key={c.id}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										className={cn(
											"border-b last:border-0 transition-colors duration-150 cursor-pointer",
											selectedIds.has(c.id)
												? "bg-emerald-50/50 dark:bg-emerald-950/20"
												: "hover:bg-muted/30",
											c.isBlacklisted && "opacity-60",
										)}
										onClick={() => onOpenDetail(c)}
									>
										<td className="p-3">
											<Checkbox
												checked={selectedIds.has(c.id)}
												onCheckedChange={() => onToggleSelect(c.id)}
												onClick={(e) => e.stopPropagation()}
											/>
										</td>
										<td className="p-3">
											<div className="flex items-center gap-2">
												<div>
													<div className="flex items-center gap-1">
														<p className="font-medium">{c.companyName}</p>
														{c.isVerified && <Verified className="size-3.5 text-emerald-500" />}
														{c.isPreferred && <Award className="size-3.5 text-amber-500" />}
														{c.isBlacklisted && <Ban className="size-3.5 text-red-500" />}
													</div>
													{c.contactName && (
														<p className="text-xs text-muted-foreground">{c.contactName}</p>
													)}
												</div>
											</div>
										</td>
										<td className="p-3"><TradeBadge tradeType={c.tradeType} /></td>
										<td className="p-3 text-muted-foreground text-xs">
											{c.city && c.state ? `${c.city}, ${c.state}` : c.state || "—"}
										</td>
										<td className="p-3">
											<div className="flex items-center gap-2">
												<ScoreRing score={c.complianceScore} size={36} />
											</div>
										</td>
										<td className="p-3">
											<div className="flex items-center gap-1">
												<StarRating rating={c.rating} size={12} />
												<span className="text-xs text-muted-foreground">({c.reviewCount})</span>
											</div>
										</td>
										<td className="p-3"><LicenseStatusBadge status={c.licenseStatus} /></td>
										<td className="p-3"><InsuranceStatusBadge status={c.insuranceStatus} /></td>
										<td className="p-3">
											<div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
												<Button variant="ghost" size="icon"
													className="size-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30"
													onClick={() => onOpenDetail(c)}>
													<Eye className="size-4" />
													<span className="sr-only">{tc("viewDetails")}</span>
												</Button>
												{canManage && !c.isVerified && (
													<Button variant="ghost" size="icon"
														className="size-8 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950/30"
														onClick={() => onVerify(c)}>
														<ShieldCheck className="size-4" />
														<span className="sr-only">{t("verify")}</span>
													</Button>
												)}
												{canManage && (
													<Button variant="ghost" size="icon"
														className={cn("size-8", c.isBlacklisted
															? "hover:bg-emerald-50 hover:text-emerald-600"
															: "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30")}
														onClick={() => onBlacklist(c)}>
														<Ban className="size-4" />
														<span className="sr-only">{t("blacklistedBadge")}</span>
													</Button>
												)}
											</div>
										</td>
									</motion.tr>
								))}
							</AnimatePresence>
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}
