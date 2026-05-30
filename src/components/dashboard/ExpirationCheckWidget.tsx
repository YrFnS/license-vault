'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  AlertOctagon,
  AlertTriangle,
  Clock,
  ShieldAlert,
  BellRing,
  CheckCircle2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ExpirationCheckResult {
  checked: number;
  expired: number;
  expiring5Days: number;
  expiring30Days: number;
  expiring60Days: number;
  notificationsCreated: number;
}

interface ExpirationCheckWidgetProps {
  className?: string;
}

export function ExpirationCheckWidget({ className }: ExpirationCheckWidgetProps) {
  const t = useTranslations('dashboard');
  const [result, setResult] = useState<ExpirationCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const runCheck = useCallback(async (showToast = false) => {
    try {
      setChecking(true);
      setError(null);
      const res = await fetch('/api/licenses/check-expirations');
      if (!res.ok) throw new Error('Failed to check expirations');
      const data: ExpirationCheckResult = await res.json();
      setResult(data);
      if (showToast) {
        toast.success(t('expirationCheck'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      if (showToast) {
        toast.error('Failed to check expirations');
      }
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, [t]);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  const handleCheckNow = () => {
    setBannerDismissed(false);
    runCheck(true);
  };

  const hasIssues = result && (result.expired > 0 || result.expiring5Days > 0 || result.expiring30Days > 0 || result.expiring60Days > 0);
  const hasCritical = result && (result.expired > 0 || result.expiring5Days > 0);
  const hasWarning = result && result.expiring30Days > 0;

  // Loading skeleton
  if (loading) {
    return (
      <Card className={cn('shadow-md hover:shadow-xl transition-shadow duration-300', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded bg-muted animate-pulse" />
              <div className="h-5 w-40 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-8 w-24 rounded bg-muted animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                <div className="h-6 w-8 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('border-destructive/30 shadow-md', className)}>
        <CardContent className="p-4 flex items-center gap-3">
          <ShieldAlert className="size-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <Button variant="outline" size="sm" onClick={handleCheckNow} disabled={checking}>
            <RefreshCw className={cn('size-3 me-1', checking && 'animate-spin')} />
            {t('checkNow')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  const statItems = [
    {
      key: 'expired' as const,
      count: result.expired,
      icon: AlertOctagon,
      iconColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      borderColor: 'border-red-200 dark:border-red-800',
      gradientBg: 'bg-gradient-to-br from-red-50/95 via-red-50/70 to-red-100/50 dark:from-red-950/50 dark:via-red-950/30 dark:to-red-900/15',
      accentBorder: 'border-s-[4px] border-s-red-500 dark:border-s-red-600',
      countColor: 'text-red-700 dark:text-red-300',
      labelKey: 'expiredCount',
    },
    {
      key: 'expiring5' as const,
      count: result.expiring5Days,
      icon: AlertTriangle,
      iconColor: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      borderColor: 'border-orange-200 dark:border-orange-800',
      gradientBg: 'bg-gradient-to-br from-orange-50/95 via-orange-50/70 to-orange-100/50 dark:from-orange-950/50 dark:via-orange-950/30 dark:to-orange-900/15',
      accentBorder: 'border-s-[4px] border-s-orange-500 dark:border-s-orange-600',
      countColor: 'text-orange-700 dark:text-orange-300',
      labelKey: 'expiring5Days',
    },
    {
      key: 'expiring30' as const,
      count: result.expiring30Days,
      icon: Clock,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-800',
      gradientBg: 'bg-gradient-to-br from-amber-50/95 via-amber-50/70 to-amber-100/50 dark:from-amber-950/50 dark:via-amber-950/30 dark:to-amber-900/15',
      accentBorder: 'border-s-[4px] border-s-amber-500 dark:border-s-amber-600',
      countColor: 'text-amber-700 dark:text-amber-300',
      labelKey: 'expiring30Days',
    },
    {
      key: 'expiring60' as const,
      count: result.expiring60Days,
      icon: Clock,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      gradientBg: 'bg-gradient-to-br from-yellow-50/95 via-yellow-50/70 to-yellow-100/50 dark:from-yellow-950/50 dark:via-yellow-950/30 dark:to-yellow-900/15',
      accentBorder: 'border-s-[4px] border-s-yellow-500 dark:border-s-yellow-600',
      countColor: 'text-yellow-700 dark:text-yellow-300',
      labelKey: 'expiring60Days',
    },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Critical/Warning Alert Banner */}
      <AnimatePresence>
        {hasIssues && !bannerDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
          >
            {hasCritical ? (
              <Alert
                variant="destructive"
                className="relative border-red-300 dark:border-red-800 bg-gradient-to-r from-red-50 via-red-50/90 to-red-100/60 dark:from-red-950/40 dark:via-red-950/30 dark:to-red-900/20 shadow-md overflow-hidden"
              >
                {/* Animated pulse */}
                <span className="absolute top-3.5 start-3 flex size-2.5">
                  <span className="animate-ping absolute inline-flex size-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2.5 bg-red-500" />
                </span>
                <AlertOctagon className="size-5 text-red-600 dark:text-red-400 ms-5" />
                <AlertDescription className="pe-8 text-red-800 dark:text-red-300 font-semibold">
                  {t('criticalAlert')}
                  <span className="block sm:inline sm:ms-2 font-normal text-red-700 dark:text-red-400">
                    {result.expired > 0 && `${result.expired} ${t('expiredCount').toLowerCase()}`}
                    {result.expired > 0 && result.expiring5Days > 0 && ' · '}
                    {result.expiring5Days > 0 && `${result.expiring5Days} ${t('expiring5Days').toLowerCase()}`}
                  </span>
                </AlertDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 end-2 size-6 text-red-600 hover:bg-red-200/60 dark:text-red-400 dark:hover:bg-red-900/50"
                  onClick={() => setBannerDismissed(true)}
                >
                  <X className="size-3" />
                  <span className="sr-only">{t('alertBanner.dismiss')}</span>
                </Button>
              </Alert>
            ) : hasWarning ? (
              <Alert className="relative border-amber-300 dark:border-amber-800 bg-gradient-to-r from-amber-50 via-amber-50/90 to-amber-100/60 dark:from-amber-950/40 dark:via-amber-950/30 dark:to-amber-900/20 shadow-md overflow-hidden">
                <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="pe-8 text-amber-800 dark:text-amber-300 font-semibold">
                  {t('warningAlert')}
                  <span className="block sm:inline sm:ms-2 font-normal text-amber-700 dark:text-amber-400">
                    {result.expiring30Days > 0 && `${result.expiring30Days} ${t('expiring30Days').toLowerCase()}`}
                    {result.expiring60Days > 0 && ` · ${result.expiring60Days} ${t('expiring60Days').toLowerCase()}`}
                  </span>
                </AlertDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 end-2 size-6 text-amber-600 hover:bg-amber-200/60 dark:text-amber-400 dark:hover:bg-amber-900/50"
                  onClick={() => setBannerDismissed(true)}
                >
                  <X className="size-3" />
                  <span className="sr-only">{t('alertBanner.dismiss')}</span>
                </Button>
              </Alert>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Widget Card */}
      <Card className="shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                'rounded-lg p-2 shadow-sm',
                hasCritical
                  ? 'bg-red-100 dark:bg-red-950/40'
                  : hasWarning
                    ? 'bg-amber-100 dark:bg-amber-950/40'
                    : 'bg-emerald-100 dark:bg-emerald-950/40'
              )}>
                {hasCritical ? (
                  <AlertOctagon className="size-5 text-red-600 dark:text-red-400" />
                ) : hasWarning ? (
                  <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div>
                <CardTitle className="text-base font-bold">{t('expirationCheck')}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('licensesChecked', { count: result.checked })}
                  {result.notificationsCreated > 0 && (
                    <span className="ms-1">
                      · <BellRing className="inline size-3 text-amber-500 -mt-0.5" />
                      {' '}{t('notificationsCreated', { count: result.notificationsCreated })}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckNow}
              disabled={checking}
              className={cn(
                'gap-1.5 font-medium transition-all duration-200 shrink-0',
                hasCritical
                  ? 'hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:border-red-700 dark:hover:text-red-400'
                  : 'hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-700 dark:hover:text-emerald-400'
              )}
            >
              <RefreshCw className={cn('size-3.5', checking && 'animate-spin')} />
              {t('checkNow')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.07, duration: 0.35, ease: 'easeOut' as const }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="group"
                >
                  <div
                    className={cn(
                      'relative overflow-hidden rounded-lg border p-3 md:p-4 transition-shadow duration-300 hover:shadow-lg',
                      item.borderColor, item.gradientBg, item.accentBorder
                    )}
                  >
                    {/* Subtle decorative glow */}
                    <div className="absolute -top-4 -end-4 size-12 rounded-full bg-white/20 dark:bg-white/5 blur-xl pointer-events-none" />
                    <div className="relative flex items-start justify-between">
                      <div className="space-y-1 min-w-0">
                        <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
                          {t(item.labelKey)}
                        </p>
                        <p className={cn('text-2xl md:text-3xl font-extrabold tracking-tight tabular-nums', item.countColor)}>
                          {item.count}
                        </p>
                      </div>
                      <div className={cn('rounded-lg p-1.5 md:p-2 shadow-sm transition-transform duration-200 group-hover:scale-110', item.bgColor)}>
                        <Icon className={cn('size-4 md:size-5', item.iconColor)} />
                      </div>
                    </div>
                    {/* Pulsing indicator for critical items */}
                    {item.count > 0 && (item.key === 'expired' || item.key === 'expiring5') && (
                      <span className="absolute top-2 end-2 flex size-1.5">
                        <span className={cn(
                          'animate-ping absolute inline-flex size-full rounded-full opacity-75',
                          item.key === 'expired' ? 'bg-red-400' : 'bg-orange-400'
                        )} />
                        <span className={cn(
                          'relative inline-flex rounded-full size-1.5',
                          item.key === 'expired' ? 'bg-red-500' : 'bg-orange-500'
                        )} />
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* All clear state */}
          {!hasIssues && result.checked > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 p-3"
            >
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                {t('allLicensesGoodStanding', { count: result.checked })}
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
