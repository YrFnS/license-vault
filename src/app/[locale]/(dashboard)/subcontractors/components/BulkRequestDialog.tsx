"use client";

import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Send } from "lucide-react";
import type { Subcontractor } from "../types";

export default function BulkRequestDialog({
  open,
  onOpenChange,
  bulkRequesting,
  subs,
  onBulkRequest,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bulkRequesting: boolean;
  subs: Subcontractor[];
  onBulkRequest: () => void;
}) {
  const t = useTranslations("subcontractors");
  const tc = useTranslations("common");

  const targetCount = subs.filter(
    (s) => s.complianceStatus === "non_compliant" || s.complianceStatus === "pending",
  ).length;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("requestCOIs")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("bulkRequestConfirm", { count: targetCount })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onBulkRequest}
            disabled={bulkRequesting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {bulkRequesting ? (
              <Loader2 className="size-4 animate-spin me-1" />
            ) : (
              <Send className="size-4 me-1" />
            )}
            {t("requestCOIs")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
