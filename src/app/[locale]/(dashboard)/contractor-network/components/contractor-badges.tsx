"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
	const r = (size - 8) / 2;
	const circumference = 2 * Math.PI * r;
	const strokeDashoffset = circumference - (score / 100) * circumference;
	const color =
		score >= 80 ? "#10b981" :
		score >= 60 ? "#f59e0b" :
		score >= 40 ? "#f97316" : "#ef4444";

	return (
		<div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
			<svg width={size} height={size} className="-rotate-90">
				<circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={4} className="text-muted/30" />
				<circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
					strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
					className="transition-all duration-700" />
			</svg>
			<span className="absolute text-xs font-bold" style={{ color }}>{score}</span>
		</div>
	);
}

export function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
	return (
		<div className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map((i) => (
				<Star key={i} size={size} className={cn(
					i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
				)} />
			))}
		</div>
	);
}

export function TradeBadge({ tradeType }: { tradeType: string }) {
	const t = useTranslations("contractorNetwork");
	const config: Record<string, { className: string }> = {
		electrical: { className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
		plumbing: { className: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
		hvac: { className: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border-teal-200 dark:border-teal-800" },
		general: { className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
		roofing: { className: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800" },
		concrete: { className: "bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 border-slate-200 dark:border-slate-700" },
		painting: { className: "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400 border-pink-200 dark:border-pink-800" },
		landscaping: { className: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border-green-200 dark:border-green-800" },
		other: { className: "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300 border-gray-200 dark:border-gray-700" },
	};
	const c = config[tradeType] || config.other;
	const label = t(tradeType as string as any) || tradeType;
	return <Badge variant="outline" className={cn("text-xs font-medium capitalize", c.className)}>{label}</Badge>;
}

export function LicenseStatusBadge({ status }: { status: string }) {
	const config: Record<string, { label: string; className: string }> = {
		active: { label: "Active", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
		expired: { label: "Expired", className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800" },
		suspended: { label: "Suspended", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
		revoked: { label: "Revoked", className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800" },
		unknown: { label: "Unknown", className: "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400 border-gray-200 dark:border-gray-700" },
	};
	const c = config[status] || config.unknown;
	return <Badge variant="outline" className={cn("text-xs font-medium", c.className)}>{c.label}</Badge>;
}

export function InsuranceStatusBadge({ status }: { status: string }) {
	const config: Record<string, { label: string; className: string }> = {
		compliant: { label: "Compliant", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
		deficient: { label: "Deficient", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
		expired: { label: "Expired", className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800" },
		unknown: { label: "Unknown", className: "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400 border-gray-200 dark:border-gray-700" },
	};
	const c = config[status] || config.unknown;
	return <Badge variant="outline" className={cn("text-xs font-medium", c.className)}>{c.label}</Badge>;
}
