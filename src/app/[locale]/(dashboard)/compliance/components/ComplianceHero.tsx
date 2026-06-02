'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { itemVariants } from './constants';
import {
  getScoreColor,
  getScoreLabel,
  getScoreBorderColor,
  getScoreBgGradient,
  getScoreTrackColor,
  getScoreStrokeGradient,
  getScoreColorValue,
} from './helpers';

interface ComplianceHeroProps {
  score: number;
  trend: string;
  trendDelta: number;
}

export default function ComplianceHero({ score, trend, trendDelta }: ComplianceHeroProps) {
  const t = useTranslations('compliance');
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <motion.div variants={itemVariants}>
      <Card className={`relative overflow-hidden border-2 ${getScoreBorderColor(score)} bg-gradient-to-br ${getScoreBgGradient(score)} shadow-lg`}>
        <div className="absolute -top-20 -end-20 size-56 rounded-full bg-gradient-to-br from-emerald-200/30 to-teal-200/20 dark:from-emerald-800/20 dark:to-teal-800/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -start-16 size-44 rounded-full bg-gradient-to-br from-teal-200/30 to-emerald-200/20 dark:from-teal-800/10 dark:to-emerald-800/20 blur-3xl pointer-events-none" />

        <CardContent className="relative p-6 md:p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative shrink-0">
            <svg width="180" height="180" className="transform -rotate-90">
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={getScoreStrokeGradient(score)} />
                  <stop offset="100%" stopColor={score >= 80 ? '#14b8a6' : score >= 60 ? '#f97316' : '#f43f5e'} />
                </linearGradient>
              </defs>
              <circle cx="90" cy="90" r={radius} fill="none" strokeWidth="10" className={getScoreTrackColor(score)} />
              <circle
                cx="90" cy="90" r={radius} fill="none" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                stroke="url(#scoreGradient)" className="transition-all duration-1000 ease-out"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5, type: 'spring' as const }}
                className={`text-5xl font-extrabold ${getScoreColor(score)}`}
              >
                {score}%
              </motion.span>
              <span className="text-xs font-medium text-muted-foreground mt-1">{t('overallScore')}</span>
            </div>
          </div>

          <div className="flex-1 min-w-0 text-center md:text-start">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-emerald-600 dark:to-emerald-400 bg-clip-text text-transparent">
              {t('scoreTitle')}
            </h1>
            <p className="text-muted-foreground/80 mt-1.5 text-sm md:text-base">{t('scoreSubtitle')}</p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
              <Badge
                className={`px-3 py-1 text-sm font-semibold ${getScoreColor(score)} bg-opacity-10 border-0`}
                style={{ backgroundColor: getScoreColorValue(score) }}
              >
                {score >= 80 ? <ShieldCheck className="size-4 me-1" /> : <ShieldAlert className="size-4 me-1" />}
                {getScoreLabel(score, t)}
              </Badge>
              {trendDelta > 0 && (
                <Badge variant="outline" className="gap-1 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
                  {trend === 'up' ? <TrendingUp className="size-3" /> : trend === 'down' ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
                  {trend === 'up' ? t('trendUp') : trend === 'down' ? t('trendDown') : t('trendSame')} ({trendDelta > 0 ? '+' : ''}{trendDelta}%)
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
