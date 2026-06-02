'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Globe, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { PortalPreview } from './previews/PortalPreview';
import { fadeIn } from './constants';
import { BrandingPortal } from './types';
import { Dispatch, SetStateAction } from 'react';

interface BrandingPortalTabProps {
  portal: BrandingPortal;
  setPortal: Dispatch<SetStateAction<BrandingPortal>>;
  primaryColor: string;
}

export function BrandingPortalTab({
  portal, setPortal,
  primaryColor,
}: BrandingPortalTabProps) {
  const t = useTranslations('branding');

  return (
    <motion.div key="portal" {...fadeIn}>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-5 text-emerald-600" />
            {t('portalSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subdomain */}
          <div className="space-y-2">
            <Label>{t('portalSubdomain')}</Label>
            <div className="flex items-center gap-0">
              <Input
                placeholder="company"
                value={portal.subdomain}
                onChange={(e) => setPortal((p: BrandingPortal) => ({ ...p, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                className="rounded-e-none"
              />
              <div className="px-3 py-2 bg-muted border border-s-0 border-border rounded-e-lg text-sm text-muted-foreground whitespace-nowrap">
                .licensevault.com
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <Label>{t('portalWelcome')}</Label>
            <Textarea
              placeholder="Welcome to our compliance portal..."
              value={portal.welcomeMessage}
              onChange={(e) => setPortal((p: BrandingPortal) => ({ ...p, welcomeMessage: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Show Compliance Score */}
          <div className="flex items-center justify-between">
            <Label>{t('showComplianceScore')}</Label>
            <Switch
              checked={portal.showComplianceScore}
              onCheckedChange={(v) => setPortal((p: BrandingPortal) => ({ ...p, showComplianceScore: v }))}
            />
          </div>

          {/* Show Contact Info */}
          <div className="flex items-center justify-between">
            <Label>{t('showContactInfo')}</Label>
            <Switch
              checked={portal.showContactInfo}
              onCheckedChange={(v) => setPortal((p: BrandingPortal) => ({ ...p, showContactInfo: v }))}
            />
          </div>

          {/* Footer Text */}
          <div className="space-y-2">
            <Label>{t('portalFooter')}</Label>
            <Input
              placeholder="Powered by Your Company"
              value={portal.footerText}
              onChange={(e) => setPortal((p: BrandingPortal) => ({ ...p, footerText: e.target.value }))}
            />
          </div>

          <Separator />

          {/* Portal Preview */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Eye className="size-4" />
              {t('preview')}
            </Label>
            <PortalPreview config={portal} primaryColor={primaryColor} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
