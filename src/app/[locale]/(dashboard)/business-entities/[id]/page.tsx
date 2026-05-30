"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import {
	Building2,
	ArrowLeft,
	Shield,
	FileText,
	DollarSign,
	UserCheck,
	AlertTriangle,
	CheckCircle2,
	XCircle,
	Info,
	Trash2,
	Link2,
	Unlink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Link from "next/link";

interface EntityData {
	id: string;
	name: string;
	entityType: string;
	formationState: string | null;
	formationDate: string | null;
	ein: string | null;
	registeredAgent: string | null;
	registeredAgentState: string | null;
	entityStatus: string;
	annualReportDue: string | null;
	annualReportFiled: string | null;
	franchiseTaxDue: string | null;
	franchiseTaxPaid: string | null;
	complianceScore: number;
	notes: string | null;
	parentId: string | null;
	parent: { id: string; name: string; entityType: string } | null;
	subsidiaries: {
		id: string;
		name: string;
		entityType: string;
		entityStatus: string;
		complianceScore: number;
	}[];
	licenses: {
		id: string;
		role: string;
		license: {
			id: string;
			name: string;
			type: string;
			licenseNumber: string;
			state: string | null;
			expirationDate: string;
		};
	}[];
}

interface ComplianceCheck {
	category: string;
	status: "compliant" | "warning" | "critical" | "info";
	label: string;
	detail: string;
}

const STATUS_ICON = {
	compliant: CheckCircle2,
	warning: AlertTriangle,
	critical: XCircle,
	info: Info,
};

const STATUS_COLOR = {
	compliant: "text-emerald-600 dark:text-emerald-400",
	warning: "text-amber-600 dark:text-amber-400",
	critical: "text-red-600 dark:text-red-400",
	info: "text-sky-600 dark:text-sky-400",
};

const STATUS_BG = {
	compliant: "bg-emerald-50 dark:bg-emerald-950/20",
	warning: "bg-amber-50 dark:bg-amber-950/20",
	critical: "bg-red-50 dark:bg-red-950/20",
	info: "bg-sky-50 dark:bg-sky-950/20",
};

