import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
	RefreshCw,
	FileText,
	GraduationCap,
	ShieldHalf,
	Clock,
	CheckCircle2,
	XCircle,
	Ban,
	AlertTriangle,
} from "lucide-react";

export function getTypeBadge(type: string, t: (key: string) => string) {
	const config: Record<
		string,
		{ label: string; className: string; icon: any }
	> = {
		license_renewal: {
			label: t("licenseRenewal"),
			className:
				"bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border-teal-200 dark:border-teal-800",
			icon: RefreshCw,
		},
		document_review: {
			label: t("documentReview"),
			className:
				"bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
			icon: FileText,
		},
		ce_verification: {
			label: t("ceVerification"),
			className:
				"bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
			icon: GraduationCap,
		},
		insurance_update: {
			label: t("insuranceUpdate"),
			className:
				"bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
			icon: ShieldHalf,
		},
		other: {
			label: t("other"),
			className:
				"bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border-slate-200 dark:border-slate-700",
			icon: FileText,
		},
	};
	const c = config[type] || config.other;
	const Icon = c.icon;
	return (
		<Badge
			variant="outline"
			className={cn("text-xs gap-1 font-medium", c.className)}
		>
			<Icon className="size-3" />
			{c.label}
		</Badge>
	);
}

export function getPriorityBadge(priority: string, t: (key: string) => string) {
	const config: Record<string, { label: string; className: string }> = {
		urgent: {
			label: t("urgent"),
			className:
				"bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800",
		},
		high: {
			label: t("high"),
			className:
				"bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800",
		},
		medium: {
			label: t("medium"),
			className:
				"bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
		},
		low: {
			label: t("low"),
			className:
				"bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border-teal-200 dark:border-teal-800",
		},
	};
	const c = config[priority] || config.medium;
	return (
		<Badge variant="outline" className={cn("text-xs font-medium", c.className)}>
			{(priority === "urgent" || priority === "high") && (
				<AlertTriangle className="size-3 me-1" />
			)}
			{c.label}
		</Badge>
	);
}

export function getStatusBadge(status: string, t: (key: string) => string) {
	const config: Record<
		string,
		{ label: string; className: string; icon: any }
	> = {
		pending: {
			label: t("pending"),
			className:
				"bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
			icon: Clock,
		},
		approved: {
			label: t("approved"),
			className:
				"bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
			icon: CheckCircle2,
		},
		rejected: {
			label: t("rejected"),
			className:
				"bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800",
			icon: XCircle,
		},
		cancelled: {
			label: t("cancelled"),
			className:
				"bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border-slate-200 dark:border-slate-700",
			icon: Ban,
		},
	};
	const c = config[status] || config.pending;
	const Icon = c.icon;
	return (
		<Badge
			variant="outline"
			className={cn("text-xs gap-1 font-medium", c.className)}
		>
			<Icon className="size-3" />
			{c.label}
		</Badge>
	);
}

export function formatRelativeTime(
	dateStr: string,
	t: (key: string) => string,
): string {
	const now = new Date();
	const date = new Date(dateStr);
	const diffMs = now.getTime() - date.getTime();
	const diffMinutes = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMinutes < 1) return t("justNow");
	if (diffHours < 1) return `${diffMinutes}m`;
	if (diffHours < 24) return `${diffHours}h`;
	if (diffDays < 30) return `${diffDays} ${t("daysAgo")}`;
	return date.toLocaleDateString();
}
