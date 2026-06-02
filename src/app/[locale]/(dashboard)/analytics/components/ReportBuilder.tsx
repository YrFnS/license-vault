"use client";

import { useState } from "react";
import {
	Plus,
	X,
	Mail,
	Clock,
	Download,
	FileBarChart,
	Users,
	ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { US_STATES } from "./constants";
import type { ScheduleConfig } from "./types";

interface Props {
	reportType: string;
	onReportTypeChange: (v: string) => void;
	dateRange: string;
	onDateRangeChange: (v: string) => void;
	stateFilter: string;
	onStateChange: (v: string) => void;
	licenseTypeFilter: string;
	onLicenseTypeChange: (v: string) => void;
	reportFormat: string;
	onFormatChange: (v: string) => void;
	generating: boolean;
	scheduleConfig: ScheduleConfig;
	onScheduleConfigChange: (c: ScheduleConfig) => void;
	newRecipient: string;
	onNewRecipientChange: (v: string) => void;
	savingSchedule: boolean;
	onGenerateReport: () => void;
	onSaveSchedule: () => void;
	onAddRecipient: () => void;
	onRemoveRecipient: (idx: number) => void;
	t: (key: string) => string;
}

export function ReportBuilder({
	reportType,
	onReportTypeChange,
	dateRange,
	onDateRangeChange,
	stateFilter,
	onStateChange,
	licenseTypeFilter,
	onLicenseTypeChange,
	reportFormat,
	onFormatChange,
	generating,
	scheduleConfig,
	onScheduleConfigChange,
	newRecipient,
	onNewRecipientChange,
	savingSchedule,
	onGenerateReport,
	onSaveSchedule,
	onAddRecipient,
	onRemoveRecipient,
	t,
}: Props) {
	return (
		<Card className="shadow-sm hover:shadow-md transition-shadow">
			<CardHeader>
				<CardTitle className="text-lg">{t("reports.title")}</CardTitle>
				<CardDescription>{t("reports.description")}</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<div className="space-y-2">
						<label className="text-sm font-medium">
							{t("reports.reportType")}
						</label>
						<Select value={reportType} onValueChange={onReportTypeChange}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="complianceSummary">
									{t("reports.complianceSummary")}
								</SelectItem>
								<SelectItem value="licenseStatus">
									{t("reports.licenseStatus")}
								</SelectItem>
								<SelectItem value="insuranceStatus">
									{t("reports.insuranceStatus")}
								</SelectItem>
								<SelectItem value="ceTracking">
									{t("reports.ceTracking")}
								</SelectItem>
								<SelectItem value="fullAudit">
									{t("reports.fullAudit")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">
							{t("reports.dateRange")}
						</label>
						<Select value={dateRange} onValueChange={onDateRangeChange}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="last7">{t("reports.last7days")}</SelectItem>
								<SelectItem value="last30">
									{t("reports.last30days")}
								</SelectItem>
								<SelectItem value="last90">
									{t("reports.last90days")}
								</SelectItem>
								<SelectItem value="lastYear">
									{t("reports.lastYear")}
								</SelectItem>
								<SelectItem value="all">{t("reports.allTime")}</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">
							{t("reports.stateFilter")}
						</label>
						<Select value={stateFilter} onValueChange={onStateChange}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("reports.allStates")}</SelectItem>
								{US_STATES.slice(0, 20).map((s) => (
									<SelectItem key={s} value={s}>
										{s}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">
							{t("reports.licenseTypeFilter")}
						</label>
						<Select
							value={licenseTypeFilter}
							onValueChange={onLicenseTypeChange}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("reports.allTypes")}</SelectItem>
								<SelectItem value="state">
									{t("reports.typeStateLicense")}
								</SelectItem>
								<SelectItem value="city">
									{t("reports.typeCityPermit")}
								</SelectItem>
								<SelectItem value="certification">
									{t("reports.typeCertification")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">{t("reports.format")}</label>
						<Select value={reportFormat} onValueChange={onFormatChange}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="pdf">{t("reports.pdf")}</SelectItem>
								<SelectItem value="csv">{t("reports.csv")}</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-end">
						<Button
							className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm"
							onClick={onGenerateReport}
							disabled={generating}
						>
							<FileBarChart className="size-4" />
							{generating ? t("reports.generating") : t("reports.generate")}
						</Button>
					</div>
				</div>

				<Separator className="my-6" />

				{/* Schedule Reports */}
				<div>
					<h4 className="text-sm font-semibold mb-4 text-muted-foreground flex items-center gap-2">
						<Clock className="size-4" />
						Schedule Reports
					</h4>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
						<div className="space-y-2">
							<label className="text-xs font-medium">Frequency</label>
							<Select
								value={scheduleConfig.frequency}
								onValueChange={(v) =>
									onScheduleConfigChange({ ...scheduleConfig, frequency: v })
								}
							>
								<SelectTrigger className="w-full h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="weekly">Weekly</SelectItem>
									<SelectItem value="monthly">Monthly</SelectItem>
									<SelectItem value="quarterly">Quarterly</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<label className="text-xs font-medium">Report Type</label>
							<Select
								value={scheduleConfig.reportType}
								onValueChange={(v) =>
									onScheduleConfigChange({ ...scheduleConfig, reportType: v })
								}
							>
								<SelectTrigger className="w-full h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="compliance">Compliance Summary</SelectItem>
									<SelectItem value="full">Full Audit</SelectItem>
									<SelectItem value="licenses">License Status</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<label className="text-xs font-medium">Format</label>
							<Select
								value={scheduleConfig.format}
								onValueChange={(v) =>
									onScheduleConfigChange({ ...scheduleConfig, format: v })
								}
							>
								<SelectTrigger className="w-full h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="pdf">PDF</SelectItem>
									<SelectItem value="csv">CSV</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="space-y-2 mb-4">
						<label className="text-xs font-medium">Recipients</label>
						<div className="flex gap-2">
							<Input
								placeholder="email@example.com"
								value={newRecipient}
								onChange={(e) => onNewRecipientChange(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										onAddRecipient();
									}
								}}
								className="h-9 text-sm"
							/>
							<Button
								variant="outline"
								size="sm"
								onClick={onAddRecipient}
								className="gap-1 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300"
							>
								<Plus className="size-3.5" />
								Add
							</Button>
						</div>
						{scheduleConfig.recipients.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-2">
								{scheduleConfig.recipients.map((email, idx) => (
									<div
										key={idx}
										className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border/50 text-xs"
									>
										<Mail className="size-3 text-muted-foreground" />
										<span>{email}</span>
										<button
											onClick={() => onRemoveRecipient(idx)}
											className="text-muted-foreground hover:text-red-500 transition-colors"
										>
											<X className="size-3" />
										</button>
									</div>
								))}
							</div>
						)}
					</div>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Switch
								id="schedule-enabled"
								checked={scheduleConfig.enabled}
								onCheckedChange={(checked) =>
									onScheduleConfigChange({
										...scheduleConfig,
										enabled: checked,
									})
								}
							/>
							<Label htmlFor="schedule-enabled" className="text-xs">
								Enable scheduled reports
							</Label>
						</div>
						<Button
							size="sm"
							onClick={onSaveSchedule}
							disabled={savingSchedule}
							className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
						>
							{savingSchedule ? "Saving..." : "Save Schedule"}
						</Button>
					</div>
				</div>

				<Separator className="my-6" />

				<div>
					<h4 className="text-sm font-semibold mb-3 text-muted-foreground">
						{t("reports.previousReports")}
					</h4>
					<div className="text-center py-6 text-muted-foreground">
						<Download className="size-6 mx-auto mb-2" />
						<p className="text-sm">{t("reports.noReports")}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
