import { CheckSquare, Clock, CheckCircle2, XCircle } from "lucide-react";

export const fadeIn = {
	initial: { opacity: 0, y: 10 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -10 },
};

export function getStatsCardsConfig(
	t: (key: string) => string,
	total: number,
	pending: number,
	approved: number,
	rejected: number,
) {
	return [
		{
			label: t("totalApprovals"),
			value: total,
			icon: CheckSquare,
			color: "text-teal-600 dark:text-teal-400",
			bg: "from-teal-50/90 via-teal-50/60 to-teal-100/40 dark:from-teal-950/30 dark:via-teal-950/20 dark:to-teal-950/10",
			border: "border-s-teal-400 dark:border-s-teal-600",
		},
		{
			label: t("pendingApprovals"),
			value: pending,
			icon: Clock,
			color: "text-amber-600 dark:text-amber-400",
			bg: "from-amber-50/90 via-amber-50/60 to-amber-100/40 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-amber-950/10",
			border: "border-s-amber-400 dark:border-s-amber-600",
		},
		{
			label: t("approvedThisMonth"),
			value: approved,
			icon: CheckCircle2,
			color: "text-emerald-600 dark:text-emerald-400",
			bg: "from-emerald-50/90 via-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/30 dark:via-emerald-950/20 dark:to-emerald-950/10",
			border: "border-s-emerald-400 dark:border-s-emerald-600",
		},
		{
			label: t("rejectedCount"),
			value: rejected,
			icon: XCircle,
			color: "text-red-600 dark:text-red-400",
			bg: "from-red-50/90 via-red-50/60 to-red-100/40 dark:from-red-950/30 dark:via-red-950/20 dark:to-red-950/10",
			border: "border-s-red-400 dark:border-s-red-600",
		},
	];
}
