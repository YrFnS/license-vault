import { cn } from "@/lib/utils";

interface ScoreRingProps {
	score: number;
	size?: number;
}

export function ScoreRing({ score, size = 56 }: ScoreRingProps) {
	const r = (size - 8) / 2;
	const circumference = 2 * Math.PI * r;
	const strokeDashoffset = circumference - (score / 100) * circumference;
	const color =
		score >= 80
			? "#10b981"
			: score >= 60
				? "#f59e0b"
				: score >= 40
					? "#f97316"
					: "#ef4444";

	return (
		<div
			className="relative inline-flex items-center justify-center"
			style={{ width: size, height: size }}
		>
			<svg width={size} height={size} className="-rotate-90">
				<circle
					cx={size / 2}
					cy={size / 2}
					r={r}
					fill="none"
					stroke="currentColor"
					strokeWidth={4}
					className="text-muted/30"
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={r}
					fill="none"
					stroke={color}
					strokeWidth={4}
					strokeDasharray={circumference}
					strokeDashoffset={strokeDashoffset}
					strokeLinecap="round"
					className="transition-all duration-700"
				/>
			</svg>
			<span className="absolute text-xs font-bold" style={{ color }}>
				{score}
			</span>
		</div>
	);
}
