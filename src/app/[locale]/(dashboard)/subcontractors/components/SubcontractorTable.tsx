"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Pencil, Trash2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Subcontractor } from "../types";
import StatusDot from "../StatusDot";
import ComplianceBadge from "../ComplianceBadge";

export default function SubcontractorTable({
  subs,
  selectedIds,
  canManage,
  requestingDocs,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onRequestDocs,
  onEdit,
  onDelete,
}: {
  subs: Subcontractor[];
  selectedIds: Set<string>;
  canManage: boolean;
  requestingDocs: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onView: (sub: Subcontractor) => void;
  onRequestDocs: (sub: Subcontractor) => void;
  onEdit: (sub: Subcontractor) => void;
  onDelete: (sub: Subcontractor) => void;
}) {
  const t = useTranslations("subcontractors");
  const tc = useTranslations("common");

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === subs.length && subs.length > 0}
                    onChange={onToggleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="text-start p-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                  {t("companyName")}
                </th>
                <th className="text-start p-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                  {t("contactName")}
                </th>
                <th className="text-start p-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                  {t("licenseNumber")}
                </th>
                <th className="text-start p-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                  {t("licenseExpiry")}
                </th>
                <th className="text-start p-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                  {t("complianceStatus")}
                </th>
                <th className="text-end p-3 font-medium text-slate-500 text-xs uppercase tracking-wider w-40">
                  {tc("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {subs.map((sub) => (
                <tr
                  key={sub.id}
                  className={cn(
                    "border-b border-slate-100 dark:border-slate-800 transition-colors",
                    selectedIds.has(sub.id)
                      ? "bg-emerald-50/50 dark:bg-emerald-950/10"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/50",
                  )}
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(sub.id)}
                      onChange={() => onToggleSelect(sub.id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <StatusDot status={sub.complianceStatus} />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {sub.companyName}
                        </p>
                        {sub.email && (
                          <p className="text-xs text-slate-500">{sub.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {sub.contactName || "—"}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 tabular-nums">
                    {sub.licenseNumber || "—"}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 tabular-nums">
                    {sub.licenseExpiry
                      ? new Date(sub.licenseExpiry).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-3">
                    <ComplianceBadge status={sub.complianceStatus} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => onView(sub)}
                      >
                        <Eye className="size-3.5" />
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => onRequestDocs(sub)}
                            disabled={requestingDocs}
                          >
                            <Send className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => onEdit(sub)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => onDelete(sub)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
