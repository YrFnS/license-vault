'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Mail, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { ColorPicker } from './ColorPicker';
import { EmailPreview } from './previews/EmailPreview';
import { fadeIn } from './constants';
import { BrandingEmailTemplates } from './types';
import { Dispatch, SetStateAction } from 'react';

interface BrandingEmailTabProps {
  emailTemplates: BrandingEmailTemplates;
  setEmailTemplates: Dispatch<SetStateAction<BrandingEmailTemplates>>;
  primaryColor: string;
}

export function BrandingEmailTab({
  emailTemplates, setEmailTemplates,
  primaryColor,
}: BrandingEmailTabProps) {
  const t = useTranslations('branding');

  return (
    <motion.div key="email" {...fadeIn}>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5 text-emerald-600" />
            {t('emailTemplates')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Header Color */}
          <div className="space-y-2">
            <Label>{t('emailHeaderColor')}</Label>
            <ColorPicker
              label=""
              value={emailTemplates.headerColor}
              onChange={(v) => setEmailTemplates((et: BrandingEmailTemplates) => ({ ...et, headerColor: v }))}
            />
          </div>

          {/* Email Footer Text */}
          <div className="space-y-2">
            <Label>{t('emailFooterText')}</Label>
            <Input
              placeholder="© 2024 Your Company. All rights reserved."
              value={emailTemplates.footerText}
              onChange={(e) => setEmailTemplates((et: BrandingEmailTemplates) => ({ ...et, footerText: e.target.value }))}
            />
          </div>

          {/* Show Logo in Emails */}
          <div className="flex items-center justify-between">
            <Label>{t('showLogoInEmail')}</Label>
            <Switch
              checked={emailTemplates.showLogo}
              onCheckedChange={(v) => setEmailTemplates((et: BrandingEmailTemplates) => ({ ...et, showLogo: v }))}
            />
          </div>

          {/* Email Signature */}
          <div className="space-y-2">
            <Label>{t('emailSignature')}</Label>
            <Textarea
              placeholder={"Best regards,&#10;Your Company Team"}
              value={emailTemplates.signature}
              onChange={(e) => setEmailTemplates((et: BrandingEmailTemplates) => ({ ...et, signature: e.target.value }))}
              rows={3}
            />
          </div>

          <Separator />

          {/* Email Preview */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Eye className="size-4" />
              {t('preview')}
            </Label>
            <EmailPreview config={emailTemplates} primaryColor={primaryColor} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
