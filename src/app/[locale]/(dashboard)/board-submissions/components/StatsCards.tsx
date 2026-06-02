'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Send, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Send,
  Clock,
  CheckCircle2,
  XCircle,
};

interface StatCard {
  label: string;
  value: number;
  icon: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
  borderAccent: string;
}

interface StatsCardsProps {
  statCards: StatCard[];
}

export function StatsCards({ statCards }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card) => {
        const Icon = iconMap[card.icon];
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={cn('bg-gradient-to-br border-s-4 shadow-sm hover:shadow-md transition-shadow', card.gradient, card.borderAccent)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{card.label}</p>
                    <p className="text-2xl md:text-3xl font-extrabold tabular-nums mt-1">{card.value}</p>
                  </div>
                  <div className={cn('size-10 rounded-xl flex items-center justify-center', card.iconBg)}>
                    {Icon && <Icon className={cn('size-5', card.iconColor)} />}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
