"use client";

import {
	Shield,
	CheckCircle2,
	XCircle,
	Clock,
	Link2,
	Unlink,
	Trash2,
	Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComplianceScoreCircle } from "./ComplianceScoreCircle";
import { StatusBadge } from "./StatusBadge";
import type { Project, ProjectLicense, ProjectSub } from "./types";

function formatDate(dateStr: string | null) {
	if (!dateStr) return "—";
	try {
		return new Date(dateStr).toLocaleDateString();
	} catch {
		return dateStr;
	}
}

function getLicenseStatus(expirationDate: string) {
	const now = new Date();
	const exp = new Date(expirationDate);
	const thirtyDays = new Date();
	thirtyDays.setDate(thirtyDays.getDate() + 30);
	if (exp <= now) return "expired";
	if (exp <= thirtyDays) return "expiring_soon";
	return "active";
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedProject: Project | null;
	projectLicenses: ProjectLicense[];
	projectSubs: ProjectSub[];
	detailTab: string;
	onDetailTabChange: (tab: string) => void;
	onUnlinkLicense: (licenseId: string) => void;
	onUnlinkSubcontractor: (subcontractorId: string) => void;
	onEdit: () => void;
	onDelete: () => void;
	onOpenLinkLicenseDialog: () => void;
	onOpenLinkSubDialog: () => void;
	t: (key: string) => string;
}

