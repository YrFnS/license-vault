"use client";

import {
	ShieldCheck,
	DollarSign,
	AlertTriangle,
	HeartPulse,
	TrendingDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency, getTrendIcon } from "./helpers";
import type { OverviewData } from "./types";

interface Props {
	overview: OverviewData | null;
	t: (key: string) => string;
}

function OverviewCard({
	icon,
	label,
	value,
	trend,
	iconBg,
	iconColor,
	borderColor,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	trend: React.ReactNode;
	iconBg: string;
	iconColor: string;
	borderColor: string;
}) {
	return (
		<Card
			className={cn(
				"shadow-sm hover:shadow-md transition-all duration-300 border-s-4",
				borderColor,
			)}
		>
			<CardContent className="p-4 md:p-6">
				<div className="flex items-center justify-between mb-3">
					<div
						className={cn(
							"flex items-center justify-center size-10 rounded-xl bg-gradient-to-br",
							iconBg,
							iconColor,
						)}
					>
						{icon}
					</div>
					{trend}
				</div>
				<p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
					{label}
				</p>
				<p className="text-2xl md:text-3xl font-extrabold tabular-nums mt-1">
					{value}
				</p>
			</CardContent>
		</Card>
	);
}

export function OverviewCards({ overview, t }: Props) {
	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<OverviewCard
				icon={<ShieldCheck className="size-5" />}
				label={t("overview.complianceScore")}
				value={`${overview?.complianceScore ?? 0}%`}
				trend={getTrendIcon(overview?.complianceScore ?? 0)}
				iconBg="from-emerald-500/20 to-teal-500/20"
				iconColor="text-emerald-600 dark:text-emerald-400"
				borderColor="border-s-emerald-500"
			/>
			<OverviewCard
				icon={<DollarSign className="size-5" />}
				label={t("overview.financialExposure")}
				value={formatCurrency(overview?.financialExposure ?? 0)}
				trend={
					overview?.financialExposure ? (
						overview.financialExposure > 0 ? (
							<TrendingDown className="size-4 text-red-500" />
						) : null
					) : null
				}
				iconBg="from-red-500/20 to-amber-500/20"
				iconColor="text-red-600 dark:text-red-400"
				borderColor="border-s-red-500"
			/>
			<OverviewCard
				icon={<AlertTriangle className="size-5" />}
				label={t("overview.activeRiskItems")}
				value={`${overview?.activeRiskItems ?? 0}`}
				trend={
					overview?.activeRiskItems ? (
						overview.activeRiskItems > 0 ? (
							<TrendingDown className="size-4 text-amber-500" />
						) : null
					) : null
				}
				iconBg="from-amber-500/20 to-orange-500/20"
				iconColor="text-amber-600 dark:text-amber-400"
				borderColor="border-s-amber-500"
			/>
			<OverviewCard
				icon={<HeartPulse className="size-5" />}
				label={t("overview.portfolioHealth")}
				value={`${overview?.portfolioHealth ?? 0}%`}
				trend={getTrendIcon(overview?.portfolioHealth ?? 0)}
				iconBg="from-teal-500/20 to-cyan-500/20"
				iconColor="text-teal-600 dark:text-teal-400"
				borderColor="border-s-teal-500"
			/>
		</div>
	);
}
