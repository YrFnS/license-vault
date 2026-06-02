'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Users, UserCheck, Clock, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem } from './constants';
import type { StatusCounts } from './types';

interface StatCard {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
}

export function QualifiersStatsCards({ counts }: { counts: StatusCounts }) {
  const t = useTranslations('qualifiers');

  const stats: StatCard[] = [
    {
      label: t('totalQualifiers'),
      value: counts.all,
      icon: Users,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-gradient-to-br from-teal-50/90 via-teal-50/60 to-emerald-100/40 dark:from-teal-950/40 dark:via-teal-950/20 dark:to-emerald-950/10',
      border: 'border-s-teal-500',
    },
    {
      label: t('activeQualifiers'),
      value: counts.active,
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-gradient-to-br from-emerald-50/90 via-emerald-50/60 to-teal-100/40 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-teal-950/10',
      border: 'border-s-emerald-500',
    },
    {
      label: t('atRiskQualifiers'),
      value: counts.expiring,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-gradient-to-br from-amber-50/90 via-amber-50/60 to-amber-100/40 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-amber-950/10',
      border: 'border-s-amber-500',
    },
    {
      label: t('ceDeficientQualifiers'),
      value: counts.ce_deficient,
      icon: GraduationCap,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-gradient-to-br from-red-50/90 via-red-50/60 to-amber-100/40 dark:from-red-950/40 dark:via-red-950/20 dark:to-amber-950/10',
      border: 'border-s-red-500',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <motion.div key={stat.label} variants={staggerItem} whileHover={{ scale: 1.02, y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
            <Card className={cn('relative overflow-hidden border-s-4 shadow-sm hover:shadow-md transition-shadow duration-300', stat.bg, stat.border)}>
              <CardContent className="p-3 md:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground/70 font-bold">{stat.label}</p>
                    <p className="text-2xl lg:text-3xl font-extrabold tabular-nums mt-1">{stat.value}</p>
                  </div>
                  <div className="rounded-xl p-2 lg:p-3 bg-background/50 shadow-sm">
                    <Icon className={cn('size-5 lg:size-6', stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
