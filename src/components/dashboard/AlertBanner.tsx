'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Bell, AlertOctagon, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertBannerProps {
  expiredCount: number;
  expiringCount: number;
  className?: string;
}

export function AlertBanner({ expiredCount, expiringCount, className }: AlertBannerProps) {
  const t = useTranslations('dashboard.alertBanner');
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || (expiredCount === 0 && expiringCount === 0)) {
    return null;
  }

  const hasExpired = expiredCount > 0;
  const hasExpiring = expiringCount > 0;

  return (
    <div className={cn('space-y-3', className)}>
      {hasExpired && (
        <Alert
          variant="destructive"
          className="relative border-red-300 dark:border-red-800 bg-gradient-to-r from-red-50 via-red-50/90 to-red-100/60 dark:from-red-950/40 dark:via-red-950/30 dark:to-red-900/20 shadow-sm"
        >
          {/* Animated pulse dot for critical alerts */}
          <span className="absolute top-3 start-3 flex size-2">
            <span className="animate-ping absolute inline-flex size-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-red-500" />
          </span>
          <AlertOctagon className="size-5 text-red-600 dark:text-red-400 ms-4" />
          <AlertDescription className="pe-8 text-red-800 dark:text-red-300 font-medium">
            {t('expired', {
              count: expiredCount,
            })}
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 end-2 size-6 text-red-600 hover:bg-red-200/60 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors duration-200"
            onClick={() => setDismissed(true)}
          >
            <X className="size-3" />
            <span className="sr-only">{t('dismiss')}</span>
          </Button>
        </Alert>
      )}
      {hasExpiring && (
        <Alert className="relative border-amber-300 dark:border-amber-800 bg-gradient-to-r from-amber-50 via-amber-50/90 to-amber-100/60 dark:from-amber-950/40 dark:via-amber-950/30 dark:to-amber-900/20 shadow-sm">
          <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="pe-8 text-amber-800 dark:text-amber-300 font-medium">
            {t('expiring', {
              count: expiringCount,
            })}
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 end-2 size-6 text-amber-600 hover:bg-amber-200/60 dark:text-amber-400 dark:hover:bg-amber-900/50 transition-colors duration-200"
            onClick={() => setDismissed(true)}
          >
            <X className="size-3" />
            <span className="sr-only">{t('dismiss')}</span>
          </Button>
        </Alert>
      )}
    </div>
  );
}