export function ProjectDetailDialog({
	open,
	onOpenChange,
	selectedProject,
	projectLicenses,
	projectSubs,
	detailTab,
	onDetailTabChange,
	onUnlinkLicense,
	onUnlinkSubcontractor,
	onEdit,
	onDelete,
	onOpenLinkLicenseDialog,
	onOpenLinkSubDialog,
	t,
}: Props) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-3">
						{selectedProject?.name}
						{selectedProject && (
							<StatusBadge status={selectedProject.status} t={t} />
						)}
					</DialogTitle>
					<DialogDescription className="sr-only">
						{t("projectDetails")}
					</DialogDescription>
				</DialogHeader>

				<Tabs
					value={detailTab}
					onValueChange={onDetailTabChange}
					className="flex-1 overflow-hidden"
				>
					<TabsList className="w-full justify-start">
						<TabsTrigger value="overview">{t("overview")}</TabsTrigger>
						<TabsTrigger value="licenses">
							{t("licenses")} ({projectLicenses.length})
						</TabsTrigger>
						<TabsTrigger value="subcontractors">
							{t("subcontractors")} ({projectSubs.length})
						</TabsTrigger>
					</TabsList>

					{/* Overview Tab */}
					<TabsContent
						value="overview"
						className="overflow-y-auto max-h-[60vh] mt-4"
					>
						{selectedProject && (
							<div className="space-y-4">
								<div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
									<ComplianceScoreCircle
										score={selectedProject.complianceScore || 0}
										size={72}
									/>
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											{t("complianceScore")}
										</p>
										<span
											className={cn(
												"text-xs font-medium",
												(selectedProject.complianceScore || 0) >= 80
													? "text-emerald-600 dark:text-emerald-400"
													: (selectedProject.complianceScore || 0) >= 60
														? "text-amber-600 dark:text-amber-400"
														: "text-red-600 dark:text-red-400",
											)}
										>
											{(selectedProject.complianceScore || 0) >= 80
												? t("highCompliance")
												: (selectedProject.complianceScore || 0) >= 60
													? t("mediumCompliance")
													: t("lowCompliance")}
										</span>
										<p className="text-xs text-muted-foreground mt-1">
											Based on {projectLicenses.length} linked license
											{projectLicenses.length !== 1 ? "s" : ""}
										</p>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									{selectedProject.clientName && (
										<div className="space-y-1">
											<p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
												{t("clientName")}
											</p>
											<p className="text-sm font-medium">
												{selectedProject.clientName}
											</p>
										</div>
									)}
									{selectedProject.clientEmail && (
										<div className="space-y-1">
											<p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
												{t("clientEmail")}
											</p>
											<p className="text-sm font-medium">
												{selectedProject.clientEmail}
											</p>
										</div>
									)}
									{selectedProject.location && (
										<div className="space-y-1">
											<p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
												{t("location")}
											</p>
											<p className="text-sm font-medium">
												{selectedProject.location}
											</p>
										</div>
									)}
									{selectedProject.state && (
										<div className="space-y-1">
											<p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
												{t("state")}
											</p>
											<p className="text-sm font-medium">
												{selectedProject.state}
											</p>
										</div>
									)}
									{selectedProject.startDate && (
										<div className="space-y-1">
											<p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
												{t("startDate")}
											</p>
											<p className="text-sm font-medium">
												{formatDate(selectedProject.startDate)}
											</p>
										</div>
									)}
									{selectedProject.endDate && (
										<div className="space-y-1">
											<p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
												{t("endDate")}
											</p>
											<p className="text-sm font-medium">
												{formatDate(selectedProject.endDate)}
											</p>
										</div>
									)}
								</div>

								{selectedProject.description && (
									<div className="space-y-1">
										<p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
											{t("description_field")}
										</p>
										<p className="text-sm">{selectedProject.description}</p>
									</div>
								)}

								{selectedProject.requiredLicenses && (
									<div className="space-y-1">
										<p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
											{t("requiredLicenses")}
										</p>
										<p className="text-sm whitespace-pre-wrap">
											{selectedProject.requiredLicenses}
										</p>
									</div>
								)}

								{selectedProject.requiredInsurance && (
									<div className="space-y-1">
										<p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
											{t("requiredInsurance")}
										</p>
										<p className="text-sm whitespace-pre-wrap">
											{selectedProject.requiredInsurance}
										</p>
									</div>
								)}

								<Separator />
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={(e) => {
											e.stopPropagation();
											onEdit();
										}}
									>
										{t("editProject")}
									</Button>
									<Button
										variant="outline"
										size="sm"
										className="text-destructive hover:bg-destructive/10 hover:text-destructive"
										onClick={(e) => {
											e.stopPropagation();
											onDelete();
										}}
									>
										<Trash2 className="size-3.5 me-1" />
										{t("deleteProject")}
									</Button>
								</div>
							</div>
						)}
					</TabsContent>

					{/* Licenses Tab */}
					<TabsContent
						value="licenses"
						className="overflow-y-auto max-h-[60vh] mt-4"
					>
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<p className="text-sm font-medium">{t("linkedLicenses")}</p>
								<Button
									size="sm"
									variant="outline"
									onClick={onOpenLinkLicenseDialog}
									className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
								>
									<Link2 className="size-3.5 me-1" />
									{t("linkLicense")}
								</Button>
							</div>

							{projectLicenses.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									<Shield className="size-8 mx-auto mb-2 opacity-40" />
									<p className="text-sm">No licenses linked yet</p>
								</div>
							) : (
								<div className="space-y-2">
									{projectLicenses.map((pl) => {
										const licStatus = getLicenseStatus(
											pl.license.expirationDate,
										);
										return (
											<div
												key={pl.id}
												className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
											>
												<div className="flex items-center gap-3 min-w-0">
													<div
														className={cn(
															"size-8 rounded-lg flex items-center justify-center shrink-0",
															licStatus === "active"
																? "bg-emerald-100 dark:bg-emerald-950/30"
																: licStatus === "expiring_soon"
																	? "bg-amber-100 dark:bg-amber-950/30"
																	: "bg-red-100 dark:bg-red-950/30",
														)}
													>
														{licStatus === "active" ? (
															<CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
														) : licStatus === "expiring_soon" ? (
															<Clock className="size-4 text-amber-600 dark:text-amber-400" />
														) : (
															<XCircle className="size-4 text-red-600 dark:text-red-400" />
														)}
													</div>
													<div className="min-w-0">
														<p className="text-sm font-medium truncate">
															{pl.license.name}
														</p>
														<p className="text-xs text-muted-foreground">
															{pl.license.licenseNumber} · Exp:{" "}
															{formatDate(pl.license.expirationDate)}
															{pl.required && (
																<span className="ms-2 text-amber-600 dark:text-amber-400">
																	({t("required")})
																</span>
															)}
														</p>
													</div>
												</div>
												<Button
													variant="ghost"
													size="icon"
													className="size-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
													onClick={() => onUnlinkLicense(pl.licenseId)}
												>
													<Unlink className="size-3.5" />
												</Button>
											</div>
										);
									})}
								</div>
							)}
						</div>
					</TabsContent>

					{/* Subcontractors Tab */}
					<TabsContent
						value="subcontractors"
						className="overflow-y-auto max-h-[60vh] mt-4"
					>
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<p className="text-sm font-medium">
									{t("linkedSubcontractors")}
								</p>
								<Button
									size="sm"
									variant="outline"
									onClick={onOpenLinkSubDialog}
									className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
								>
									<Link2 className="size-3.5 me-1" />
									{t("linkSubcontractor")}
								</Button>
							</div>

							{projectSubs.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									<Users className="size-8 mx-auto mb-2 opacity-40" />
									<p className="text-sm">No subcontractors linked yet</p>
								</div>
							) : (
								<div className="space-y-2">
									{projectSubs.map((ps) => (
										<div
											key={ps.id}
											className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
										>
											<div className="flex items-center gap-3 min-w-0">
												<div
													className={cn(
														"size-8 rounded-lg flex items-center justify-center shrink-0",
														ps.complianceStatus === "compliant"
															? "bg-emerald-100 dark:bg-emerald-950/30"
															: ps.complianceStatus === "pending"
																? "bg-amber-100 dark:bg-amber-950/30"
																: "bg-red-100 dark:bg-red-950/30",
													)}
												>
													{ps.complianceStatus === "compliant" ? (
														<CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
													) : ps.complianceStatus === "pending" ? (
														<Clock className="size-4 text-amber-600 dark:text-amber-400" />
													) : (
														<XCircle className="size-4 text-red-600 dark:text-red-400" />
													)}
												</div>
												<div className="min-w-0">
													<p className="text-sm font-medium truncate">
														{ps.subcontractor.companyName}
													</p>
													<p className="text-xs text-muted-foreground">
														{ps.role || "Subcontractor"} ·{" "}
														{ps.complianceStatus === "compliant"
															? t("compliant")
															: ps.complianceStatus === "pending"
																? t("pending")
																: t("nonCompliant")}
													</p>
												</div>
											</div>
											<Button
												variant="ghost"
												size="icon"
												className="size-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
												onClick={() =>
													onUnlinkSubcontractor(ps.subcontractorId)
												}
											>
												<Unlink className="size-3.5" />
											</Button>
										</div>
									))}
								</div>
							)}
						</div>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