export default function BusinessEntityDetailPage() {
	const t = useTranslations("businessEntities");
	const tc = useTranslations("common");
	const params = useParams();
	const router = useRouter();
	const entityId = params.id as string;

	const [entity, setEntity] = useState<EntityData | null>(null);
	const [compliance, setCompliance] = useState<{
		checks: ComplianceCheck[];
		calculatedScore: number;
		overallStatus: string;
	} | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!entityId) return;
		Promise.all([
			fetch(`/api/business-entities/${entityId}`).then((r) => r.json()),
			fetch(`/api/business-entities/${entityId}/compliance`).then((r) =>
				r.json(),
			),
		])
			.then(([entityData, complianceData]) => {
				if (entityData.entity) setEntity(entityData.entity);
				if (complianceData.checks) setCompliance(complianceData);
			})
			.catch(() => toast.error(t("error")))
			.finally(() => setLoading(false));
	}, [entityId, t]);

	const handleDelete = async () => {
		if (!entity) return;
		try {
			const res = await fetch(`/api/business-entities/${entity.id}`, {
				method: "DELETE",
			});
			if (res.ok) {
				toast.success(t("deleteSuccess"));
				router.push("/business-entities");
			}
		} catch {
			toast.error(t("error"));
		}
	};

	if (loading) {
		return (
			<div className="space-y-4">
				{[1, 2, 3].map((i) => (
					<Card key={i} className="animate-pulse">
						<CardContent className="p-6">
							<div className="h-24 bg-muted rounded" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (!entity) {
		return (
			<div className="text-center py-12">
				<Building2 className="size-12 mx-auto text-muted-foreground/40 mb-3" />
				<p className="text-muted-foreground">Entity not found</p>
			</div>
		);
	}

	const fadeIn = {
		initial: { opacity: 0, y: 10 },
		animate: { opacity: 1, y: 0 },
		transition: { duration: 0.3 },
	};

	const scoreColor =
		entity.complianceScore >= 80
			? "text-emerald-500"
			: entity.complianceScore >= 60
				? "text-amber-500"
				: "text-red-500";
	const radius = 50;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (entity.complianceScore / 100) * circumference;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Link href="/business-entities">
					<Button variant="ghost" size="icon" className="size-8">
						<ArrowLeft className="size-4" />
					</Button>
				</Link>
				<div className="flex-1">
					<h1 className="text-2xl font-bold">{entity.name}</h1>
					<div className="flex items-center gap-2 mt-1">
						<Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs border-0">
							{t(entity.entityType as any)}
						</Badge>
						<Badge
							className={`${entity.entityStatus === "active" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"} text-xs border-0`}
						>
							{t(entity.entityStatus as any)}
						</Badge>
					</div>
				</div>
				<Button variant="destructive" size="sm" onClick={handleDelete}>
					<Trash2 className="size-4 me-2" />
					{tc("delete")}
				</Button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left: Entity Info + Compliance */}
				<div className="lg:col-span-2 space-y-6">
					{/* Entity Info Card */}
					<motion.div {...fadeIn}>
						<Card className="shadow-sm">
							<CardHeader className="pb-3">
								<CardTitle className="text-base flex items-center gap-2">
									<Building2 className="size-4 text-emerald-600" />
									{t("entityInfo")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{[
										{
											label: t("entityType"),
											value: t(entity.entityType as any),
										},
										{
											label: t("formationState"),
											value: entity.formationState || "N/A",
										},
										{
											label: t("formationDate"),
											value: entity.formationDate
												? new Date(entity.formationDate).toLocaleDateString()
												: "N/A",
										},
										{ label: t("ein"), value: entity.ein || "N/A" },
										{
											label: t("registeredAgent"),
											value: entity.registeredAgent || "N/A",
										},
										{
											label: t("registeredAgentState"),
											value: entity.registeredAgentState || "N/A",
										},
									].map((item, idx) => (
										<div key={idx}>
											<p className="text-xs text-muted-foreground uppercase tracking-wider">
												{item.label}
											</p>
											<p className="text-sm font-medium mt-0.5">{item.value}</p>
										</div>
									))}
								</div>
								{entity.notes && (
									<>
										<Separator className="my-4" />
										<div>
											<p className="text-xs text-muted-foreground uppercase tracking-wider">
												{t("notes")}
											</p>
											<p className="text-sm mt-0.5">{entity.notes}</p>
										</div>
									</>
								)}
							</CardContent>
						</Card>
					</motion.div>

					{/* Compliance Breakdown */}
					{compliance && (
						<motion.div {...fadeIn} transition={{ delay: 0.1 }}>
							<Card className="shadow-sm">
								<CardHeader className="pb-3">
									<CardTitle className="text-base flex items-center gap-2">
										<Shield className="size-4 text-emerald-600" />
										{t("complianceBreakdown")}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										{compliance.checks.map((check, idx) => {
											const Icon = STATUS_ICON[check.status];
											return (
												<div
													key={idx}
													className={`flex items-start gap-3 p-3 rounded-lg ${STATUS_BG[check.status]}`}
												>
													<Icon
														className={`size-5 shrink-0 mt-0.5 ${STATUS_COLOR[check.status]}`}
													/>
													<div>
														<p className="text-sm font-medium">{check.label}</p>
														<p className="text-xs text-muted-foreground mt-0.5">
															{check.detail}
														</p>
													</div>
												</div>
											);
										})}
									</div>
								</CardContent>
							</Card>
						</motion.div>
					)}

					{/* Linked Licenses */}
					<motion.div {...fadeIn} transition={{ delay: 0.2 }}>
						<Card className="shadow-sm">
							<CardHeader className="pb-3">
								<CardTitle className="text-base flex items-center gap-2">
									<FileText className="size-4 text-emerald-600" />
									{t("linkedLicenses")} ({entity.licenses.length})
								</CardTitle>
							</CardHeader>
							<CardContent>
								{entity.licenses.length === 0 ? (
									<p className="text-sm text-muted-foreground text-center py-4">
										No licenses linked to this entity
									</p>
								) : (
									<div className="space-y-2">
										{entity.licenses.map((link) => (
											<div
												key={link.id}
												className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
											>
												<div className="min-w-0 flex-1">
													<Link
														href={`/licenses/${link.license.id}`}
														className="text-sm font-medium hover:text-emerald-600 transition-colors"
													>
														{link.license.name}
													</Link>
													<p className="text-xs text-muted-foreground">
														{link.license.type} • {link.license.licenseNumber}
														{link.license.state && ` • ${link.license.state}`}
													</p>
												</div>
												<Badge
													variant="outline"
													className="text-[10px] capitalize"
												>
													{link.role}
												</Badge>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</motion.div>
				</div>

				{/* Right: Score + Dates + Hierarchy */}
				<div className="space-y-6">
					{/* Compliance Score */}
					<motion.div {...fadeIn} transition={{ delay: 0.1 }}>
						<Card className="shadow-sm">
							<CardContent className="p-6 flex flex-col items-center">
								<div className="relative size-28">
									<svg className="size-28 -rotate-90" viewBox="0 0 120 120">
										<circle
											cx="60"
											cy="60"
											r={radius}
											fill="none"
											stroke="currentColor"
											strokeWidth="8"
											className="text-muted/20"
										/>
										<circle
											cx="60"
											cy="60"
											r={radius}
											fill="none"
											strokeWidth="8"
											strokeLinecap="round"
											strokeDasharray={circumference}
											strokeDashoffset={offset}
											className={scoreColor}
										/>
									</svg>
									<div className="absolute inset-0 flex flex-col items-center justify-center">
										<span className={`text-2xl font-extrabold ${scoreColor}`}>
											{entity.complianceScore}
										</span>
										<span className="text-[10px] text-muted-foreground">
											{t("complianceScore")}
										</span>
									</div>
								</div>
								{compliance && (
									<Badge
										className={`mt-3 ${
											compliance.overallStatus === "compliant"
												? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
												: compliance.overallStatus === "warning"
													? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
													: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
										} border-0`}
									>
										{t(compliance.overallStatus as any)}
									</Badge>
								)}
							</CardContent>
						</Card>
					</motion.div>

					{/* Annual Report & Franchise Tax */}
					<motion.div {...fadeIn} transition={{ delay: 0.15 }}>
						<Card className="shadow-sm">
							<CardHeader className="pb-3">
								<CardTitle className="text-base flex items-center gap-2">
									<FileText className="size-4 text-emerald-600" />
									{t("annualReport")} & {t("franchiseTax")}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											{t("annualReport")}
										</span>
										{entity.annualReportFiled ? (
											<Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] border-0">
												{t("filed")}
											</Badge>
										) : entity.annualReportDue &&
											new Date(entity.annualReportDue) < new Date() ? (
											<Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-[10px] border-0">
												{t("overdue")}
											</Badge>
										) : (
											<Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] border-0">
												{t("pending")}
											</Badge>
										)}
									</div>
									{entity.annualReportDue && (
										<p className="text-xs text-muted-foreground">
											Due:{" "}
											{new Date(entity.annualReportDue).toLocaleDateString()}
										</p>
									)}
									{entity.annualReportFiled && (
										<p className="text-xs text-emerald-600 dark:text-emerald-400">
											Filed:{" "}
											{new Date(entity.annualReportFiled).toLocaleDateString()}
										</p>
									)}
								</div>
								<Separator />
								<div className="space-y-2">
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											{t("franchiseTax")}
										</span>
										{entity.franchiseTaxPaid ? (
											<Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] border-0">
												{t("paid")}
											</Badge>
										) : entity.franchiseTaxDue &&
											new Date(entity.franchiseTaxDue) < new Date() ? (
											<Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-[10px] border-0">
												{t("overdue")}
											</Badge>
										) : (
											<Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] border-0">
												{t("pending")}
											</Badge>
										)}
									</div>
									{entity.franchiseTaxDue && (
										<p className="text-xs text-muted-foreground">
											Due:{" "}
											{new Date(entity.franchiseTaxDue).toLocaleDateString()}
										</p>
									)}
									{entity.franchiseTaxPaid && (
										<p className="text-xs text-emerald-600 dark:text-emerald-400">
											Paid:{" "}
											{new Date(entity.franchiseTaxPaid).toLocaleDateString()}
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					</motion.div>

					{/* Entity Hierarchy */}
					<motion.div {...fadeIn} transition={{ delay: 0.2 }}>
						<Card className="shadow-sm">
							<CardHeader className="pb-3">
								<CardTitle className="text-base flex items-center gap-2">
									<Building2 className="size-4 text-emerald-600" />
									{t("entityHierarchy")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								{entity.parent && (
									<div className="mb-3">
										<p className="text-xs text-muted-foreground mb-1">
											{t("parentEntity")}
										</p>
										<Link
											href={`/business-entities/${entity.parent.id}`}
											className="text-sm font-medium hover:text-emerald-600 transition-colors"
										>
											{entity.parent.name}
										</Link>
									</div>
								)}
								{entity.subsidiaries.length > 0 && (
									<div>
										<p className="text-xs text-muted-foreground mb-1">
											{t("subsidiaries")}
										</p>
										<div className="space-y-1">
											{entity.subsidiaries.map((sub) => (
												<Link
													key={sub.id}
													href={`/business-entities/${sub.id}`}
													className="flex items-center gap-2 text-sm hover:text-emerald-600 transition-colors"
												>
													<Building2 className="size-3 text-muted-foreground" />
													{sub.name}
													<Badge
														variant="outline"
														className="text-[9px] py-0 capitalize"
													>
														{sub.entityStatus}
													</Badge>
												</Link>
											))}
										</div>
									</div>
								)}
								{!entity.parent && entity.subsidiaries.length === 0 && (
									<p className="text-sm text-muted-foreground text-center py-2">
										No hierarchy
									</p>
								)}
							</CardContent>
						</Card>
					</motion.div>
				</div>
			</div>
		</div>
	);
}
