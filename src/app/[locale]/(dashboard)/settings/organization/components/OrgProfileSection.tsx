'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Building2, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fadeIn } from './helpers';
import { US_STATES, TRADE_TYPES } from './types';

interface OrgProfileSectionProps {
  profileForm: {
    name: string;
    tradeType: string;
    primaryState: string;
    companyName: string;
  };
  setProfileForm: React.Dispatch<React.SetStateAction<OrgProfileSectionProps['profileForm']>>;
  savingProfile: boolean;
  canManage: boolean;
  onSave: () => Promise<void>;
}

export function OrgProfileSection({
  profileForm,
  setProfileForm,
  savingProfile,
  canManage,
  onSave,
}: OrgProfileSectionProps) {
  const t = useTranslations('organization');

  return (
    <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle>{t('profile.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">{t('profile.name')}</Label>
              <Input
                id="org-name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                disabled={!canManage}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-name">{t('profile.companyName')}</Label>
              <Input
                id="company-name"
                value={profileForm.companyName}
                onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                disabled={!canManage}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trade-type">{t('profile.tradeType')}</Label>
              <Select
                value={profileForm.tradeType}
                onValueChange={(v) => setProfileForm({ ...profileForm, tradeType: v })}
                disabled={!canManage}
              >
                <SelectTrigger id="trade-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRADE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary-state">{t('profile.primaryState')}</Label>
              <Select
                value={profileForm.primaryState}
                onValueChange={(v) => setProfileForm({ ...profileForm, primaryState: v })}
                disabled={!canManage}
              >
                <SelectTrigger id="primary-state">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {canManage && (
            <Button
              onClick={onSave}
              disabled={savingProfile}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              {savingProfile ? (
                <><Loader2 className="size-4 animate-spin me-2" />{t('profile.saving')}</>
              ) : (
                <><Save className="size-4 me-2" />{t('profile.save')}</>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
