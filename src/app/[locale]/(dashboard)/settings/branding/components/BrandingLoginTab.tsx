'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ImageIcon, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { ColorPicker } from './ColorPicker';
import { LoginPagePreview } from './previews/LoginPagePreview';
import { fadeIn } from './constants';
import { BrandingLoginPage } from './types';
import { Dispatch, SetStateAction } from 'react';

interface BrandingLoginTabProps {
  loginPage: BrandingLoginPage;
  setLoginPage: Dispatch<SetStateAction<BrandingLoginPage>>;
  primaryColor: string;
}

export function BrandingLoginTab({
  loginPage, setLoginPage,
  primaryColor,
}: BrandingLoginTabProps) {
  const t = useTranslations('branding');

  return (
    <motion.div key="login" {...fadeIn}>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="size-5 text-emerald-600" />
            {t('loginPage')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Background Image */}
          <div className="space-y-2">
            <Label>{t('backgroundImage')}</Label>
            <Input
              placeholder="https://example.com/bg.jpg"
              value={loginPage.backgroundImage}
              onChange={(e) => setLoginPage((lp: BrandingLoginPage) => ({ ...lp, backgroundImage: e.target.value }))}
            />
          </div>

          {/* Login Title */}
          <div className="space-y-2">
            <Label>{t('loginTitle')}</Label>
            <Input
              placeholder="Welcome Back"
              value={loginPage.title}
              onChange={(e) => setLoginPage((lp: BrandingLoginPage) => ({ ...lp, title: e.target.value }))}
            />
          </div>

          {/* Login Subtitle */}
          <div className="space-y-2">
            <Label>{t('loginSubtitle')}</Label>
            <Input
              placeholder="Sign in to your compliance portal"
              value={loginPage.subtitle}
              onChange={(e) => setLoginPage((lp: BrandingLoginPage) => ({ ...lp, subtitle: e.target.value }))}
            />
          </div>

          {/* Left Panel Color */}
          <div className="space-y-2">
            <Label>{t('leftPanelColor')}</Label>
            <ColorPicker
              label=""
              value={loginPage.leftPanelColor || primaryColor}
              onChange={(v) => setLoginPage((lp: BrandingLoginPage) => ({ ...lp, leftPanelColor: v }))}
            />
          </div>

          {/* Show Social Login */}
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('showSocialLogin')}</Label>
              <p className="text-xs text-muted-foreground">Google, GitHub, Microsoft</p>
            </div>
            <Switch
              checked={loginPage.showSocialLogin}
              onCheckedChange={(v) => setLoginPage((lp: BrandingLoginPage) => ({ ...lp, showSocialLogin: v }))}
            />
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <Label>{t('welcomeMessage')}</Label>
            <Textarea
              placeholder="Enter a custom welcome message for your team..."
              value={loginPage.welcomeMessage}
              onChange={(e) => setLoginPage((lp: BrandingLoginPage) => ({ ...lp, welcomeMessage: e.target.value }))}
              rows={3}
            />
          </div>

          <Separator />

          {/* Login Preview */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Eye className="size-4" />
              {t('preview')}
            </Label>
            <LoginPagePreview config={loginPage} primaryColor={primaryColor} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
