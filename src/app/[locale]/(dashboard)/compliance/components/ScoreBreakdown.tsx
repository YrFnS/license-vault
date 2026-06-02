'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, GraduationCap, FileText } from 'lucide-react';
import type { ComplianceData } from './types';
import { itemVariants, cardHover } from './constants';
import { getScoreColor } from './helpers';

interface ScoreBreakdownProps {
  breakdown: ComplianceData['breakdown'];
}

export default function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const t = useTranslations('compliance');

  const cards = [
    {
      key: 'license',
      label: t('licenseCompliance'),
      desc: t('licenseComplianceDesc'),
      score: breakdown.license.score,
      icon: Shield,
      detail: `${breakdown.license.active}/${breakdown.license.total}`,
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      progressColor: '[&>div]:bg-emerald-500',
      borderAccent: 'border-s-emerald-400 dark:border-s-emerald-600',
    },
    {
      key: 'insurance',
      label: t('insuranceCoverage'),
      desc: t('insuranceCoverageDesc'),
      score: breakdown.insurance.score,
      icon: ShieldAlert,
      detail: `${breakdown.insurance.active}/${breakdown.insurance.total}`,
      bgColor: 'bg-teal-50 dark:bg-teal-950/30',
      iconColor: 'text-teal-600 dark:text-teal-400',
      progressColor: '[&>div]:bg-teal-500',
      borderAccent: 'border-s-teal-400 dark:border-s-teal-600',
    },
    {
      key: 'ce',
      label: t('ceRequirements'),
      desc: t('ceRequirementsDesc'),
      score: breakdown.ce.score,
      icon: GraduationCap,
      detail: `${breakdown.ce.completed || 0}/${breakdown.ce.total}h`,
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      progressColor: '[&>div]:bg-amber-500',
      borderAccent: 'border-s-amber-400 dark:border-s-amber-600',
    },
    {
      key: 'documents',
      label: t('documentCompleteness'),
      desc: t('documentCompletenessDesc'),
      score: breakdown.documents.score,
      icon: FileText,
      detail: `${breakdown.documents.uploaded || 0}/${breakdown.documents.total}`,
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      progressColor: '[&>div]:bg-emerald-500',
      borderAccent: 'border-s-emerald-400 dark:border-s-emerald-600',
    },
  ];

  return (
    <motion.div variants={itemVariants}>
      <h2 className="text-lg font-bold text-foreground mb-4">{t('breakdownTitle')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.key} whileHover={cardHover}>
              <Card className={`relative overflow-hidden border-s-4 ${card.borderAccent} shadow-sm hover:shadow-md transition-all duration-300`}>
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 rounded-xl p-2.5 ${card.bgColor}`}>
                      <Icon className={`size-5 ${card.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{card.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
                      <div className="flex items-end justify-between mt-3">
                        <div>
                          <span className={`text-2xl font-extrabold ${getScoreColor(card.score)}`}>{card.score}%</span>
                          <span className="text-xs text-muted-foreground ms-2">{card.detail}</span>
                        </div>
                      </div>
                      <Progress value={card.score} className={`mt-2 h-2 ${card.progressColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
