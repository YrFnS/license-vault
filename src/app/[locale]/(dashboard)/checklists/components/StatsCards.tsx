import { useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';
import { LayoutTemplate, Clock, CheckCircle2, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatDef {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  accent: string;
}

export function StatsCards({ instanceCounts, templatesCount }: {
  instanceCounts: { in_progress: number; completed: number; completedThisMonth: number };
  templatesCount: number;
}) {
  const t = useTranslations('checklists');

  const stats: StatDef[] = [
    { label: t('templates'), value: templatesCount, icon: LayoutTemplate, color: 'from-teal-50 to-teal-100/40 dark:from-teal-950/40', accent: 'border-teal-400' },
    { label: t('inProgress'), value: instanceCounts.in_progress, icon: Clock, color: 'from-amber-50 to-amber-100/40 dark:from-amber-950/40', accent: 'border-amber-400' },
    { label: t('completed'), value: instanceCounts.completed, icon: CheckCircle2, color: 'from-emerald-50 to-emerald-100/40 dark:from-emerald-950/40', accent: 'border-emerald-400' },
    { label: t('completedThisMonth'), value: instanceCounts.completedThisMonth, icon: Calendar, color: 'from-purple-50 to-purple-100/40 dark:from-purple-950/40', accent: 'border-purple-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(stat => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className={`bg-gradient-to-br ${stat.color} border-s-4 ${stat.accent}`}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                <Icon className="size-4 text-muted-foreground/50" />
              </div>
              <p className="text-2xl font-extrabold tabular-nums">{stat.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
