'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  ShieldAlert,
  Clock,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  BarChart3,
  ArrowDown,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ForecastWindow {
  days: number;
  date: string;
  licensesExpiring: Array<{
    id: string;
    name: string;
    type: string;
    state: string;
    expirationDate: string;
    daysUntil: number;
  }>;
  expiredCount: number;
  expiringCount: number;
  scoreIfNoRenewal: number;
  scoreIfRenewed: number;
  scoreDrop: number;
  insuranceExpiring: Array<{
    id: string;
    name: string;
    type: string;
    expirationDate: string;
    daysUntil: number;
  }>;
  ceGaps: Array<{
    id: string;
    courseName: string;
    hoursEarned: number;
    hoursRequired: number;
    deficit: number;
  }>;
  qualifiersAtRisk: Array<{
    id: string;
    name: string;
    riskType: string;
  }>;
}

interface WhatIfScenario {
  id: string;
  title: string;
  description: string;
  currentScore: number;
  projectedScore30: number;
  projectedScore60: number;
  projectedScore90: number;
  impact: number;
}

interface LicenseRiskScore {
  id: string;
  name: string;
  type: string;
  state: string;
  daysUntilExpiry: number;
  riskScore: number;
  riskLevel: string;
}

interface ForecastData {
  currentScore: number;
  trendDirection: string;
  forecastWindows: ForecastWindow[];
  licenseRiskScores: LicenseRiskScore[];
  whatIfScenarios: WhatIfScenario[];
  summary: {
    totalLicensesAtRisk: number;
    totalExpiredLicenses: number;
    totalInsuranceAtRisk: number;
    totalCeGaps: number;
    totalQualifiersAtRisk: number;
  };
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

function getRiskColor(level: string): string {
  switch (level) {
    case 'critical': return 'text-red-500';
    case 'high': return 'text-red-500';
    case 'medium': return 'text-amber-500';
    default: return 'text-emerald-500';
  }
}

function getRiskBg(level: string): string {
  switch (level) {
    case 'critical': return 'bg-red-50 dark:bg-red-950/30';
    case 'high': return 'bg-red-50 dark:bg-red-950/30';
    case 'medium': return 'bg-amber-50 dark:bg-amber-950/30';
    default: return 'bg-emerald-50 dark:bg-emerald-950/30';
  }
}

function getRiskBadge(level: string, t: (key: string) => string) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: t('criticalRisk') },
    high: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: t('highRisk') },
    medium: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: t('mediumRisk') },
    low: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: t('lowRisk') },
  };
  const c = config[level] || config.low;
  return <Badge className={`${c.bg} ${c.text} border-0 text-[10px]`}>{c.label}</Badge>;
}

