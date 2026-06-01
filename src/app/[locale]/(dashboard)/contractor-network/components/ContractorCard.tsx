"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Verified, Award, Ban, Eye, ShieldCheck, MapPin,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Contractor } from "./types";
import { ScoreRing, StarRating, TradeBadge, LicenseStatusBadge, InsuranceStatusBadge } from "./ui-components";

interface ContractorCardProps {
	contractor: Contractor;
	isSelected: boolean;
	canManage: boolean;
	onToggleSelect: () => void;
	onOpenDetail: () => void;
	onVerify: () => void;
}

export function ContractorCard({
	contractor: c, isSelected, canManage, onToggleSelect, onOpenDetail, onVerify,
}: ContractorCardProps) {
	const t = useTranslations("contractorNetwork");

	return (
		<motion.div
			whileHover={{ y: -2 }}
			transition={{ type: "spring", stiffness: 400, damping: 25 }}
		>
			<Card
				className={cn(
					"shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer",
					isSelected && "ring-2 ring-emerald-500/50",
					c.isBlacklisted && "opacity-60",
				)}
				onClick={onOpenDetail}
			>
				<CardContent className="p-4">
					<div className="flex items-start gap-3">
						<div className="shrink-0 mt-0.5">
							{canManage && (
								<Checkbox
									checked={isSelected}
									onCheckedChange={onToggleSelect}
									onClick={(e) => e.stopPropagation()}
									className="mb-2"
								/>
							)}
							<ScoreRing score={c.complianceScore} />
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-1.5 flex-wrap">
								<p className="font-semibold truncate">{c.companyName}</p>
								{c.isVerified && <Verified className="size-4 text-emerald-500 shrink-0" />}
								{c.isPreferred && <Award className="size-4 text-amber-500 shrink-0" />}
								{c.isBlacklisted && <Ban className="size-4 text-red-500 shrink-0" />}
							</div>
							<div className="flex items-center gap-2 mt-1 flex-wrap">
								<TradeBadge tradeType={c.tradeType} />
								{c.city && c.state && (
									<span className="text-xs text-muted-foreground flex items-center gap-0.5">
										<MapPin className="size-3" />
										{c.city}, {c.state}
									</span>
								)}
							</div>
							<div className="flex items-center gap-2 mt-2">
								<StarRating rating={c.rating} size={12} />
								<span className="text-xs text-muted-foreground">({c.reviewCount})</span>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2 mt-3 flex-wrap">
						<LicenseStatusBadge status={c.licenseStatus} />
						<InsuranceStatusBadge status={c.insuranceStatus} />
					</div>

					<div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t">
						<Button
							variant="ghost" size="sm"
							className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 h-7 text-xs"
							onClick={(e) => { e.stopPropagation(); onOpenDetail(); }}
						>
							<Eye className="size-3 me-1" />{t("viewDetails")}
						</Button>
						{canManage && !c.isVerified && (
							<Button
								variant="ghost" size="sm"
								className="text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 h-7 text-xs"
								onClick={(e) => { e.stopPropagation(); onVerify(); }}
							>
								<ShieldCheck className="size-3 me-1" />{t("verify")}
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
