"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ComplianceData, ProjectLicense, ProjectSub } from "./types";

interface ComplianceTabProps {
	compliance: ComplianceData | null;
	projectLicenses: ProjectLicense[];
	projectSubs: ProjectSub[];
}

export function ComplianceTab({
	compliance,
	projectLicenses,
	projectSubs,
}: ComplianceTabProps) {
	const t = useTranslations("projects");

	if (!compliance) {
		return (
			<Card className="border-dashed">
				<CardContent className="py-12 text-center">
					<p className="text-muted-foreground">{t("noComplianceData")}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			{/* Score Breakdown */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">
							{t("licenseCompliance")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-2xl font-extrabold">
								{compliance.licenses.score}%
							</span>
							<span className="text-sm text-muted-foreground">
								{compliance.licenses.active}/{compliance.licenses.total}{" "}
								{t("activeLabel")}
							</span>
						</div>
						<Progress value={compliance.licenses.score} className="h-2" />
						<div className="grid grid-cols-3 gap-2 text-center text-xs">
							<div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
								<p className="font-bold text-emerald-600 dark:text-emerald-400">
									{compliance.licenses.active}
								</p>
								<p className="text-muted-foreground">{t("licenseActive")}</p>
							</div>
							<div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
								<p className="font-bold text-amber-600 dark:text-amber-400">
									{compliance.licenses.expiring}
								</p>
								<p className="text-muted-foreground">{t("licenseExpiring")}</p>
							</div>
							<div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
								<p className="font-bold text-red-600 dark:text-red-400">
									{compliance.licenses.expired}
								</p>
								<p className="text-muted-foreground">{t("licenseExpired")}</p>
							</div>
						</div>
						{compliance.licenses.required > 0 && (
							<div className="flex items-center justify-between text-sm pt-2 border-t">
								<span>{t("requiredMet")}</span>
								<span
									className={
										compliance.licenses.requiredMet >= compliance.licenses.required
											? "text-emerald-600 dark:text-emerald-400"
											: "text-red-600 dark:text-red-400"
									}
								>
									{compliance.licenses.requiredMet}/
									{compliance.licenses.required}
								</span>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">
							{t("subCompliance")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-2xl font-extrabold">
								{compliance.subcontractors.score}%
							</span>
							<span className="text-sm text-muted-foreground">
								{compliance.subcontractors.compliant}/
								{compliance.subcontractors.total} {t("compliantLabel")}
							</span>
						</div>
						<Progress
							value={compliance.subcontractors.score}
							className="h-2"
						/>
						<div className="grid grid-cols-3 gap-2 text-center text-xs">
							<div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
								<p className="font-bold text-emerald-600 dark:text-emerald-400">
									{compliance.subcontractors.compliant}
								</p>
								<p className="text-muted-foreground">{t("subCompliant")}</p>
							</div>
							<div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
								<p className="font-bold text-amber-600 dark:text-amber-400">
									{compliance.subcontractors.pending}
								</p>
								<p className="text-muted-foreground">{t("subPending")}</p>
							</div>
							<div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
								<p className="font-bold text-red-600 dark:text-red-400">
									{compliance.subcontractors.nonCompliant}
								</p>
								<p className="text-muted-foreground">{t("subNonCompliant")}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Risk & Gaps */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium flex items-center gap-2">
						<AlertTriangle
							className={`size-4 text-${compliance.riskColor}-500`}
						/>
						{t("riskAnalysis")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3 mb-4">
						<Badge
							className={`bg-${compliance.riskColor}-100 text-${compliance.riskColor}-700 dark:bg-${compliance.riskColor}-950/30 dark:text-${compliance.riskColor}-400`}
						>
							{compliance.riskLevel === "low"
								? t("riskLow")
								: compliance.riskLevel === "medium"
									? t("riskMedium")
									: t("riskHigh")}
						</Badge>
						<span className="text-sm text-muted-foreground">
							{t("overallScore")}: {compliance.score}%
						</span>
					</div>

					{/* Compliance Heatmap */}
					<div className="mb-4">
						<p className="text-xs font-medium text-muted-foreground mb-2">
							{t("complianceHeatmap")}
						</p>
						<div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
							{projectLicenses.map((pl) => (
								<div
									key={`lic-${pl.id}`}
									className={`aspect-square rounded-md relative group cursor-default transition-transform hover:scale-110 ${
										pl.license.computedStatus === "active"
											? "bg-emerald-500"
											: pl.license.computedStatus === "expiring_soon"
												? "bg-amber-500"
												: "bg-red-500"
									}`}
									title={`${pl.license.name}: ${pl.license.computedStatus}`}
								>
									<div className="absolute bottom-full start-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[10px] font-medium text-white bg-slate-900 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
										{pl.license.name}
									</div>
								</div>
							))}
							{projectSubs.map((ps) => (
								<div
									key={`sub-${ps.id}`}
									className={`aspect-square rounded-md relative group cursor-default transition-transform hover:scale-110 ${
										ps.complianceStatus === "compliant"
											? "bg-emerald-500"
											: ps.complianceStatus === "pending"
												? "bg-amber-500"
												: "bg-red-500"
									}`}
									title={`${ps.subcontractor.companyName}: ${ps.complianceStatus}`}
								>
									<div className="absolute bottom-full start-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[10px] font-medium text-white bg-slate-900 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
										{ps.subcontractor.companyName}
									</div>
								</div>
							))}
							{projectLicenses.length === 0 && projectSubs.length === 0 && (
								<div className="col-span-full text-center text-sm text-muted-foreground py-4">
									{t("noItemsLinked")}
								</div>
							)}
						</div>
						<div className="flex gap-4 mt-2 text-xs text-muted-foreground">
							<span className="flex items-center gap-1">
								<span className="size-2 rounded-sm bg-emerald-500" />{" "}
								{t("compliantLabel")}
							</span>
							<span className="flex items-center gap-1">
								<span className="size-2 rounded-sm bg-amber-500" />{" "}
								{t("attentionNeeded")}
							</span>
							<span className="flex items-center gap-1">
								<span className="size-2 rounded-sm bg-red-500" />{" "}
								{t("nonCompliantLabel")}
							</span>
						</div>
					</div>

					{/* Gap Analysis */}
					{compliance.gaps.length > 0 && (
						<div className="p-3 rounded-lg bg-gradient-to-r from-red-50/80 to-amber-50/60 dark:from-red-950/20 dark:to-amber-950/10 border border-red-200/50 dark:border-red-800/30">
							<p className="text-xs font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-1.5">
								<AlertTriangle className="size-3.5" />
								{t("gapsIdentified")}
							</p>
							<ul className="space-y-1.5">
								{compliance.gaps.map((gap, i) => (
									<li
										key={i}
										className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
									>
										<span className="size-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
										{gap}
									</li>
								))}
							</ul>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
