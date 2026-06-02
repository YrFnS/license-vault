'use client';

import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { SummaryCard } from './types';
import { containerVariants, itemVariants, getCardGradient, getCardBorder, getCardIconBg } from './constants';

interface SummaryCardsProps {
  cards: SummaryCard[];
}

export function SummaryCards({ cards }: SummaryCardsProps) {
  const t = useTranslations('ceTracking');

  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div key={card.key} variants={itemVariants}>
            <Card className={`relative overflow-hidden border-s-4 ${getCardBorder(card.color)} shadow-sm hover:shadow-md transition-shadow duration-300`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${getCardGradient(card.color)}`} />
              <CardContent className="relative p-4 lg:p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{t(card.key)}</span>
                  <div className={`rounded-xl p-2 shadow-sm ${getCardIconBg(card.color)}`}>
                    <Icon className="size-4" />
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-extrabold tabular-nums">{card.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
