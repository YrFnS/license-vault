'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { CreditCard, Shield, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fadeIn, getPlanBadge } from './helpers';
import type { OrgSettings, HierarchyData } from './types';

interface PlanBillingSectionProps {
  orgSettings: OrgSettings | null;
  hierarchy: HierarchyData | null;
}

export function PlanBillingSection({
  orgSettings,
  hierarchy,
}: PlanBillingSectionProps) {
  const t = useTranslations('organization');

  return (
    <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle>{t('plan.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current plan */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/60 to-muted/30 border border-border/30">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <Shield className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{t('plan.currentPlan')}</p>
                    {getPlanBadge(orgSettings?.plan || 'free', t('plan.pro'), t('plan.enterprise'), t('plan.free'))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {orgSettings?.plan === 'pro' ? '$29/month' : orgSettings?.plan === 'enterprise' ? 'Custom pricing' : '$0/month'}
                  </p>
                </div>
              </div>
              {orgSettings?.plan !== 'enterprise' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                >
                  <ArrowUpRight className="size-4 me-1" />
                  {t('plan.upgrade')}
                </Button>
              )}
            </div>

            {/* Feature usage stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: t('plan.licensesUsed'), value: hierarchy?.currentOrg.licenseCount ?? 0, max: orgSettings?.plan === 'free' ? 25 : '∞' },
                { label: t('plan.teamMembers'), value: hierarchy?.currentOrg.memberCount ?? 0, max: orgSettings?.plan === 'free' ? 5 : '∞' },
                { label: t('plan.projects'), value: hierarchy?.projectCount ?? 0, max: orgSettings?.plan === 'free' ? 3 : '∞' },
                { label: t('plan.apiCalls'), value: hierarchy?.apiCallCount ?? 0, max: orgSettings?.plan === 'free' ? '100/mo' : '∞' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-border/50 p-3 bg-muted/20">
                  <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                      style={{
                        width: typeof stat.max === 'number' && stat.max > 0
                          ? `${Math.min((stat.value / stat.max) * 100, 100)}%`
                          : '0%',
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    of {stat.max} limit
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
