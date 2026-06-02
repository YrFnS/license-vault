"use client";

import { useTranslations } from "next-intl";
import {
	Building2,
	MapPin,
	Clock,
	Shield,
	Users,
	ShieldCheck,
	FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectData, ProjectLicense, ProjectSub } from "./types";

interface OverviewTabProps {
	project: ProjectData;
	projectLicenses: ProjectLicense[];
	projectSubs: ProjectSub[];
}

export function OverviewTab({
	project,
	projectLicenses,
	projectSubs,
}: OverviewTabProps) {
	const t = useTranslations("projects");
	const tc = useTranslations("common");

	const scoreColor =
		project.complianceScore >= 80
			? "emerald"
			: project.complianceScore >= 60
				? "amber"
				: "red";
	const circumference = 2 * Math.PI * 40;
	const strokeDashoffset =
		circumference - (project.complianceScore / 100) * circumference;

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{/* Compliance Score Card */}
				<Card className="bg-gradient-to-br from-emerald-50/50 via-emerald-50/30 to-teal-50/20 dark:from-emerald-950/20 dark:via-emerald-950/10 dark:to-teal-950/5 border-emerald-200/50 dark:border-emerald-800/30">
					<CardContent className="p-6 flex flex-col items-center text-center">
						<div className="relative size-24 mb-3">
							<svg className="size-24 -rotate-90" viewBox="0 0 88 88">
								<circle
									cx="44"
									cy="44"
									r="40"
									fill="none"
									className="stroke-muted"
									strokeWidth="5"
								/>
								<circle
									cx="44"
									cy="44"
									r="40"
									fill="none"
									className={`stroke-${scoreColor}-500`}
									strokeWidth="5"
									strokeDasharray={circumference}
									strokeDashoffset={strokeDashoffset}
									strokeLinecap="round"
								/>
							</svg>
							<span
								className={`absolute inset-0 flex items-center justify-center text-2xl font-extrabold text-${scoreColor}-600 dark:text-${scoreColor}-400`}
							>
								{project.complianceScore}%
							</span>
						</div>
						<p className="text-sm font-medium">{t("complianceScore")}</p>
						<p className="text-xs text-muted-foreground mt-1">
							{project.complianceScore >= 80
								? t("scoreGood")
								: project.complianceScore >= 60
									? t("scoreFair")
									: t("scorePoor")}
						</p>
					</CardContent>
				</Card>

				{/* Project Info */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							{t("projectInfo")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{project.clientName && (
							<div className="flex items-center gap-2 text-sm">
								<Building2 className="size-4 text-muted-foreground" />
								<span>{project.clientName}</span>
							</div>
						)}
						{project.clientEmail && (
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<span className="ps-6">{project.clientEmail}</span>
							</div>
						)}
						{project.location && (
							<div className="flex items-center gap-2 text-sm">
								<MapPin className="size-4 text-muted-foreground" />
								<span>{project.location}</span>
							</div>
						)}
						{/* Project Timeline */}
						{(project.startDate || project.endDate) && (
							<div className="mt-3 p-3 rounded-lg bg-gradient-to-br from-muted/40 to-muted/20 border border-border/30">
								<div className="flex items-center gap-2 text-sm mb-2">
									<Clock className="size-4 text-emerald-600 dark:text-emerald-400" />
									<span className="font-medium">{t("projectInfo")}</span>
								</div>
								<div className="relative h-3 rounded-full bg-muted overflow-hidden mt-2">
									{project.startDate && project.endDate ? (
										<div
											className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500"
											style={{
												width: `${Math.min(100, Math.max(0, ((new Date().getTime() - new Date(project.startDate).getTime()) / (new Date(project.endDate).getTime() - new Date(project.startDate).getTime())) * 100))}%`,
											}}
										/>
									) : (
										<div className="absolute inset-y-0 start-0 w-full rounded-full bg-emerald-300/50" />
									)}
								</div>
								<div className="flex justify-between text-xs text-muted-foreground mt-1.5">
									<span>
										{project.startDate
											? new Date(project.startDate).toLocaleDateString()
											: t("present")}
									</span>
									<span>
										{project.endDate
											? new Date(project.endDate).toLocaleDateString()
											: t("present")}
									</span>
								</div>
							</div>
						)}
						{!project.startDate &&
							!project.endDate &&
							project.startDate && (
								<div className="flex items-center gap-2 text-sm">
									<Clock className="size-4 text-muted-foreground" />
									<span>
										{new Date(project.startDate).toLocaleDateString()} -{" "}
										{project.endDate
											? new Date(project.endDate).toLocaleDateString()
											: t("present")}
									</span>
								</div>
							)}
					</CardContent>
				</Card>

				{/* Key Metrics */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							{t("keyMetrics")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2">
								<Shield className="size-4 text-muted-foreground" />
								{t("linkedLicenses")}
							</span>
							<span className="font-bold">{projectLicenses.length}</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-2">
								<Users className="size-4 text-muted-foreground" />
								{t("linkedSubs")}
							</span>
							<span className="font-bold">{projectSubs.length}</span>
						</div>
						{project.insuranceRequired > 0 && (
							<div className="flex items-center justify-between text-sm">
								<span className="flex items-center gap-2">
									<ShieldCheck className="size-4 text-muted-foreground" />
									{t("insuranceRequired")}
								</span>
								<span className="font-bold">
									${project.insuranceRequired.toLocaleString()}
								</span>
							</div>
						)}
						{project.bondRequired && (
							<div className="flex items-center justify-between text-sm">
								<span className="flex items-center gap-2">
									<FileText className="size-4 text-muted-foreground" />
									{t("bondAmount")}
								</span>
								<span className="font-bold">
									${project.bondAmount.toLocaleString()}
								</span>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{project.notes && (
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							{tc("notes")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm">{project.notes}</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
