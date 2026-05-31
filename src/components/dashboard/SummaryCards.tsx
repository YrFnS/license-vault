'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface SummaryCardsProps {
  total: number;
  active: number;
  expiring: number;
  expired: number;
}

export function SummaryCards({ total, active, expiring, expired }: SummaryCardsProps) {
  const t = useTranslations('dashboard.summary');

  const cards = [
    { key: 'total' as const, label: t('total'), count: total, icon: FileText, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-l-2 border-l-slate-400' },
    { key: 'active' as const, label: t('active'), count: active, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-l-2 border-l-emerald-500' },
    { key: 'expiring' as const, label: t('expiring'), count: expiring, icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-l-2 border-l-amber-500' },
    { key: 'expired' as const, label: t('expired'), count: expired, icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-l-2 border-l-red-500' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.key} className={card.border}>
            <CardContent className="p-3 md:p-4 flex items-center gap-3">
              <div className={`rounded-lg p-2 shrink-0 ${card.bg}`}>
                <Icon className={`size-4 md:size-5 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{card.label}</p>
                <p className="text-xl md:text-2xl font-bold tabular-nums text-foreground">{card.count}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
