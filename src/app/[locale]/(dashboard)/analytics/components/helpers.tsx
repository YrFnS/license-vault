import {
	TrendingUp,
	TrendingDown,
	Minus,
	AlertOctagon,
	Lightbulb,
	FileWarning,
	Repeat,
	AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(amount);
}

export function getTrendIcon(score: number) {
	if (score >= 80) return <TrendingUp className="size-4 text-emerald-500" />;
	if (score >= 60) return <Minus className="size-4 text-amber-500" />;
	return <TrendingDown className="size-4 text-red-500" />;
}

export function getRecommendationIcon(type: string) {
	switch (type) {
		case "expired_active":
			return <AlertOctagon className="size-4 text-red-500 shrink-0" />;
		case "reciprocity":
			return <Lightbulb className="size-4 text-teal-500 shrink-0" />;
		case "missing":
			return <FileWarning className="size-4 text-amber-500 shrink-0" />;
		case "consolidation":
			return <Repeat className="size-4 text-emerald-500 shrink-0" />;
		default:
			return <AlertTriangle className="size-4 text-slate-500 shrink-0" />;
	}
}

export function getSeverityBadge(severity: string, t: (key: string) => string) {
	switch (severity) {
		case "high":
			return (
				<Badge className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800">
					{t("cost.high")}
				</Badge>
			);
		case "medium":
			return (
				<Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
					{t("cost.medium")}
				</Badge>
			);
		case "low":
			return (
				<Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
					{t("cost.low")}
				</Badge>
			);
		default:
			return null;
	}
}
