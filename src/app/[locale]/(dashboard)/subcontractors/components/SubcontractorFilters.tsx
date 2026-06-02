import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusCounts } from "../types";

interface FilterTab {
  value: string;
  label: string;
  count: number;
  dot?: string;
}

export default function SubcontractorFilters({
  counts,
  complianceFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: {
  counts: StatusCounts;
  complianceFilter: string;
  onFilterChange: (value: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}) {
  const t = useTranslations("subcontractors");

  const filterTabs: FilterTab[] = [
    { value: "all", label: t("allStatus"), count: counts.total },
    { value: "compliant", label: t("compliant"), count: counts.compliant, dot: "bg-emerald-500" },
    { value: "pending", label: t("pendingReview"), count: 0, dot: "bg-amber-500" },
    { value: "non_compliant", label: t("nonCompliant"), count: counts.non_compliant, dot: "bg-red-500" },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex gap-1 overflow-x-auto">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onFilterChange(tab.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
              complianceFilter === tab.value
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {tab.dot && <span className={cn("size-1.5 rounded-full", tab.dot)} />}
            {tab.label}
            <span className="tabular-nums text-slate-400">{tab.count}</span>
          </button>
        ))}
      </div>
      <div className="relative flex-1 max-w-sm ms-auto">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="ps-9"
        />
      </div>
    </div>
  );
}
