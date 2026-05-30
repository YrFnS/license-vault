'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  MapPin,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  FileCheck,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface StateLicense {
  id: string;
  name: string;
  type: string;
  expirationDate: string;
  status: 'active' | 'expiring_soon' | 'expired';
}

interface StateCompliance {
  state: string;
  isPrimary: boolean;
  totalLicenses: number;
  activeLicenses: number;
  expiringLicenses: number;
  expiredLicenses: number;
  complianceScore: number;
  requirements: number;
  missingLicenseTypes: string[];
  ceHoursCompleted: number;
  ceHoursRequired: number;
  bondRequired: boolean;
  insuranceRequired: boolean;
  hasBond: boolean;
  hasInsurance: boolean;
  licenses: StateLicense[];
}

interface MultiStateData {
  primaryState: string;
  totalStates: number;
  overallScore: number;
  stateCompliance: StateCompliance[];
  complianceGaps: { state: string; licenseType: string }[];
}

function getScoreColor(score: number) {
  if (score >= 80) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40', border: 'border-emerald-200 dark:border-emerald-800', progress: 'bg-emerald-500' };
  if (score >= 60) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40', border: 'border-amber-200 dark:border-amber-800', progress: 'bg-amber-500' };
  return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40', border: 'border-red-200 dark:border-red-800', progress: 'bg-red-500' };
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function MultiStateCompliance() {
  const t = useTranslations('multiState');
  const tSr = useTranslations('stateRequirements');
  const [data, setData] = useState<MultiStateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedState, setExpandedState] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/multi-state-compliance');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
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
    return <MultiStateComplianceSkeleton />;
  }

  if (!data || data.stateCompliance.length === 0) {
    return null; // Don't show if no multi-state data
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40 shrink-0 shadow-sm">
            <MapPin className="size-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{t('title')}</h2>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 border-teal-200 dark:border-teal-800">
            {data.totalStates} {data.totalStates === 1 ? t('state') : t('states')}
          </Badge>
          <Button variant="outline" size="sm" asChild className="hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 dark:hover:bg-teal-950/30 transition-colors duration-200">
            <Link href="/state-requirements">
              {t('viewRequirements')}
              <ArrowRight className="size-3.5 ms-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      <Card className="border-s-4 border-s-teal-400 dark:border-s-teal-600 bg-gradient-to-r from-teal-50/80 via-emerald-50/50 to-teal-50/30 dark:from-teal-950/30 dark:via-emerald-950/20 dark:to-teal-950/10 shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <svg width="80" height="80" className="transform -rotate-90">
                <circle cx="40" cy="40" r="32" fill="none" strokeWidth="6" className="stroke-teal-200 dark:stroke-teal-900" />
                <defs>
                  <linearGradient id="multi-state-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
                <circle
                  cx="40" cy="40" r="32" fill="none" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 32}
                  strokeDashoffset={2 * Math.PI * 32 - (data.overallScore / 100) * 2 * Math.PI * 32}
                  stroke="url(#multi-state-gradient)"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-extrabold text-teal-600 dark:text-teal-400">{data.overallScore}%</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{t('overallScore')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('overallScoreDesc')}</p>
              {data.complianceGaps.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {data.complianceGaps.length} {t('gapsFound')}
                  </span>
                </div>
              )}
              {data.complianceGaps.length === 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t('allCompliant')}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* State Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {data.stateCompliance.map((sc) => {
          const colors = getScoreColor(sc.complianceScore);
          const isExpanded = expandedState === sc.state;

          return (
            <motion.div key={sc.state} variants={itemVariants}>
              <Card className={`shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
                sc.isPrimary ? 'border-emerald-200 dark:border-emerald-800/60' : ''
              }`}>
                <CardContent className="p-0">
                  {/* Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/30 transition-colors duration-150"
                    onClick={() => setExpandedState(isExpanded ? null : sc.state)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs font-bold">
                          {sc.state}
                        </Badge>
                        {sc.isPrimary && (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5">
                            {t('primary')}
                          </Badge>
                        )}
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </motion.div>
                    </div>

                    {/* Score bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('compliance')}</span>
                        <span className={`text-sm font-bold ${colors.text}`}>{sc.complianceScore}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${sc.complianceScore}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                          className={`h-full rounded-full ${colors.progress}`}
                        />
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="size-3 text-emerald-500" />
                        {sc.activeLicenses}/{sc.totalLicenses}
                      </span>
                      {sc.expiringLicenses > 0 && (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Clock className="size-3" />
                          {sc.expiringLicenses}
                        </span>
                      )}
                      {sc.expiredLicenses > 0 && (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <XCircle className="size-3" />
                          {sc.expiredLicenses}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-t"
                      >
                        <div className="p-4 space-y-3 bg-muted/10">
                          {/* Requirements */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">{t('requirements')}</span>
                            <Badge variant="outline" className="text-xs">{sc.requirements}</Badge>
                          </div>

                          {/* CE Hours */}
                          {sc.ceHoursRequired > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <FileCheck className="size-3" />
                                  CE Hours
                                </span>
                                <span className="font-medium">
                                  <span className={sc.ceHoursCompleted >= sc.ceHoursRequired ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                                    {sc.ceHoursCompleted}
                                  </span>
                                  /{sc.ceHoursRequired}
                                </span>
                              </div>
                              <Progress 
                                value={sc.ceHoursRequired > 0 ? Math.min((sc.ceHoursCompleted / sc.ceHoursRequired) * 100, 100) : 0}
                                className="h-1.5"
                              />
                            </div>
                          )}

                          {/* Bond/Insurance Status */}
                          <div className="flex gap-2">
                            {sc.bondRequired && (
                              <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md ${
                                sc.hasBond 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                              }`}>
                                {sc.hasBond ? <CheckCircle2 className="size-2.5" /> : <XCircle className="size-2.5" />}
                                {tSr('bondRequired')}
                              </div>
                            )}
                            {sc.insuranceRequired && (
                              <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md ${
                                sc.hasInsurance 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                              }`}>
                                {sc.hasInsurance ? <CheckCircle2 className="size-2.5" /> : <XCircle className="size-2.5" />}
                                {tSr('insuranceRequired')}
                              </div>
                            )}
                          </div>

                          {/* Missing Licenses */}
                          {sc.missingLicenseTypes.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{t('missingLicenses')}</span>
                              <div className="flex flex-wrap gap-1">
                                {sc.missingLicenseTypes.map((lt) => (
                                  <Badge key={lt} variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                                    {tSr(`licenseTypes.${lt}` as any) !== `licenseTypes.${lt}` ? tSr(`licenseTypes.${lt}` as any) : lt}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* License List */}
                          {sc.licenses.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-xs font-medium text-muted-foreground">{t('licenses')}</span>
                              <ScrollArea className="max-h-32">
                                <div className="space-y-1">
                                  {sc.licenses.map(lic => (
                                    <div key={lic.id} className="flex items-center justify-between text-xs py-1">
                                      <span className="truncate me-2">{lic.name}</span>
                                      <Badge variant="outline" className={`text-[9px] px-1 py-0 shrink-0 ${
                                        lic.status === 'active' 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                                          : lic.status === 'expiring_soon'
                                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                                            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
                                      }`}>
                                        {lic.status === 'active' ? tSr('notRequired').replace('Not Required', 'Active') : lic.status === 'expiring_soon' ? 'Expiring' : 'Expired'}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Compliance Gaps Summary */}
      {data.complianceGaps.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800/50 bg-gradient-to-r from-amber-50/60 via-amber-50/30 to-transparent dark:from-amber-950/20 dark:via-amber-950/10 dark:to-transparent shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="size-4 text-amber-500" />
              <h3 className="text-sm font-semibold">{t('complianceGaps')}</h3>
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-xs">
                {data.complianceGaps.length}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.complianceGaps.map((gap, i) => (
                <div key={i} className="inline-flex items-center gap-1.5 text-xs bg-white/80 dark:bg-background/50 border border-amber-200/60 dark:border-amber-800/40 rounded-lg px-2.5 py-1.5">
                  <Badge variant="outline" className="font-mono text-[10px] px-1 py-0">{gap.state}</Badge>
                  <span className="text-muted-foreground">
                    {tSr(`licenseTypes.${gap.licenseType}` as any) !== `licenseTypes.${gap.licenseType}` 
                      ? tSr(`licenseTypes.${gap.licenseType}` as any) 
                      : gap.licenseType}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function MultiStateComplianceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Skeleton className="size-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-5" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
