'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  CalendarClock,
  DollarSign,
  GraduationCap,
  ToggleLeft,
  ToggleRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ForecastItem {
  id: string;
  name: string;
  type: 'license' | 'insurance';
  licenseType?: string;
  state?: string | null;
  expirationDate: string;
  daysRemaining: number;
  status: string;
  riskScore: number;
  renewalFee: number;
  ceHoursNeeded: number;
}

interface ForecastPeriod {
  expiringItems: ForecastItem[];
  newItemsNeeded: number;
  estimatedCost: number;
  ceHoursNeeded: number;
}

interface WhatIfResult {
  skippedItem: { id: string; name: string; type: string };
  originalComplianceScore: number;
  newComplianceScore: number;
  complianceDelta: number;
  atRiskItems: Array<{ id: string; name: string; type: string; riskScore: number }>;
  financialExposure: number;
  impact: string;
}

interface ForecastData {
  forecast: {
    next30Days: ForecastPeriod;
    next60Days: ForecastPeriod;
    next90Days: ForecastPeriod;
  };
  riskScore: number;
  riskLevel: string;
  complianceScore: number;
  totalItems: number;
  activeItems: number;
  itemsNeedingAction: number;
  estimatedCostToMaintain: number;
  totalCeHoursNeeded: number;
  whatIf: WhatIfResult | null;
  allItems: Array<{
    id: string;
    name: string;
    type: 'license' | 'insurance';
    expirationDate: string;
    daysRemaining: number;
    riskScore: number;
    renewalFee: number;
  }>;
}

