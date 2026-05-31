'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

export function ComplianceScoreCard({ active, total }: { active: number; total: number }) {
  const t = useTranslations('dashboard');
  const percentage = total > 0 ? Math.round((active / total) * 100) : -1;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage < 0) return 'text-muted-foreground';
    if (percentage >= 80) return 'text-emerald-500';
    if (percentage >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getTrackColor = () => {
    if (percentage < 0) return 'stroke-muted-foreground/20';
    if (percentage >= 80) return 'stroke-emerald-200 dark:stroke-emerald-900';
    if (percentage >= 60) return 'stroke-amber-200 dark:stroke-amber-900';
    return 'stroke-red-200 dark:stroke-red-900';
  };

  const getFillColor = () => {
    if (percentage < 0) return 'stroke-muted-foreground/30';
    if (percentage >= 80) return 'stroke-emerald-500';
    if (percentage >= 60) return 'stroke-amber-500';
    return 'stroke-red-500';
  };

  const displayPercentage = percentage < 0 ? '—' : `${percentage}%`;
  const actualOffset = percentage < 0 ? circumference : strokeDashoffset;

  return (
    <Card>
      <CardContent className="p-4 md:p-6 flex items-center gap-6">
        <div className="relative shrink-0">
          <svg width="96" height="96" className="transform -rotate-90">
            <circle cx="48" cy="48" r={radius} fill="none" strokeWidth="8" className={getTrackColor()} />
            <circle
              cx="48" cy="48" r={radius} fill="none" strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circumference}
              strokeDashoffset={actualOffset}
              className={`${getFillColor()} transition-all duration-1000 ease-out`}
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold tabular-nums ${getColor()}`}>
              {displayPercentage}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{t('complianceScore')}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('complianceScoreDesc')}</p>
          <div className="flex items-center gap-1.5 mt-2">
            {percentage < 0 ? (
              <ShieldAlert className="size-4 text-muted-foreground shrink-0" />
            ) : percentage >= 80 ? (
              <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
            ) : (
              <ShieldAlert className="size-4 text-amber-500 shrink-0" />
            )}
            <span className="text-xs text-muted-foreground">
              {percentage < 0 ? t('emptyStateTitle') : percentage >= 80 ? t('complianceGood') : t('complianceNeedsAttention')}
            </span>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
          <span className="text-2xl font-bold tabular-nums text-foreground">{active}</span>
          <span className="text-xs text-muted-foreground">
            {total > 0 ? `/ ${total}` : '—'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
