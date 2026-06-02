'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Type } from 'lucide-react';
import { motion } from 'framer-motion';
import { FONT_OPTIONS, fadeIn } from './constants';
import { BrandingFonts } from './types';
import { Dispatch, SetStateAction } from 'react';

interface BrandingTypographyTabProps {
  fonts: BrandingFonts;
  setFonts: Dispatch<SetStateAction<BrandingFonts>>;
  companyName: string;
  tagline: string;
}

export function BrandingTypographyTab({
  fonts, setFonts,
  companyName, tagline,
}: BrandingTypographyTabProps) {
  const t = useTranslations('branding');

  return (
    <motion.div key="typography" {...fadeIn}>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="size-5 text-emerald-600" />
            {t('typography')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Heading Font */}
          <div className="space-y-2">
            <Label>{t('headingFont')}</Label>
            <Select value={fonts.heading} onValueChange={(v) => setFonts((f: BrandingFonts) => ({ ...f, heading: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((font) => (
                  <SelectItem key={font} value={font}>
                    <span style={{ fontFamily: font }}>{font}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Body Font */}
          <div className="space-y-2">
            <Label>{t('bodyFont')}</Label>
            <Select value={fonts.body} onValueChange={(v) => setFonts((f: BrandingFonts) => ({ ...f, body: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((font) => (
                  <SelectItem key={font} value={font}>
                    <span style={{ fontFamily: font }}>{font}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size Scale */}
          <div className="space-y-2">
            <Label>{t('fontSize')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['compact', 'normal', 'large'] as const).map((scale) => (
                <button
                  key={scale}
                  onClick={() => setFonts((f: BrandingFonts) => ({ ...f, scale }))}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    fonts.scale === scale
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                      : 'border-border hover:border-emerald-500/50'
                  }`}
                >
                  {t(scale)}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Live Preview Text */}
          <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
            <Label className="text-muted-foreground">{t('livePreview')}</Label>
            <div style={{ fontFamily: fonts.heading }}>
              <p className="font-bold" style={{ fontSize: fonts.scale === 'compact' ? '18px' : fonts.scale === 'large' ? '24px' : '20px' }}>
                {companyName || 'Your Company'}
              </p>
            </div>
            <div style={{ fontFamily: fonts.body }}>
              <p style={{ fontSize: fonts.scale === 'compact' ? '12px' : fonts.scale === 'large' ? '16px' : '14px' }}>
                {tagline || 'Your compliance dashboard shows all licenses, expiration dates, and compliance scores at a glance.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