const PERIOD_CONFIG = {
  next30: {
    label: 'next30Days',
    accentBorder: 'border-s-red-400 dark:border-s-red-500',
    accentBg: 'bg-red-50/50 dark:bg-red-950/20',
    accentText: 'text-red-700 dark:text-red-400',
    dotColor: 'bg-red-500',
    icon: AlertOctagon,
    iconColor: 'text-red-500',
  },
  next60: {
    label: 'next60Days',
    accentBorder: 'border-s-amber-400 dark:border-s-amber-500',
    accentBg: 'bg-amber-50/50 dark:bg-amber-950/20',
    accentText: 'text-amber-700 dark:text-amber-400',
    dotColor: 'bg-amber-500',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
  },
  next90: {
    label: 'next90Days',
    accentBorder: 'border-s-teal-400 dark:border-s-teal-500',
    accentBg: 'bg-teal-50/50 dark:bg-teal-950/20',
    accentText: 'text-teal-700 dark:text-teal-400',
    dotColor: 'bg-teal-500',
    icon: Clock,
    iconColor: 'text-teal-500',
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ComplianceForecastWidget() {
  const t = useTranslations('dashboard');
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [whatIfEnabled, setWhatIfEnabled] = useState(false);
  const [selectedLicenseId, setSelectedLicenseId] = useState<string>('');
  const [whatIfData, setWhatIfData] = useState<WhatIfResult | null>(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);

  const fetchForecast = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/forecast');
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
    fetchForecast();
  }, [fetchForecast]);

  const handleWhatIfToggle = useCallback(async () => {
    if (!whatIfEnabled) {
      setWhatIfEnabled(true);
    } else {
      setWhatIfEnabled(false);
      setWhatIfData(null);
      setSelectedLicenseId('');
    }
  }, [whatIfEnabled]);

  const handleLicenseSelect = useCallback(async (licenseId: string) => {
    setSelectedLicenseId(licenseId);
    if (!licenseId) {
      setWhatIfData(null);
      return;
    }
    setWhatIfLoading(true);
    try {
      const res = await fetch(`/api/dashboard/forecast?scenario=skip_renewal&licenseId=${licenseId}`);
      if (!res.ok) throw new Error('Failed to fetch what-if');
      const json = await res.json();
      setWhatIfData(json.whatIf);
    } catch {
      setWhatIfData(null);
    } finally {
      setWhatIfLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const itemsNeedingAction = data.itemsNeedingAction;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-5 text-emerald-500" />
          <CardTitle>{t('complianceForecast')}</CardTitle>
        </div>
        <Badge variant="outline" className={`text-xs ${
          data.riskLevel === 'critical' ? 'border-red-300 dark:border-red-700 text-red-600 dark:text-red-400' :
          data.riskLevel === 'high' ? 'border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400' :
          data.riskLevel === 'moderate' ? 'border-yellow-300 dark:border-yellow-700 text-yellow-600 dark:text-yellow-400' :
          'border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
        }`}>
          {t(data.riskLevel === 'critical' ? 'critical' : data.riskLevel === 'high' ? 'highRisk' : data.riskLevel === 'moderate' ? 'moderateRisk' : 'lowRisk')}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">{t('riskScore')}</p>
            <p className={`text-xl font-bold mt-1 ${
              data.riskScore >= 75 ? 'text-red-600 dark:text-red-400' :
              data.riskScore >= 50 ? 'text-amber-600 dark:text-amber-400' :
              data.riskScore >= 25 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-emerald-600 dark:text-emerald-400'
            }`}>
              {data.riskScore}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">{t('next30Days')}</p>
            <p className="text-xl font-bold mt-1 text-red-600 dark:text-red-400">
              {data.forecast.next30Days.expiringItems.length}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">{t('estimatedCost')}</p>
            <p className="text-xl font-bold mt-1 text-foreground">
              ${data.estimatedCostToMaintain.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
              <GraduationCap className="size-3" /> {t('ceHoursLabel')}
            </p>
            <p className="text-xl font-bold mt-1 text-foreground">
              {data.totalCeHoursNeeded}
            </p>
          </div>
        </div>

        {/* Timeline View by Period */}
        <div className="space-y-4">
          {(['next30', 'next60', 'next90'] as const).map((periodKey) => {
            const period = periodKey === 'next30' ? data.forecast.next30Days
              : periodKey === 'next60' ? data.forecast.next60Days
              : data.forecast.next90Days;
            const config = PERIOD_CONFIG[periodKey];
            const Icon = config.icon;

            if (period.expiringItems.length === 0) return null;

            return (
              <motion.div
                key={periodKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg border-s-[3px] ${config.accentBorder} ${config.accentBg} p-4`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`size-4 ${config.iconColor}`} />
                    <span className={`text-sm font-semibold ${config.accentText}`}>
                      {t(config.label)}
                    </span>
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {period.expiringItems.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="size-3" />${period.estimatedCost.toLocaleString()}
                    </span>
                    {period.ceHoursNeeded > 0 && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="size-3" />{period.ceHoursNeeded}h
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {period.expiringItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-md bg-background/60 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={`size-2 rounded-full shrink-0 ${config.dotColor}`} />
                        <span className="text-sm font-medium text-foreground truncate">{item.name}</span>
                        <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">
                          {item.type === 'license' ? t('licenseLabel') : t('insuranceLabel')}
                        </Badge>
                        {item.state && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1 shrink-0">
                            {item.state}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ms-2">
                        <span className="text-xs text-muted-foreground">{formatDate(item.expirationDate)}</span>
                        <span className={`text-xs font-semibold ${
                          item.daysRemaining < 0 ? 'text-red-600 dark:text-red-400' :
                          item.daysRemaining < 30 ? 'text-red-600 dark:text-red-400' :
                          item.daysRemaining < 60 ? 'text-amber-600 dark:text-amber-400' :
                          'text-teal-600 dark:text-teal-400'
                        }`}>
                          {item.daysRemaining < 0
                            ? t('daysAgoShort', { count: Math.abs(item.daysRemaining) })
                            : t('daysRemainingShort', { count: item.daysRemaining })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* What-If Analysis */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{t('whatIfTitle')}</span>
            </div>
            <button
              onClick={handleWhatIfToggle}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {whatIfEnabled ? (
                <ToggleRight className="size-5 text-emerald-500" />
              ) : (
                <ToggleLeft className="size-5" />
              )}
              {t('skipRenewal')}
            </button>
          </div>

          <AnimatePresence>
            {whatIfEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-2">
                  <Select value={selectedLicenseId} onValueChange={handleLicenseSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('selectLicensePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {data.allItems.filter(i => i.type === 'license').map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({t('daysRemainingShort', { count: item.daysRemaining })})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {whatIfLoading && (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin size-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
                    </div>
                  )}

                  {whatIfData && !whatIfLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-2"
                    >
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        {t('impactOnCompliance')}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">{t('complianceLabel')}:</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="font-medium">{whatIfData.originalComplianceScore}%</span>
                            <TrendingDown className="size-3 text-red-500" />
                            <span className={`font-bold ${
                              whatIfData.complianceDelta < -10 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                            }`}>
                              {whatIfData.newComplianceScore}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('exposure')}:</span>
                          <p className="font-medium text-foreground">${whatIfData.financialExposure.toLocaleString()}</p>
                        </div>
                      </div>
                      {whatIfData.atRiskItems.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">{whatIfData.atRiskItems.length} at-risk item(s):</span>
                          <ul className="mt-1 space-y-0.5">
                            {whatIfData.atRiskItems.slice(0, 3).map(item => (
                              <li key={item.id} className="flex items-center gap-1">
                                <div className={`size-1.5 rounded-full ${
                                  item.riskScore >= 75 ? 'bg-red-500' : item.riskScore >= 50 ? 'bg-amber-500' : 'bg-yellow-500'
                                }`} />
                                {item.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

export function ComplianceForecastWidgetSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded" />
          <Skeleton className="h-6 w-48" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}
