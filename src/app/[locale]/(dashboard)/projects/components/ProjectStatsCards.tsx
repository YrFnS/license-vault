"use client";

import { motion } from "framer-motion";
import { FolderKanban, TrendingUp, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCard {
	label: string;
	value: string | number;
	icon: React.ComponentType<{ className?: string }>;
	border: string;
	iconColor: string;
}

interface Props {
	counts: { all: number; active: number; completed: number; on_hold: number };
	stats: { avgCompliance: number; atRiskCount: number };
	t: (key: string) => string;
}

const fadeIn = {
	initial: { opacity: 0, y: 12 },
	animate: { opacity: 1, y: 0 },
};

const containerVariants = {
	animate: { transition: { staggerChildren: 0.05 } },
};

export function ProjectStatsCards({ counts, stats, t }: Props) {
	const statCards: StatCard[] = [
		{
			label: t("totalProjects"),
			value: counts.all,
			icon: FolderKanban,
			border: "border-l-slate-400",
			iconColor: "text-slate-500",
		},
		{
			label: t("activeProjects"),
			value: counts.active,
			icon: TrendingUp,
			border: "border-l-emerald-500",
			iconColor: "text-emerald-600 dark:text-emerald-400",
		},
		{
			label: t("complianceRate"),
			value: `${stats.avgCompliance}%`,
			icon: Shield,
			border: "border-l-emerald-500",
			iconColor: "text-emerald-600 dark:text-emerald-400",
		},
		{
			label: t("atRisk"),
			value: stats.atRiskCount,
			icon: AlertTriangle,
			border: "border-l-red-500",
			iconColor: "text-red-600 dark:text-red-400",
		},
	];

	return (
		<motion.div
			variants={containerVariants}
			initial="initial"
			animate="animate"
			className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
		>
			{statCards.map((stat, idx) => {
				const Icon = stat.icon;
				return (
					<motion.div key={idx} variants={fadeIn}>
						<Card className={cn("border-l-2", stat.border)}>
							<CardContent className="p-3 md:p-4 lg:p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-xs uppercase tracking-wider text-muted-foreground/70 font-bold">
											{stat.label}
										</p>
										<p className="text-2xl lg:text-3xl font-extrabold tabular-nums mt-1">
											{stat.value}
										</p>
									</div>
									<div
										className={cn(
											"rounded-xl p-2 lg:p-3 shadow-sm",
											"bg-background/50",
										)}
									>
										<Icon className={cn("size-5 lg:size-6", stat.iconColor)} />
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				);
			})}
		</motion.div>
	);
}
