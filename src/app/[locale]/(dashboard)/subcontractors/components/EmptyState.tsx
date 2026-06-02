import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, HardHat } from "lucide-react";
import { useTranslations } from "next-intl";

export default function EmptyState({ canManage, onAdd }: { canManage: boolean; onAdd: () => void }) {
  const t = useTranslations("subcontractors");

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-4 mb-3">
        <HardHat className="size-8 text-slate-400" />
      </div>
      <p className="font-medium text-slate-700 dark:text-slate-300">
        {t("noSubcontractors")}
      </p>
      <p className="text-sm text-slate-500 mt-1 max-w-xs">
        {t("noSubcontractorsDesc")}
      </p>
      {canManage && (
        <Button
          size="sm"
          className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={onAdd}
        >
          <Plus className="size-4 me-1" />
          {t("addSubcontractor")}
        </Button>
      )}
    </div>
  );
}
