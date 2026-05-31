"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ShieldCheck, Award, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem, type DirectoryStats } from "./types";

interface StatsCardsProps {
	stats: DirectoryStats | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
	const t = useTranslations("contractorNetwork");

	const cards = [
		{
			label: t("totalContractors"),
			value: stats?.totalContractors || 0,
			icon: Users,
			color: "text-teal-600 dark:text-teal-400",
			bg: "bg-gradient-to-br from-teal-50/90 via-teal-50/60 to-emerald-100/40 dark:from-teal-950/40 dark:via-teal-950/20 dark:to-emerald-950/10",
			border: "border-s-teal-500",
		},
		{
			label: t("verified"),
			value: stats?.verifiedCount || 0,
			icon: ShieldCheck,
			color: "text-emerald-600 dark:text-emerald-400",
			bg: "bg-gradient-to-br from-emerald-50/90 via-emerald-50/60 to-teal-100/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-teal-950/10",
			border: "border-s-emerald-500",
		},
		{
			label: t("preferred"),
			value: stats?.preferredCount || 0,
			icon: Award,
			color: "text-amber-600 dark:text-amber-400",
			bg: "bg-gradient-to-br from-amber-50/90 via-amber-50/60 to-orange-100/40 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-orange-950/10",
			border: "border-s-amber-500",
		},
		{
			label: t("avgScore"),
			value: stats?.avgScore || 0,
			icon: TrendingUp,
			color: "text-emerald-600 dark:text-emerald-400",
			bg: "bg-gradient-to-br from-emerald-50/90 via-emerald-50/60 to-teal-100/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-teal-950/10",
			border: "border-s-emerald-600",
		},
	];

	return (
		<motion.div
			variants={staggerContainer}
			initial="initial"
			animate="animate"
			className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
		>
			{cards.map((stat) => {
				const Icon = stat.icon;
				return (
					<motion.div
						key={stat.label}
						variants={staggerItem}
						whileHover={{ scale: 1.02, y: -2 }}
						transition={{ type: "spring", stiffness: 400, damping: 25 }}
					>
						<Card className={cn(
							"relative overflow-hidden border-s-4 shadow-sm hover:shadow-md transition-shadow duration-300",
							stat.bg, stat.border,
						)}>
							<CardContent className="p-3 md:p-4 lg:p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-xs uppercase tracking-wider text-muted-foreground/70 font-bold">{stat.label}</p>
										<p className="text-2xl lg:text-3xl font-extrabold tabular-nums mt-1">{stat.value}</p>
									</div>
									<div className="rounded-xl p-2 lg:p-3 bg-background/50 shadow-sm">
										<Icon className={cn("size-5 lg:size-6", stat.color)} />
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
