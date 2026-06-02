'use client';

import { motion } from 'framer-motion';
import { Workflow, CheckCircle2, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { Stats } from './types';

const statItems = (t: (key: string) => string, stats: Stats) => [
  { label: t('totalWorkflows'), value: stats.total, icon: Workflow, color: 'from-emerald-500/10 to-teal-500/10' },
  { label: t('definitions'), value: stats.active, icon: CheckCircle2, color: 'from-teal-500/10 to-cyan-500/10' },
  { label: t('activeInstances'), value: stats.runningInstances, icon: Play, color: 'from-amber-500/10 to-orange-500/10' },
  { label: t('completedInstances'), value: stats.completed, icon: CheckCircle2, color: 'from-emerald-500/10 to-green-500/10' },
];

export function StatsCards({ stats }: { stats: Stats }) {
  const t = useTranslations('workflows');
  const items = statItems(t, stats);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((stat, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <Card className={cn('border-border/50 shadow-sm relative overflow-hidden', `bg-gradient-to-br ${stat.color}`)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-2xl font-extrabold mt-1 tabular-nums">{stat.value}</p>
                </div>
                <stat.icon className="size-8 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
