"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	XCircle,
} from "lucide-react";

export function ProjectStatusBadge({ status }: { status: string }) {
	const t = useTranslations("projects");

	switch (status) {
		case "active":
			return (
				<Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
					{t("statusActive")}
				</Badge>
			);
		case "completed":
			return (
				<Badge className="bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400">
					{t("statusCompleted")}
				</Badge>
			);
		case "on_hold":
			return (
				<Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
					{t("statusOnHold")}
				</Badge>
			);
		default:
			return <Badge variant="secondary">{status}</Badge>;
	}
}

export function LicenseStatusBadge({ status }: { status: string }) {
	const t = useTranslations("projects");

	switch (status) {
		case "active":
			return (
				<Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
					<CheckCircle2 className="size-3 me-1" />
					{t("licenseActive")}
				</Badge>
			);
		case "expiring_soon":
			return (
				<Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
					<AlertTriangle className="size-3 me-1" />
					{t("licenseExpiring")}
				</Badge>
			);
		case "expired":
			return (
				<Badge className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400">
					<XCircle className="size-3 me-1" />
					{t("licenseExpired")}
				</Badge>
			);
		default:
			return <Badge variant="secondary">{status}</Badge>;
	}
}

export function SubStatusBadge({ status }: { status: string }) {
	const t = useTranslations("projects");

	switch (status) {
		case "compliant":
			return (
				<Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
					<CheckCircle2 className="size-3 me-1" />
					{t("subCompliant")}
				</Badge>
			);
		case "pending":
			return (
				<Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
					<Clock className="size-3 me-1" />
					{t("subPending")}
				</Badge>
			);
		case "non_compliant":
			return (
				<Badge className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400">
					<XCircle className="size-3 me-1" />
					{t("subNonCompliant")}
				</Badge>
			);
		default:
			return <Badge variant="secondary">{status}</Badge>;
	}
}
