'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Check, Monitor, Sun, Moon } from 'lucide-react';
import { MiniPreview } from './previews/MiniPreview';
import { BrandingColors, BrandingFonts, BrandingPortal } from './types';

interface BrandingPreviewPanelProps {
  colors: BrandingColors;
  fonts: BrandingFonts;
  companyName: string;
  portal: BrandingPortal;
  saving: boolean;
  onSave: () => void;
}

export function BrandingPreviewPanel({
  colors, fonts,
  companyName, portal,
  saving, onSave,
}: BrandingPreviewPanelProps) {
  const t = useTranslations('branding');
  const tc = useTranslations('common');

  return (
    <div className="space-y-4">
      <Card className="sticky top-20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="size-4 text-emerald-600" />
            {t('livePreview')}
          </CardTitle>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-[10px] gap-1">
              <Sun className="size-3" /> Light
            </Badge>
            <Badge variant="outline" className="text-[10px] gap-1">
              <Moon className="size-3" /> Dark
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mini Dashboard Preview */}
          <MiniPreview colors={colors} font={fonts} companyName={companyName} />

          <Separator />

          {/* Quick Stats */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Info</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('companyName')}</span>
                <span className="font-medium truncate ms-2 max-w-[120px]">{companyName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('primaryColor')}</span>
                <div className="flex items-center gap-1">
                  <div className="size-3 rounded-sm" style={{ backgroundColor: colors.primary }} />
                  <span className="font-mono">{colors.primary}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('headingFont')}</span>
                <span className="font-medium">{fonts.heading}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('fontSize')}</span>
                <span className="font-medium capitalize">{fonts.scale}</span>
              </div>
              {portal.subdomain && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('portalSubdomain')}</span>
                  <span className="font-mono truncate ms-2 max-w-[120px]">{portal.subdomain}.licensevault.com</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Save Button */}
          <Button
            onClick={onSave}
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {tc('loading')}
              </>
            ) : (
              <>
                <Check className="size-4" />
                {t('save')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
