'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Code2, Download, Upload, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeIn } from './constants';

interface BrandingAdvancedTabProps {
  customCSS: string;
  setCustomCSS: (v: string) => void;
  customHeadJS: string;
  setCustomHeadJS: (v: string) => void;
  customBodyJS: string;
  setCustomBodyJS: (v: string) => void;
  handleExportBranding: () => void;
  handleImportBranding: () => void;
  onOpenResetDialog: () => void;
}

export function BrandingAdvancedTab({
  customCSS, setCustomCSS,
  customHeadJS, setCustomHeadJS,
  customBodyJS, setCustomBodyJS,
  handleExportBranding,
  handleImportBranding,
  onOpenResetDialog,
}: BrandingAdvancedTabProps) {
  const t = useTranslations('branding');

  return (
    <motion.div key="advanced" {...fadeIn}>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="size-5 text-emerald-600" />
            {t('advanced')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Custom CSS */}
          <div className="space-y-2">
            <Label>{t('customCSS')}</Label>
            <Textarea
              placeholder={"/* Custom CSS styles */&#10;.dashboard {&#10;  /* your styles */&#10;}"}
              value={customCSS}
              onChange={(e) => setCustomCSS(e.target.value)}
              rows={6}
              className="font-mono text-sm bg-slate-950 text-green-400 dark:bg-slate-900 border-slate-700"
            />
          </div>

          {/* Custom Head JS */}
          <div className="space-y-2">
            <Label>{t('customHeadJS')}</Label>
            <Textarea
              placeholder="// JavaScript to inject in <head>"
              value={customHeadJS}
              onChange={(e) => setCustomHeadJS(e.target.value)}
              rows={4}
              className="font-mono text-sm bg-slate-950 text-green-400 dark:bg-slate-900 border-slate-700"
            />
          </div>

          {/* Custom Body JS */}
          <div className="space-y-2">
            <Label>{t('customBodyJS')}</Label>
            <Textarea
              placeholder="// JavaScript to inject before </body>"
              value={customBodyJS}
              onChange={(e) => setCustomBodyJS(e.target.value)}
              rows={4}
              className="font-mono text-sm bg-slate-950 text-green-400 dark:bg-slate-900 border-slate-700"
            />
          </div>

          <Separator />

          {/* Export / Import / Reset */}
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <Button
                variant="outline"
                onClick={handleExportBranding}
                className="gap-2"
              >
                <Download className="size-4" />
                {t('exportBranding')}
              </Button>
              <Button
                variant="outline"
                onClick={handleImportBranding}
                className="gap-2"
              >
                <Upload className="size-4" />
                {t('importBranding')}
              </Button>
              <Button
                variant="destructive"
                onClick={onOpenResetDialog}
                className="gap-2"
              >
                <RotateCcw className="size-4" />
                {t('resetDefaults')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
