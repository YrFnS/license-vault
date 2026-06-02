'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, TrendingUp, AlertTriangle, Flag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

interface StatsCardsProps {
  stats: { totalVendors: number; avgScore: number; highRiskCount: number; flaggedCount: number };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const t = useTranslations('vendorScores');

  const items = [
    { label: t('totalVendors'), value: stats.totalVendors, icon: ShieldCheck, color: '#14b8a6' },
    { label: t('avgScore'), value: Math.round(stats.avgScore), icon: TrendingUp, color: '#10b981' },
    { label: t('highRisk'), value: stats.highRiskCount, icon: AlertTriangle, color: '#f59e0b' },
    { label: t('flagged'), value: stats.flaggedCount, icon: Flag, color: '#ef4444' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((stat) => (
        <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-s-4 shadow-sm hover:shadow-md transition-shadow" style={{ borderInlineStartColor: stat.color }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-extrabold tabular-nums mt-1">{stat.value}</p>
                </div>
                <div className={`size-10 rounded-xl flex items-center justify-center`}
                  style={{ backgroundColor: stat.color + '1a' }}>
                  <stat.icon className="size-5" style={{ color: stat.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
