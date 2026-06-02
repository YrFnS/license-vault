'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeIn } from './constants';

interface BrandingLogoTabProps {
  customLogo: string;
  setCustomLogo: (v: string) => void;
  customFavicon: string;
  setCustomFavicon: (v: string) => void;
  companyName: string;
  setCompanyName: (v: string) => void;
  tagline: string;
  setTagline: (v: string) => void;
}

export function BrandingLogoTab({
  customLogo, setCustomLogo,
  customFavicon, setCustomFavicon,
  companyName, setCompanyName,
  tagline, setTagline,
}: BrandingLogoTabProps) {
  const t = useTranslations('branding');
  const tc = useTranslations('common');

  return (
    <motion.div key="logo" {...fadeIn}>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-5 text-emerald-600" />
            {t('logoIdentity')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>{t('uploadLogo')}</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors">
              {customLogo ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={customLogo} alt="Organization logo" className="h-16 w-auto object-contain" />
                  <Button variant="ghost" size="sm" onClick={() => setCustomLogo('')}>
                    {tc('delete')}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="size-8" />
                  <p className="text-sm">{t('dragDrop')}</p>
                  <p className="text-xs">{t('or')} <span className="text-emerald-600 cursor-pointer hover:underline">{t('browse')}</span></p>
                </div>
              )}
            </div>
            <Input
              placeholder="https://example.com/logo.png"
              value={customLogo}
              onChange={(e) => setCustomLogo(e.target.value)}
            />
          </div>

          {/* Favicon */}
          <div className="space-y-2">
            <Label>{t('uploadFavicon')}</Label>
            <div className="flex items-center gap-3">
              {customFavicon ? (
                <img src={customFavicon} alt="Organization favicon" className="size-8 rounded border border-border" />
              ) : (
                <div className="size-8 rounded border border-border bg-muted flex items-center justify-center">
                  <ImageIcon className="size-4 text-muted-foreground" />
                </div>
              )}
              <Input
                placeholder="https://example.com/favicon.ico"
                value={customFavicon}
                onChange={(e) => setCustomFavicon(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <Separator />

          {/* Company Name */}
          <div className="space-y-2">
            <Label>{t('companyName')}</Label>
            <Input
              placeholder="Your Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          {/* Tagline */}
          <div className="space-y-2">
            <Label>{t('tagline')}</Label>
            <Input
              placeholder="Your trusted compliance partner"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
