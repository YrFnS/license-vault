'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle2, Shield } from 'lucide-react';
import type { AtRiskItem } from './types';
import { itemVariants } from './constants';

interface AtRiskItemsProps {
  items: AtRiskItem[];
}

function getItemTypeIcon(type: string) {
  if (type === 'insurance') return ShieldAlert;
  if (type === 'qualifier') return CheckCircle2;
  return Shield;
}

function getItemTypeColor(type: string): string {
  if (type === 'insurance') return 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400';
  if (type === 'qualifier') return 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400';
  return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400';
}

export default function AtRiskItems({ items }: AtRiskItemsProps) {
  const t = useTranslations('compliance');

  return (
    <motion.div variants={itemVariants}>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold text-foreground">{t('atRiskTitle')}</h2>
        {items.length > 0 && (
          <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
            {items.length}
          </Badge>
        )}
      </div>
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/20 p-5 mb-4">
                <CheckCircle2 className="size-10 text-emerald-500" />
              </div>
              <p className="font-medium text-foreground">{t('atRiskEmpty')}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">{t('atRiskEmptyDesc')}</p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="divide-y divide-border/50">
                {items.map((item, idx) => {
                  const Icon = getItemTypeIcon(item.type);
                  const isExpired = item.daysUntil < 0;
                  return (
                    <motion.div
                      key={`${item.id}-${idx}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-3 p-3 md:p-4 hover:bg-muted/30 transition-colors duration-150"
                    >
                      <div className={`shrink-0 rounded-lg p-2 ${getItemTypeColor(item.type)}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.type === 'license' ? t('licenseName') : item.type === 'insurance' ? t('insurance') : t('qualifier')}
                        </p>
                      </div>
                      <div className="shrink-0 text-end">
                        <Badge
                          className={`text-xs ${
                            isExpired
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                              : item.daysUntil <= 30
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          } border-0`}
                        >
                          {isExpired ? t('expiredDaysAgo', { days: Math.abs(item.daysUntil) }) : t('daysLeft', { days: item.daysUntil })}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
