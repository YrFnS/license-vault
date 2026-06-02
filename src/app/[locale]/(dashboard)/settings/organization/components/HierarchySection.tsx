'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Network,
  Plus,
  Unlink,
  Eye,
  Building2,
  Loader2,
  FileText,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fadeIn, getComplianceIcon } from './helpers';
import { US_STATES, TRADE_TYPES } from './types';
import type { HierarchyData, SubsidiaryInfo } from './types';

interface SubsidiaryForm {
  name: string;
  tradeType: string;
  primaryState: string;
  companyName: string;
}

interface HierarchySectionProps {
  hierarchy: HierarchyData | null;
  subsidiaryDialog: boolean;
  setSubsidiaryDialog: React.Dispatch<React.SetStateAction<boolean>>;
  subsidiaryForm: SubsidiaryForm;
  setSubsidiaryForm: React.Dispatch<React.SetStateAction<SubsidiaryForm>>;
  creatingSubsidiary: boolean;
  onCreateSubsidiary: () => Promise<void>;
  onUnlinkTarget: (sub: SubsidiaryInfo) => void;
}

export function HierarchySection({
  hierarchy,
  subsidiaryDialog,
  setSubsidiaryDialog,
  subsidiaryForm,
  setSubsidiaryForm,
  creatingSubsidiary,
  onCreateSubsidiary,
  onUnlinkTarget,
}: HierarchySectionProps) {
  const t = useTranslations('organization');
  const hasSubsidiaries = (hierarchy?.subsidiaries.length ?? 0) > 0;

  return (
    <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="size-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle>{t('hierarchy.title')}</CardTitle>
            </div>
            <Dialog open={subsidiaryDialog} onOpenChange={setSubsidiaryDialog}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  <Plus className="size-4 me-1" />
                  {t('hierarchy.addSubsidiary')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('hierarchy.addSubsidiary')}</DialogTitle>
                  <DialogDescription>
                    Create a new subsidiary organization under your current org.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>{t('profile.name')}</Label>
                    <Input
                      value={subsidiaryForm.name}
                      onChange={(e) => setSubsidiaryForm({ ...subsidiaryForm, name: e.target.value })}
                      placeholder="Subsidiary name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('profile.tradeType')}</Label>
                    <Select
                      value={subsidiaryForm.tradeType}
                      onValueChange={(v) => setSubsidiaryForm({ ...subsidiaryForm, tradeType: v })}
                    >
                      <SelectTrigger>
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
                    <Label>{t('profile.primaryState')}</Label>
                    <Select
                      value={subsidiaryForm.primaryState}
                      onValueChange={(v) => setSubsidiaryForm({ ...subsidiaryForm, primaryState: v })}
                    >
                      <SelectTrigger>
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
                  <div className="space-y-2">
                    <Label>{t('profile.companyName')}</Label>
                    <Input
                      value={subsidiaryForm.companyName}
                      onChange={(e) => setSubsidiaryForm({ ...subsidiaryForm, companyName: e.target.value })}
                      placeholder="Legal company name (optional)"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSubsidiaryDialog(false)}>
                    {t('profile.save') === 'Save Profile' ? 'Cancel' : 'إلغاء'}
                  </Button>
                  <Button
                    onClick={onCreateSubsidiary}
                    disabled={creatingSubsidiary || !subsidiaryForm.name || !subsidiaryForm.tradeType || !subsidiaryForm.primaryState}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  >
                    {creatingSubsidiary ? (
                      <><Loader2 className="size-4 animate-spin me-2" />Creating...</>
                    ) : (
                      <><Plus className="size-4 me-2" />Create</>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Visual tree */}
          <div className="space-y-4">
            {/* Parent org (if exists) */}
            {hierarchy?.parent && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t('hierarchy.parentOrg')}</p>
                <Card className="border-dashed border-emerald-300 dark:border-emerald-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Building2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium">{hierarchy.parent.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {hierarchy.parent.tradeType} · {hierarchy.parent.primaryState}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Connector line */}
                <div className="flex justify-center">
                  <div className="w-px h-6 bg-border" />
                </div>
              </div>
            )}

            {/* Current org */}
            {hierarchy?.currentOrg && (
              <Card className="border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
                        <Building2 className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold">{hierarchy.currentOrg.name}</p>
                          <Badge variant="secondary" className="text-[10px]">Current</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {hierarchy.currentOrg.tradeType} · {hierarchy.currentOrg.primaryState}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold">{hierarchy.currentOrg.licenseCount}</p>
                        <p className="text-[10px] text-muted-foreground">{t('hierarchy.licenseCount')}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">{hierarchy.currentOrg.memberCount}</p>
                        <p className="text-[10px] text-muted-foreground">{t('hierarchy.memberCount')}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          {getComplianceIcon(hierarchy.currentOrg.complianceScore)}
                          <p className="font-bold">{hierarchy.currentOrg.complianceScore}%</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{t('hierarchy.complianceScore')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Connector line to subsidiaries */}
            {hasSubsidiaries && (
              <div className="flex justify-center">
                <div className="w-px h-6 bg-border" />
              </div>
            )}

            {/* Subsidiaries */}
            {hasSubsidiaries && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('hierarchy.subsidiaries')} ({hierarchy!.subsidiaries.length})
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {hierarchy!.subsidiaries.map((sub) => (
                    <Card
                      key={sub.id}
                      className="shadow-sm hover:shadow-md transition-all duration-200 group"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                              <Building2 className="size-4 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{sub.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {sub.tradeType} · {sub.primaryState}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-emerald-600">
                              <Eye className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-red-600"
                              onClick={() => onUnlinkTarget(sub)}
                            >
                              <Unlink className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs">
                          <div className="flex items-center gap-1">
                            <FileText className="size-3 text-muted-foreground" />
                            <span>{sub.licenseCount} {t('hierarchy.licenseCount')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="size-3 text-muted-foreground" />
                            <span>{sub.memberCount} {t('hierarchy.memberCount')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {getComplianceIcon(sub.complianceScore)}
                            <span>{sub.complianceScore}% {t('hierarchy.complianceScore')}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty subsidiaries state */}
            {!hasSubsidiaries && (
              <div className="text-center py-8">
                <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Network className="size-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">{t('hierarchy.noSubsidiaries')}</p>
                <p className="text-sm text-muted-foreground/70 mt-1">{t('hierarchy.noSubsidiariesDesc')}</p>
                <Button
                  size="sm"
                  className="mt-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  onClick={() => setSubsidiaryDialog(true)}
                >
                  <Plus className="size-4 me-1" />
                  {t('hierarchy.addSubsidiary')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
