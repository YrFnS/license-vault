'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Paintbrush, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { ColorPicker } from './ColorPicker';
import { THEME_PRESETS, fadeIn } from './constants';
import { BrandingColors } from './types';
import { Dispatch, SetStateAction } from 'react';

interface BrandingColorsTabProps {
  colors: BrandingColors;
  setColors: Dispatch<SetStateAction<BrandingColors>>;
  primaryColor: string;
  setPrimaryColor: (v: string) => void;
  applyPreset: (key: string) => void;
}

export function BrandingColorsTab({
  colors, setColors,
  primaryColor, setPrimaryColor,
  applyPreset,
}: BrandingColorsTabProps) {
  const t = useTranslations('branding');

  return (
    <motion.div key="colors" {...fadeIn}>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paintbrush className="size-5 text-emerald-600" />
            {t('colorTheme')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Color */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">{t('primaryColor')}</Label>
            <ColorPicker
              label={t('primaryColor')}
              value={colors.primary}
              onChange={(v) => {
                setColors((c: BrandingColors) => ({ ...c, primary: v }));
                setPrimaryColor(v);
              }}
            />
          </div>

          {/* Secondary Color */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">{t('secondaryColor')}</Label>
            <ColorPicker
              label={t('secondaryColor')}
              value={colors.secondary}
              onChange={(v) => setColors((c: BrandingColors) => ({ ...c, secondary: v }))}
            />
          </div>

          {/* Accent Color */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">{t('accentColor')}</Label>
            <ColorPicker
              label={t('accentColor')}
              value={colors.accent}
              onChange={(v) => setColors((c: BrandingColors) => ({ ...c, accent: v }))}
            />
          </div>

          <Separator />

          {/* Color Swatches */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">{t('preview')}</Label>
            <div className="flex gap-2 flex-wrap">
              <div className="flex flex-col items-center gap-1">
                <div className="size-10 rounded-lg shadow-sm border border-border" style={{ backgroundColor: colors.primary }} />
                <span className="text-[10px] text-muted-foreground">{t('primaryColor')}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="size-10 rounded-lg shadow-sm border border-border" style={{ backgroundColor: colors.secondary }} />
                <span className="text-[10px] text-muted-foreground">{t('secondaryColor')}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="size-10 rounded-lg shadow-sm border border-border" style={{ backgroundColor: colors.accent }} />
                <span className="text-[10px] text-muted-foreground">{t('accentColor')}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Dark Mode Colors */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Moon className="size-4" />
              {t('darkModeColors')}
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <ColorPicker
                label="Dark Primary"
                value={colors.darkPrimary}
                onChange={(v) => setColors((c: BrandingColors) => ({ ...c, darkPrimary: v }))}
              />
              <ColorPicker
                label="Dark Secondary"
                value={colors.darkSecondary}
                onChange={(v) => setColors((c: BrandingColors) => ({ ...c, darkSecondary: v }))}
              />
            </div>
          </div>

          <Separator />

          {/* Theme Presets */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">{t('themePresets')}</Label>
            <div className="grid gap-2 sm:grid-cols-5">
              {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-border hover:border-emerald-500/50 hover:shadow-sm transition-all"
                >
                  <div className="flex gap-0.5">
                    <div className="size-5 rounded-full" style={{ backgroundColor: preset.primary }} />
                    <div className="size-5 rounded-full" style={{ backgroundColor: preset.secondary }} />
                    <div className="size-5 rounded-full" style={{ backgroundColor: preset.accent }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground capitalize">{t(`${key}Theme`)}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
