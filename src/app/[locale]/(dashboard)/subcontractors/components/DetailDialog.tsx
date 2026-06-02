"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { HardHat, FileText, Copy, Pencil, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import type { Subcontractor } from "../types";
import ComplianceBadge from "../ComplianceBadge";

export default function DetailDialog({
  open,
  onOpenChange,
  detailSub,
  canManage,
  requestingDocs,
  onRequestDocs,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detailSub: Subcontractor | null;
  canManage: boolean;
  requestingDocs: boolean;
  onRequestDocs: (sub: Subcontractor) => void;
  onEdit: (sub: Subcontractor) => void;
}) {
  const t = useTranslations("subcontractors");
  const tc = useTranslations("common");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t("subcontractorDetails")}</DialogTitle>
        </DialogHeader>

        {detailSub ? (
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 pr-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2.5">
                  <HardHat className="size-5 text-slate-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{detailSub.companyName}</h3>
                  {detailSub.contactName && (
                    <p className="text-sm text-slate-500">{detailSub.contactName}</p>
                  )}
                </div>
                <ComplianceBadge status={detailSub.complianceStatus} />
              </div>

              {(detailSub.email || detailSub.phone) && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {detailSub.email && (
                    <div>
                      <span className="text-slate-500">Email:</span>
                      <p className="font-medium">{detailSub.email}</p>
                    </div>
                  )}
                  {detailSub.phone && (
                    <div>
                      <span className="text-slate-500">Phone:</span>
                      <p className="font-medium">{detailSub.phone}</p>
                    </div>
                  )}
                </div>
              )}

              {(detailSub.licenseNumber || detailSub.licenseState || detailSub.licenseExpiry) && (
                <>
                  <hr className="border-slate-200 dark:border-slate-700" />
                  <div className="text-sm space-y-1">
                    {detailSub.licenseNumber && (
                      <div>
                        <span className="text-slate-500">License #:</span>{" "}
                        <span className="font-medium">{detailSub.licenseNumber}</span>
                      </div>
                    )}
                    {detailSub.licenseState && (
                      <div>
                        <span className="text-slate-500">State:</span>{" "}
                        <span className="font-medium">{detailSub.licenseState}</span>
                      </div>
                    )}
                    {detailSub.licenseExpiry && (
                      <div>
                        <span className="text-slate-500">Expires:</span>{" "}
                        <span className="font-medium">
                          {new Date(detailSub.licenseExpiry).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {detailSub.notes && (
                <>
                  <hr className="border-slate-200 dark:border-slate-700" />
                  <div>
                    <span className="text-sm text-slate-500">Notes:</span>
                    <p className="text-sm">{detailSub.notes}</p>
                  </div>
                </>
              )}

              {detailSub.projectSubs && detailSub.projectSubs.length > 0 && (
                <>
                  <hr className="border-slate-200 dark:border-slate-700" />
                  <div>
                    <span className="text-sm font-medium">Projects:</span>
                    <div className="mt-1 space-y-1">
                      {detailSub.projectSubs.map((ps) => (
                        <div
                          key={ps.project.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <FolderKanban className="size-3.5 text-slate-400" />
                          <span>{ps.project.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {canManage && (
                <>
                  <hr className="border-slate-200 dark:border-slate-700" />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRequestDocs(detailSub)}
                      disabled={requestingDocs}
                    >
                      <FileText className="size-3.5 me-1" />
                      {t("requestDocs")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (detailSub.uploadToken)
                          navigator.clipboard.writeText(
                            window.location.origin +
                              `/subcontractor-upload?token=${detailSub.uploadToken}`,
                          );
                        toast.success(t("uploadLinkCopied"));
                      }}
                    >
                      <Copy className="size-3.5 me-1" />
                      {t("copyUploadLink")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onOpenChange(false);
                        onEdit(detailSub);
                      }}
                    >
                      <Pencil className="size-3.5 me-1" />
                      {tc("edit")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center text-slate-500">Loading...</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
