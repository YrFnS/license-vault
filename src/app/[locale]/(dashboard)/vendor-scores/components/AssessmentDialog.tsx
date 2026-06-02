"use client";

import { useTranslations } from "next-intl";
import {
	ShieldCheck,
	ChevronDown,
	CheckCircle2,
	XCircle,
	AlertCircle,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
	ResponsiveContainer,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
} from "recharts";
import type { AssessmentResult, VendorScoreData } from "../types";
import { CircularScore } from "./CircularScore";
import { ScoreBar } from "./ScoreBar";
import { Shield, FileCheck, Award, TrendingUp, Clock } from "lucide-react";
import { RISK_BADGE_CONFIG } from "../constants";

interface AssessmentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	result: AssessmentResult | null;
}

export function AssessmentDialog({
	open,
	onOpenChange,
	result,
}: AssessmentDialogProps) {
	const t = useTranslations("vendorScores");

	const getScoreLabel = (score: number) => {
		if (score >= 90) return t("excellent");
		if (score >= 75) return t("good");
		if (score >= 50) return t("needsImprovement");
		return t("poor");
	};

	const catScores = (v: VendorScoreData) => [
		{
			key: "licenseScore",
			label: t("licenseScore"),
			icon: Shield,
			weight: "25%",
		},
		{
			key: "insuranceScore",
			label: t("insuranceScore"),
			icon: ShieldCheck,
			weight: "25%",
		},
		{
			key: "documentScore",
			label: t("documentScore"),
			icon: FileCheck,
			weight: "15%",
		},
		{
			key: "complianceScore",
			label: t("complianceScore"),
			icon: Award,
			weight: "15%",
		},
		{
			key: "experienceScore",
			label: t("experienceScore"),
			icon: TrendingUp,
			weight: "10%",
		},
		{
			key: "responsivenessScore",
			label: t("responsivenessScore"),
			icon: Clock,
			weight: "10%",
		},
	];

	const tooltipStyle = {
		backgroundColor: "hsl(var(--popover))",
		border: "1px solid hsl(var(--border))",
		borderRadius: "8px",
		fontSize: "11px",
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<ShieldCheck className="size-5 text-emerald-500" />{" "}
						{t("assessment")}
					</DialogTitle>
				</DialogHeader>
				{result && (
					<ScrollArea className="max-h-[70vh]">
						<div className="space-y-6 pr-4">
							{/* Overall score */}
							<div className="flex flex-col items-center gap-2 py-4">
								<CircularScore score={result.vendor.overallScore} size={96} />
								<div className="text-center">
									<p className="text-sm font-semibold">
										{result.vendor.vendorName}
									</p>
									<p className="text-xs text-muted-foreground">
										{getScoreLabel(result.vendor.overallScore)}
									</p>
									{(() => {
										const rc =
											RISK_BADGE_CONFIG[result.vendor.riskLevel] ||
											RISK_BADGE_CONFIG.medium;
										return (
											<Badge
												className={`${rc.bg} ${rc.text} border-0 font-semibold`}
											>
												{t(
													result.vendor.riskLevel as
														| "critical"
														| "high"
														| "medium"
														| "low",
												)}
											</Badge>
										);
									})()}
								</div>
							</div>

							{/* Score breakdown */}
							<div>
								<h4 className="text-sm font-semibold mb-3">
									{t("scoreBreakdown")}
								</h4>
								<div className="space-y-1">
									{catScores(result.vendor).map((cat) => (
										<ScoreBar
											key={cat.key}
											label={cat.label}
											score={
												result.vendor[
													cat.key as keyof VendorScoreData
												] as number
											}
											icon={cat.icon}
											weight={cat.weight}
										/>
									))}
								</div>
							</div>

							{/* Findings */}
							{result.findings.length > 0 && (
								<div>
									<h4 className="text-sm font-semibold mb-2">
										{t("findings")}
									</h4>
									<div className="space-y-1.5">
										{result.findings.map((f, i) => (
											<div key={i} className="flex items-start gap-2 text-xs">
												{f.status === "passed" && (
													<CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
												)}
												{f.status === "failed" && (
													<XCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
												)}
												{f.status === "needsAttention" && (
													<AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
												)}
												<span>{f.message}</span>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Recommendations */}
							{result.recommendations.length > 0 && (
								<div>
									<h4 className="text-sm font-semibold mb-2">
										{t("recommendations")}
									</h4>
									<div className="space-y-1.5">
										{result.recommendations.map((r, i) => (
											<div key={i} className="flex items-start gap-2 text-xs">
												<ChevronDown className="size-4 text-teal-500 shrink-0 mt-0.5 rotate-[-90deg]" />
												<span>{r}</span>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Historical trend */}
							{result.history.length > 1 && (
								<div>
									<h4 className="text-sm font-semibold mb-2">
										{t("historical")}
									</h4>
									<ResponsiveContainer width="100%" height={120}>
										<LineChart
											data={result.history.map((h) => ({
												date: new Date(h.date).toLocaleDateString(),
												score: h.score,
											}))}
										>
											<CartesianGrid
												strokeDasharray="3 3"
												stroke="hsl(var(--border))"
												opacity={0.3}
											/>
											<XAxis
												dataKey="date"
												tick={{ fontSize: 10 }}
												stroke="hsl(var(--muted-foreground))"
											/>
											<YAxis
												domain={[0, 100]}
												tick={{ fontSize: 10 }}
												stroke="hsl(var(--muted-foreground))"
											/>
											<Tooltip contentStyle={tooltipStyle} />
											<Line
												type="monotone"
												dataKey="score"
												stroke="#10b981"
												strokeWidth={2}
												dot={{ r: 3 }}
											/>
										</LineChart>
									</ResponsiveContainer>
								</div>
							)}
						</div>
					</ScrollArea>
				)}
			</DialogContent>
		</Dialog>
	);
}
