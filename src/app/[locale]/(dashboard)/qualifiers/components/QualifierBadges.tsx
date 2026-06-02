'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/lib/utils';

export function CEProgressBar({ earned, required }: { earned: number; required: number }) {
  const t = useTranslations('qualifiers');
  if (required === 0) return null;
  const pct = Math.min(100, Math.round((earned / required) * 100));
  const isComplete = earned >= required;
  const isPartial = earned > 0 && earned < required;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {earned} / {required} {t('ceHoursEarned').split(' ')[0]}
        </span>
        <span
          className={cn(
            'font-medium',
            isComplete ? 'text-emerald-600 dark:text-emerald-400' : isPartial ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
          )}
        >
          {isComplete ? t('hoursComplete') : `${required - earned} ${t('hoursRemaining')}`}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isComplete
              ? 'bg-emerald-500'
              : isPartial
              ? 'bg-amber-500'
              : 'bg-red-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('qualifiers');
  const config: Record<string, { label: string; className: string }> = {
    active: {
      label: t('active'),
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    },
    expiring: {
      label: t('expiring'),
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    },
    expired: {
      label: t('expired'),
      className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800',
    },
    ce_deficient: {
      label: t('ceDeficient'),
      className: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    },
  };

  const c = config[status] || config.active;

  return (
    <Badge variant="outline" className={cn('text-xs font-medium', c.className)}>
      {c.label}
    </Badge>
  );
}

export function QualifiersLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="rounded-md border">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DetailLoadingSkeleton() {
  return (
    <div className="space-y-3 py-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
