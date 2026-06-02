"use client";

import { ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { US_STATES } from "./constants";
import { getRecommendationIcon, getSeverityBadge } from "./helpers";
import type { PortfolioData } from "./types";

interface Props {
	portfolioData: PortfolioData | null;
	t: (key: string) => string;
}

export function PortfolioOptimization({ portfolioData, t }: Props) {
	if (!portfolioData || portfolioData.recommendations.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">{t("portfolio.title")}</CardTitle>
					<CardDescription>{t("portfolio.description")}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8 text-muted-foreground">
						<ShieldCheck className="size-8 mx-auto mb-2 text-emerald-500" />
						<p className="font-medium text-emerald-600 dark:text-emerald-400">
							{t("portfolio.noRecommendations")}
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="shadow-sm hover:shadow-md transition-shadow">
			<CardHeader>
				<CardTitle className="text-lg">{t("portfolio.title")}</CardTitle>
				<CardDescription>{t("portfolio.description")}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div>
					<h4 className="text-sm font-semibold mb-3 text-muted-foreground">
						{t("portfolio.recommendations")}
					</h4>
					<div className="space-y-3">
						{portfolioData.recommendations.map((rec, idx) => (
							<div
								key={idx}
								className={cn(
									"flex items-start gap-3 p-3 rounded-lg border",
									rec.severity === "high" &&
										"bg-red-50/50 border-red-200/50 dark:bg-red-950/10 dark:border-red-800/30",
									rec.severity === "medium" &&
										"bg-amber-50/50 border-amber-200/50 dark:bg-amber-950/10 dark:border-amber-800/30",
									rec.severity === "low" &&
										"bg-emerald-50/50 border-emerald-200/50 dark:bg-emerald-950/10 dark:border-emerald-800/30",
								)}
							>
								{getRecommendationIcon(rec.type)}
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium">
										{t(`portfolio.${rec.title}` as any)}
									</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										{rec.description}
									</p>
								</div>
								{getSeverityBadge(rec.severity, t)}
							</div>
						))}
					</div>
				</div>
				<Separator />
				<div>
					<h4 className="text-sm font-semibold mb-3 text-muted-foreground">
						{t("portfolio.stateCoverage")}
					</h4>
					<div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
						<div className="flex items-center gap-1.5">
							<div className="size-3 rounded-sm bg-emerald-500" />
							<span>
								{t("portfolio.coveredStates")} (
								{portfolioData.coverage.coveredStates.length})
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<div className="size-3 rounded-sm bg-amber-500" />
							<span>
								{t("portfolio.uncoveredStates")} (
								{portfolioData.coverage.uncoveredStates.length})
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<div className="size-3 rounded-sm bg-muted" />
							<span>{t("portfolio.noOperations")}</span>
						</div>
					</div>
					<div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-17 gap-1">
						{US_STATES.map((state) => {
							const isCovered =
								portfolioData.coverage.coveredStates.includes(state);
							const isUncovered =
								portfolioData.coverage.uncoveredStates.includes(state);
							return (
								<div
									key={state}
									className={cn(
										"flex items-center justify-center p-1.5 rounded text-[10px] font-medium transition-colors",
										isCovered &&
											"bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
										isUncovered &&
											"bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
										!isCovered &&
											!isUncovered &&
											"bg-muted/30 text-muted-foreground",
									)}
									title={
										isCovered
											? `${state}: Covered`
											: isUncovered
												? `${state}: Coverage Gap`
												: `${state}: No operations`
									}
								>
									{state}
								</div>
							);
						})}
					</div>
					<div className="mt-3 flex items-center gap-2">
						<div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
							<div
								className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
								style={{ width: `${portfolioData.coverage.coveragePercent}%` }}
							/>
						</div>
						<span className="text-xs text-muted-foreground font-medium tabular-nums">
							{portfolioData.coverage.coveragePercent}%
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
