import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { HardHat, Users, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusCounts } from "../types";

const BORDER_COLORS = [
  "border-l-slate-400",
  "border-l-emerald-500",
  "border-l-emerald-500",
  "border-l-red-500",
] as const;

export default function SubcontractorStats({ counts }: { counts: StatusCounts }) {
  const t = useTranslations("subcontractors");
  const items = [
    { label: t("totalSubcontractors"), value: counts.total, icon: HardHat },
    { label: t("activeCount"), value: counts.active, icon: Users },
    { label: t("compliantCount"), value: counts.compliant, icon: ShieldCheck },
    { label: t("nonCompliantCount"), value: counts.non_compliant, icon: AlertTriangle },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(({ label, value, icon: Icon }, i) => (
        <Card key={label} className={cn("border-l-2", BORDER_COLORS[i])}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2">
              <Icon className="size-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
