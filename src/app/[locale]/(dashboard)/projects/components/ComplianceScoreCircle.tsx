"use client";

import { cn } from "@/lib/utils";

export function ComplianceScoreCircle({
	score,
	size = 56,
}: {
	score: number;
	size?: number;
}) {
	const radius = (size - 8) / 2;
	const circumference = 2 * Math.PI * radius;
	const strokeDashoffset = circumference - (score / 100) * circumference;

	const getColor = (s: number) => {
		if (s >= 80)
			return {
				stroke: "#10b981",
				text: "text-emerald-600 dark:text-emerald-400",
				bg: "bg-emerald-50 dark:bg-emerald-950/30",
			};
		if (s >= 60)
			return {
				stroke: "#f59e0b",
				text: "text-amber-600 dark:text-amber-400",
				bg: "bg-amber-50 dark:bg-amber-950/30",
			};
		return {
			stroke: "#ef4444",
			text: "text-red-600 dark:text-red-400",
			bg: "bg-red-50 dark:bg-red-950/30",
		};
	};

	const color = getColor(score);

	return (
		<div
			className="relative inline-flex items-center justify-center"
			style={{ width: size, height: size }}
		>
			<svg width={size} height={size} className="-rotate-90">
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="currentColor"
					strokeWidth={3}
					className="text-muted/20"
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke={color.stroke}
					strokeWidth={3}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={strokeDashoffset}
					className="transition-all duration-700 ease-out"
				/>
			</svg>
			<span className={cn("absolute text-xs font-bold", color.text)}>
				{score}%
			</span>
		</div>
	);
}
