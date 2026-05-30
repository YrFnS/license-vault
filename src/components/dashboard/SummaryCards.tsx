'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle2, AlertTriangle, XCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  total: number;
  active: number;
  expiring: number;
  expired: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  }),
};

// Simple sparkline data based on counts
function MiniSparkline({ type, total }: { type: 'active' | 'expiring' | 'expired' | 'total'; total: number }) {
  // Generate pseudo-random but deterministic bar heights based on type
  const bars = {
    active: [40, 55, 45, 65, 70, 60, 80],
    expiring: [30, 25, 40, 35, 20, 30, 25],
    expired: [15, 20, 10, 25, 15, 10, 20],
    total: [50, 60, 55, 70, 75, 80, 85],
  };

  const heights = bars[type];
  const colors = {
    active: 'bg-emerald-400 dark:bg-emerald-500',
    expiring: 'bg-amber-400 dark:bg-amber-500',
    expired: 'bg-red-400 dark:bg-red-500',
    total: 'bg-teal-400 dark:bg-teal-500',
  };

  if (total === 0) return null;

  return (
    <div className="flex items-end gap-0.5 h-6 mt-2">
      {heights.map((h, i) => (
        <div
          key={i}
          className={cn('w-1 rounded-t-sm', colors[type])}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export function SummaryCards({ total, active, expiring, expired }: SummaryCardsProps) {
  const t = useTranslations('dashboard.summary');

  const cards = [
    {
      key: 'total' as const,
      label: t('total'),
      count: total,
      icon: FileText,
      iconColor: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-950/30',
      borderColor: 'border-teal-200 dark:border-teal-800',
      gradientBg: 'bg-gradient-to-br from-teal-50/95 via-teal-50/70 to-teal-100/50 dark:from-teal-950/50 dark:via-teal-950/30 dark:to-teal-900/15',
      accentBorder: 'border-s-[5px] border-s-teal-400 dark:border-s-teal-600',
      topAccent: 'border-t-[3px] border-t-teal-400 dark:border-t-teal-600',
      trend: 'neutral' as const,
    },
    {
      key: 'active' as const,
      label: t('active'),
      count: active,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      gradientBg: 'bg-gradient-to-br from-emerald-50/95 via-emerald-50/70 to-emerald-100/50 dark:from-emerald-950/50 dark:via-emerald-950/30 dark:to-emerald-900/15',
      accentBorder: 'border-s-[5px] border-s-emerald-400 dark:border-s-emerald-600',
      topAccent: 'border-t-[3px] border-t-emerald-400 dark:border-t-emerald-600',
      trend: 'up' as const,
    },
    {
      key: 'expiring' as const,
      label: t('expiring'),
      count: expiring,
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-800',
      gradientBg: 'bg-gradient-to-br from-amber-50/95 via-amber-50/70 to-amber-100/50 dark:from-amber-950/50 dark:via-amber-950/30 dark:to-amber-900/15',
      accentBorder: 'border-s-[5px] border-s-amber-400 dark:border-s-amber-600',
      topAccent: 'border-t-[3px] border-t-amber-400 dark:border-t-amber-600',
      trend: 'down' as const,
    },
    {
      key: 'expired' as const,
      label: t('expired'),
      count: expired,
      icon: XCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      borderColor: 'border-red-200 dark:border-red-800',
      gradientBg: 'bg-gradient-to-br from-red-50/95 via-red-50/70 to-red-100/50 dark:from-red-950/50 dark:via-red-950/30 dark:to-red-900/15',
      accentBorder: 'border-s-[5px] border-s-red-400 dark:border-s-red-600',
      topAccent: 'border-t-[3px] border-t-red-400 dark:border-t-red-600',
      trend: 'down' as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:gap-4 lg:grid-cols-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const TrendIcon = card.trend === 'up' ? TrendingUp : card.trend === 'down' ? TrendingDown : Minus;
        const trendColor = card.trend === 'up' ? 'text-emerald-500' : card.trend === 'down' ? 'text-red-500' : 'text-muted-foreground';
        return (
          <motion.div
            key={card.key}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="group"
          >
            <Card className={cn(
              'relative overflow-hidden border shadow-md hover:shadow-xl transition-all duration-300',
              card.borderColor, card.gradientBg, card.accentBorder, card.topAccent
            )}>
              {/* Inner gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/[0.03] dark:via-transparent dark:to-transparent pointer-events-none" />
              {/* Decorative glow */}
              <div className="absolute -top-6 -end-6 size-16 rounded-full bg-white/20 dark:bg-white/5 blur-xl" />
              <CardContent className="relative p-3 md:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {card.label}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl lg:text-4xl font-extrabold tracking-tight tabular-nums" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                        {card.count}
                      </p>
                      {total > 0 && card.key !== 'total' && (
                        <div className="flex items-center gap-1 shrink-0">
                          <TrendIcon className={cn('size-3', trendColor)} />
                          <span className="text-xs font-semibold text-muted-foreground">
                            {Math.round((card.count / total) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    'rounded-xl p-2 lg:p-3 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md',
                    card.bgColor
                  )}>
                    <Icon className={cn('size-5 lg:size-6', card.iconColor)} />
                  </div>
                </div>
                {/* Mini sparkline chart - hidden on mobile */}
                <div className="hidden lg:block">
                  <MiniSparkline type={card.key} total={total} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
