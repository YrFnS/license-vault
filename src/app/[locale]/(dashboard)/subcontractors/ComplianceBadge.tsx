import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ComplianceBadge({ status }: { status: string }) {
  const t = useTranslations("subcontractors");
  const map: Record<string, { label: string; cls: string }> = {
    compliant: {
      label: t("compliant"),
      cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    },
    pending: {
      label: t("pendingReview"),
      cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    },
    pending_review: {
      label: t("pendingReview"),
      cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    },
    non_compliant: {
      label: t("nonCompliant"),
      cls: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800",
    },
    unknown: {
      label: t("unknown"),
      cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    },
  };
  const c = map[status] || map.unknown;
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", c.cls)}>
      {c.label}
    </Badge>
  );
}
