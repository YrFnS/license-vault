import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, DollarSign, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import type { StateRequirementData } from '../types';
import { formatCurrency } from '../helpers';

interface YourStateCardProps {
  primaryState: string;
  primaryStateRequirements: StateRequirementData[];
}

export default function YourStateCard({ primaryState, primaryStateRequirements }: YourStateCardProps) {
  const t = useTranslations('stateRequirements');

  if (!primaryState || primaryStateRequirements.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-emerald-50/30 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-emerald-950/10">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="size-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-semibold">{t('yourState')}</h2>
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
              {primaryState}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {primaryStateRequirements.map((req) => (
              <div
                key={req.id}
                className="rounded-lg bg-white/70 dark:bg-background/50 border border-border/50 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t(`licenseTypes.${req.licenseType}` as any)}</span>
                  <div className="flex gap-1">
                    {req.bondRequired && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                        {t('bondRequired')}
                      </Badge>
                    )}
                    {req.insuranceRequired && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800">
                        {t('insuranceRequired')}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {req.renewPeriodMonths} {t('months')}
                  </span>
                  {req.ceHoursRequired > 0 && (
                    <span className="flex items-center gap-1">
                      <FileCheck className="size-3" />
                      {req.ceHoursRequired}h CE
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <DollarSign className="size-3" />
                    {formatCurrency(req.renewalFeeMin, req.renewalFeeMax)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
