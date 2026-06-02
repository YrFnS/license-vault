'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Palette, Shield, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fadeIn } from './helpers';
import type { OrgSettings } from './types';

interface BrandingForm {
  logoUrl: string;
  primaryColor: string;
  loginMessage: string;
}

interface BrandingSectionProps {
  orgSettings: OrgSettings | null;
  brandingForm: BrandingForm;
  setBrandingForm: React.Dispatch<React.SetStateAction<BrandingForm>>;
  savingBranding: boolean;
  canManage: boolean;
  onSave: () => Promise<void>;
}

export function BrandingSection({
  orgSettings,
  brandingForm,
  setBrandingForm,
  savingBranding,
  canManage,
  onSave,
}: BrandingSectionProps) {
  const t = useTranslations('organization');

  return (
    <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle>{t('branding.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Branding form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo-url">{t('branding.logoUrl')}</Label>
                <Input
                  id="logo-url"
                  value={brandingForm.logoUrl}
                  onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  disabled={!canManage}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary-color">{t('branding.primaryColor')}</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="primary-color"
                    value={brandingForm.primaryColor}
                    onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                    disabled={!canManage}
                    className="size-10 rounded-lg border border-border cursor-pointer disabled:opacity-50"
                  />
                  <Input
                    value={brandingForm.primaryColor}
                    onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                    disabled={!canManage}
                    className="flex-1 font-mono"
                  />
                  <div
                    className="size-10 rounded-lg border border-border shrink-0"
                    style={{ backgroundColor: brandingForm.primaryColor }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-message">{t('branding.loginMessage')}</Label>
                <Textarea
                  id="login-message"
                  value={brandingForm.loginMessage}
                  onChange={(e) => setBrandingForm({ ...brandingForm, loginMessage: e.target.value })}
                  placeholder={t('branding.loginMessagePlaceholder')}
                  rows={3}
                  disabled={!canManage}
                />
              </div>
              {canManage && (
                <div className="flex gap-2">
                  <Button
                    onClick={onSave}
                    disabled={savingBranding}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {savingBranding ? (
                      <><Loader2 className="size-4 animate-spin me-2" />{t('profile.saving')}</>
                    ) : (
                      <><Save className="size-4 me-2" />{t('branding.save')}</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setBrandingForm({ logoUrl: '', primaryColor: '#10b981', loginMessage: '' })}
                  >
                    {t('branding.resetToDefault')}
                  </Button>
                </div>
              )}
            </div>

            {/* Branding preview */}
            <div className="space-y-2">
              <Label>{t('branding.preview')}</Label>
              <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                {/* Preview header with custom color */}
                <div
                  className="p-4 text-white"
                  style={{ backgroundColor: brandingForm.primaryColor }}
                >
                  <div className="flex items-center gap-3">
                    {brandingForm.logoUrl ? (
                      <img
                        src={brandingForm.logoUrl}
                        alt="Logo"
                        className="size-8 rounded bg-white/20 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="size-8 rounded bg-white/20 flex items-center justify-center">
                        <Shield className="size-4" />
                      </div>
                    )}
                    <span className="font-bold">{orgSettings?.name || 'Organization'}</span>
                  </div>
                </div>
                {/* Preview login form */}
                <div className="p-6 bg-card space-y-4">
                  {brandingForm.loginMessage && (
                    <p className="text-sm text-muted-foreground italic">
                      &ldquo;{brandingForm.loginMessage}&rdquo;
                    </p>
                  )}
                  <div className="space-y-2">
                    <div className="h-8 rounded bg-muted/50 border border-border/50" />
                    <div className="h-8 rounded bg-muted/50 border border-border/50" />
                    <div
                      className="h-9 rounded text-white text-center flex items-center justify-center text-sm font-medium"
                      style={{ backgroundColor: brandingForm.primaryColor }}
                    >
                      Sign In
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
