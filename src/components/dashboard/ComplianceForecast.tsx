'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Clock,
  AlertOctagon,
  AlertTriangle,
  Info,
  ShieldCheck,
  CalendarClock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';

export interface ForecastLicense {
  id: string;
  name: string;
  expirationDate: string;
  status: 'active' | 'expiring_soon' | 'expired';
}

interface ComplianceForecastProps {
  licenses: ForecastLicense[];
  totalLicenses: number;
  activeLicenses: number;
}

type UrgencyLevel = 'expired' | 'critical' | 'warning' | 'caution' | 'safe';

function getUrgencyLevel(daysRemaining: number): UrgencyLevel {
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining < 5) return 'critical';
  if (daysRemaining < 30) return 'warning';
  if (daysRemaining < 60) return 'caution';
  return 'safe';
}

const URGENCY_CONFIG: Record<UrgencyLevel, {
  icon: typeof AlertOctagon;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  lineColor: string;
}> = {
  expired: {
    icon: AlertOctagon,
    iconColor: 'text-red-600 dark:text-red-400',
    badgeBg: 'bg-red-100 dark:bg-red-950/40',
    badgeText: 'text-red-700 dark:text-red-300',
    badgeBorder: 'border-red-200 dark:border-red-800',
    dotColor: 'bg-red-500',
    lineColor: 'from-red-500 via-red-400 to-red-300',
  },
  critical: {
    icon: AlertOctagon,
    iconColor: 'text-red-600 dark:text-red-400',
    badgeBg: 'bg-red-100 dark:bg-red-950/40',
    badgeText: 'text-red-700 dark:text-red-300',
    badgeBorder: 'border-red-200 dark:border-red-800',
    dotColor: 'bg-red-500',
    lineColor: 'from-red-500 via-red-400 to-red-300',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    dotColor: 'bg-amber-500',
    lineColor: 'from-amber-500 via-amber-400 to-amber-300',
  },
  caution: {
    icon: Info,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    badgeBg: 'bg-yellow-100 dark:bg-yellow-950/40',
    badgeText: 'text-yellow-700 dark:text-yellow-300',
    badgeBorder: 'border-yellow-200 dark:border-yellow-800',
    dotColor: 'bg-yellow-500',
    lineColor: 'from-yellow-500 via-yellow-400 to-yellow-300',
  },
  safe: {
    icon: ShieldCheck,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
    lineColor: 'from-emerald-500 via-emerald-400 to-emerald-300',
  },
};

function getDaysRemaining(expirationDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expirationDate);
  exp.setHours(0, 0, 0, 0);
  const diffMs = exp.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

export function ComplianceForecast({ licenses, totalLicenses, activeLicenses }: ComplianceForecastProps) {
  const t = useTranslations('dashboard');

  // Sort by soonest expiration first, then compute urgency
  const sortedLicenses = [...licenses]
    .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
    .slice(0, 5);

  // Compliance percentage for progress bar
  const compliancePercent = totalLicenses > 0
    ? Math.round((activeLicenses / totalLicenses) * 100)
    : 100;

  // Empty state
  if (sortedLicenses.length === 0) {
    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-5 text-emerald-500" />
            <CardTitle>{t('complianceForecast')}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-xs text-muted-foreground hover:text-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors duration-200"
          >
            <Link href="/licenses">
              {t('viewAll')}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative flex flex-col items-center justify-center py-12 text-center overflow-hidden rounded-lg">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10" />
            <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/20 p-5 mb-4 shadow-sm">
                <ShieldCheck className="size-10 text-emerald-400 dark:text-emerald-500" />
              </div>
              <p className="font-semibold text-foreground">{t('noUpcomingDeadlines')}</p>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
                {t('noUpcomingDeadlinesDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-5 text-emerald-500" />
          <CardTitle>{t('complianceForecast')}</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs text-muted-foreground hover:text-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors duration-200"
        >
          <Link href="/licenses">
            {t('viewAll')}
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Compliance progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">{t('upcomingDeadlines')}</span>
            <span className="font-bold text-foreground tabular-nums">
              {compliancePercent}%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted/60 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${compliancePercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' as const, delay: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/30"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {activeLicenses} / {totalLicenses} {t('activeLicenses').toLowerCase()}
          </p>
        </div>

        {/* Timeline of upcoming deadlines */}
        <ScrollArea className="max-h-96">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative ps-6"
          >
            {/* Vertical timeline line */}
            <div className="absolute start-2.5 top-2 bottom-2 w-px bg-gradient-to-b from-border via-border/60 to-transparent" />

            {sortedLicenses.map((license, index) => {
              const daysRemaining = getDaysRemaining(license.expirationDate);
              const urgency = getUrgencyLevel(daysRemaining);
              const config = URGENCY_CONFIG[urgency];
              const Icon = config.icon;
              const isLast = index === sortedLicenses.length - 1;

              // Status label key
              const statusLabel = urgency === 'expired'
                ? t('expired')
                : urgency === 'critical'
                  ? t('critical')
                  : urgency === 'warning'
                    ? t('warning')
                    : urgency === 'caution'
                      ? t('caution')
                      : t('safe');

              return (
                <motion.div
                  key={license.id}
                  variants={itemVariants}
                  className={`relative pb-5 rounded-lg transition-colors duration-150 hover:bg-muted/30 ${isLast ? 'pb-0' : ''}`}
                >
                  {/* Timeline dot */}
                  <div className={`absolute -start-6 top-1.5 size-3.5 rounded-full ${config.dotColor} ring-2 ring-background shadow-sm`} />

                  {/* Content */}
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 rounded-lg p-1.5 ${config.badgeBg}`}>
                      <Icon className={`size-3.5 ${config.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground leading-snug truncate">
                          {license.name}
                        </p>
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-[10px] px-1.5 py-0 h-5 font-semibold border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
                        >
                          {statusLabel}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <Clock className="size-2.5" />
                          {formatDate(license.expirationDate)}
                        </span>
                        <span className="text-xs text-muted-foreground/40">·</span>
                        <span className={`text-xs font-semibold ${
                          daysRemaining < 0
                            ? 'text-red-600 dark:text-red-400'
                            : daysRemaining < 5
                              ? 'text-red-600 dark:text-red-400'
                              : daysRemaining < 30
                                ? 'text-amber-600 dark:text-amber-400'
                                : daysRemaining < 60
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {daysRemaining < 0
                            ? t('daysAgo', { count: Math.abs(daysRemaining) })
                            : `${daysRemaining} ${t('daysRemaining')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Loading skeleton for the compliance forecast
export function ComplianceForecastSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-7 w-20" />
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Progress bar skeleton */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        {/* Timeline skeleton */}
        <div className="relative ps-6 space-y-5">
          <div className="absolute start-2.5 top-2 bottom-2 w-px bg-border" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="relative flex items-start gap-3">
              <div className="absolute -start-6 top-1.5 size-3 rounded-full bg-muted-foreground/20 ring-2 ring-background" />
              <Skeleton className="shrink-0 size-7 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-4 w-full max-w-[160px]" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
