"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

export default function BulkActionBar({
  selectedCount,
  bulkRequesting,
  onBulkRequest,
  onCancel,
}: {
  selectedCount: number;
  bulkRequesting: boolean;
  onBulkRequest: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("subcontractors");
  const tc = useTranslations("common");

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 py-3">
      <div className="mx-auto max-w-6xl flex items-center justify-between">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          <span className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
            {selectedCount}
          </span>{" "}
          selected
        </span>
        <div className="flex gap-2">
          <Button size="sm" onClick={onBulkRequest} disabled={bulkRequesting}>
            {bulkRequesting ? (
              <Loader2 className="size-3.5 animate-spin me-1" />
            ) : (
              <Send className="size-3.5 me-1" />
            )}
            {t("requestDocs")}
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {tc("cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