export default function ForecastSection() {
  const t = useTranslations('compliance');
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/compliance/forecast');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <motion.div variants={itemVariants}>
        <div className="space-y-4">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (!data) return null;

  const { forecastWindows, whatIfScenarios, licenseRiskScores, summary, currentScore, trendDirection } = data;

  // Forecast window cards
  const windowCards = forecastWindows.map((window) => {
    const dayLabel = window.days === 30 ? t('day30') : window.days === 60 ? t('day60') : t('day90');
    const isCritical = window.scoreDrop > 20;
    const Icon = window.scoreDrop > 10 ? TrendingDown : window.scoreDrop > 0 ? Minus : TrendingUp;
    return (
      <Card key={window.days} className={`shadow-sm hover:shadow-md transition-shadow duration-300 border-s-4 ${
        isCritical
          ? 'border-s-red-400 dark:border-s-red-600'
          : window.scoreDrop > 10
            ? 'border-s-amber-400 dark:border-s-amber-600'
            : 'border-s-emerald-400 dark:border-s-emerald-600'
      }`}>
        <CardContent className="p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground">{dayLabel}</span>
            <Badge variant="outline" className="text-[10px]">
              {window.expiringCount + window.expiredCount} items
            </Badge>
          </div>

          {/* Score projection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('ifNoRenewal')}</span>
              <span className={`text-lg font-bold ${window.scoreIfNoRenewal >= 80 ? 'text-emerald-500' : window.scoreIfNoRenewal >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                {window.scoreIfNoRenewal}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('ifAllRenewed')}</span>
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{window.scoreIfRenewed}%</span>
            </div>
            {window.scoreDrop > 0 && (
              <div className="flex items-center gap-1 pt-1">
                <ArrowDown className="size-3 text-red-500" />
                <span className="text-xs text-red-500 font-medium">-{window.scoreDrop}%</span>
              </div>
            )}
          </div>

          {/* Expiring items count */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/50">
            <div className="text-center">
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{window.expiringCount}</p>
              <p className="text-[10px] text-muted-foreground">{t('licensesAtRisk')}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{window.insuranceExpiring.length}</p>
              <p className="text-[10px] text-muted-foreground">{t('insuranceAtRisk')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  });

  return (
    <motion.div variants={itemVariants} className="space-y-6">
      {/* Header with trend indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">{t('forecastTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('forecastSubtitle')}</p>
        </div>
        <Badge className={`${
          trendDirection === 'declining'
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        } border-0`}>
          {trendDirection === 'declining' ? <TrendingDown className="size-3 me-1" /> : <TrendingUp className="size-3 me-1" />}
          {trendDirection === 'declining' ? t('forecastDeclining') : t('forecastStable')}
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {[
          { label: t('licensesAtRisk'), value: summary.totalLicensesAtRisk, icon: ShieldAlert, color: 'text-amber-600 dark:text-amber-400' },
          { label: t('expiredLicenses'), value: summary.totalExpiredLicenses, icon: XCircle, color: 'text-red-600 dark:text-red-400' },
          { label: t('insuranceAtRisk'), value: summary.totalInsuranceAtRisk, icon: Shield, color: 'text-amber-600 dark:text-amber-400' },
          { label: t('ceGaps'), value: summary.totalCeGaps, icon: GraduationCap, color: 'text-teal-600 dark:text-teal-400' },
          { label: t('qualifiersAtRisk'), value: summary.totalQualifiersAtRisk, icon: CheckCircle2, color: 'text-red-600 dark:text-red-400' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="shadow-sm">
              <CardContent className="p-3 text-center">
                <Icon className={`size-5 mx-auto mb-1 ${stat.color}`} />
                <p className={`text-xl font-extrabold tabular-nums ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Forecast Windows */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {windowCards}
      </div>

      {/* What-If Scenarios */}
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="size-5 text-emerald-500" />
            {t('whatIfTitle')}
          </CardTitle>
          <CardDescription>{t('whatIfSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {whatIfScenarios.map((scenario) => (
              <div key={scenario.id} className={`p-4 rounded-xl border ${
                scenario.impact > 20
                  ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                  : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg ${
                    scenario.impact > 20 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'
                  }`}>
                    {scenario.impact > 20 ? <AlertTriangle className="size-4 text-red-600 dark:text-red-400" /> : <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{scenario.title}</p>
                    <p className="text-xs text-muted-foreground">{scenario.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Now</p>
                    <p className="text-sm font-bold">{scenario.currentScore}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">30d</p>
                    <p className={`text-sm font-bold ${scenario.projectedScore30 >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{scenario.projectedScore30}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">60d</p>
                    <p className={`text-sm font-bold ${scenario.projectedScore60 >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{scenario.projectedScore60}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">90d</p>
                    <p className={`text-sm font-bold ${scenario.projectedScore90 >= 80 ? 'text-emerald-600' : scenario.projectedScore90 >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{scenario.projectedScore90}%</p>
                  </div>
                </div>

                {scenario.impact > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('scoreDrop')}</span>
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-[10px]">
                        -{scenario.impact}%
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* License Risk Analysis */}
      {licenseRiskScores.length > 0 && (
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-5 text-amber-500" />
              {t('riskAnalysisTitle')}
            </CardTitle>
            <CardDescription>{t('riskAnalysisSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-72">
              <div className="divide-y divide-border/50">
                {licenseRiskScores.slice(0, 10).map((license, idx) => (
                  <motion.div
                    key={license.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 p-3 md:p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className={`shrink-0 rounded-lg p-2 ${getRiskBg(license.riskLevel)}`}>
                      <ShieldAlert className={`size-4 ${getRiskColor(license.riskLevel)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{license.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[9px] px-1 py-0 capitalize">{license.type}</Badge>
                        {license.state && (
                          <span className="text-[10px] text-muted-foreground">{license.state}</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-end">
                      <div className="flex items-center gap-2">
                        {getRiskBadge(license.riskLevel, t)}
                        <span className={`text-sm font-bold ${getRiskColor(license.riskLevel)}`}>{license.riskScore}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {license.daysUntilExpiry < 0 ? `${Math.abs(license.daysUntilExpiry)}d overdue` : `${license.daysUntilExpiry}d left`}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
