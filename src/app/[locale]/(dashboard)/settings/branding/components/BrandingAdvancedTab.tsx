"use client";

import { useTranslations } from "next-intl";
import { Code2, Download, RotateCcw, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { fadeIn } from "./constants";

interface BrandingAdvancedTabProps {
  customCSS: string;
  setCustomCSS: (value: string) => void;
  handleExportBranding: () => void;
  handleImportBranding: () => void;
  onOpenResetDialog: () => void;
}

export function BrandingAdvancedTab({
  customCSS,
  setCustomCSS,
  handleExportBranding,
  handleImportBranding,
  onOpenResetDialog,
}: BrandingAdvancedTabProps) {
  const t = useTranslations("branding");

  return (
    <motion.div key="advanced" {...fadeIn}>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="size-5 text-emerald-600" />
            {t("advanced")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t("customCSS")}</Label>
            <Textarea
              placeholder={"/* Custom CSS styles */\n.dashboard {\n  /* your styles */\n}"}
              value={customCSS}
              onChange={(event) => setCustomCSS(event.target.value)}
              rows={8}
              className="border-slate-700 bg-slate-950 font-mono text-sm text-green-400 dark:bg-slate-900"
            />
          </div>

          <Separator />

          <div className="grid gap-2 sm:grid-cols-3">
            <Button
              variant="outline"
              onClick={handleExportBranding}
              className="gap-2"
            >
              <Download className="size-4" />
              {t("exportBranding")}
            </Button>
            <Button
              variant="outline"
              onClick={handleImportBranding}
              className="gap-2"
            >
              <Upload className="size-4" />
              {t("importBranding")}
            </Button>
            <Button
              variant="destructive"
              onClick={onOpenResetDialog}
              className="gap-2"
            >
              <RotateCcw className="size-4" />
              {t("resetDefaults")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
