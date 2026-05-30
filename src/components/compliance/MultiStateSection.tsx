'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MapPin,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  TrendingDown,
  Globe2,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';

interface MultiStateData {
  stateBreakdown: Array<{
    state: string;
    total: number;
    active: number;
    expiring: number;
    expired: number;
    score: number;
    licenses: Array<{
      id: string;
      name: string;
      type: string;
      licenseNumber: string;
      expirationDate: string;
      status: string;
      daysUntil: number;
    }>;
  }>;
  stateComparison: Array<{
    state: string;
    totalLicenses: number;
    active: number;
    expiring: number;
    expired: number;
    score: number;
    riskLevel: string;
  }>;
  summary: {
    totalStates: number;
    fullyCompliantStates: number;
    atRiskStates: number;
    criticalStatesCount: number;
    totalLicenses: number;
    totalInsurance: number;
    totalQualifiers: number;
  };
  expansionOpportunities: Array<{
    state: string;
    expiredCount: number;
    licenseTypes: string[];
  }>;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

function getRiskBadge(riskLevel: string, t: (key: string) => string) {
  switch (riskLevel) {
    case 'low':
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-[10px]">{t('lowRisk')}</Badge>;
    case 'medium':
      return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-[10px]">{t('mediumRisk')}</Badge>;
    case 'high':
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-[10px]">{t('highRisk')}</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px]">{riskLevel}</Badge>;
  }
}

function getScoreBadge(score: number) {
  if (score >= 80) return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-[10px]">{score}%</Badge>;
  if (score >= 50) return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-[10px]">{score}%</Badge>;
  return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-[10px]">{score}%</Badge>;
}

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
};

function getStateName(abbr: string): string {
  return STATE_NAMES[abbr] || abbr;
}

export default function MultiStateSection() {
  const t = useTranslations('compliance');
  const [data, setData] = useState<MultiStateData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/compliance/multi-state');
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-10 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (!data || data.summary.totalStates === 0) {
    return (
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-bold text-foreground mb-4">{t('multiStateTitle')}</h2>
        <Card className="border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/20 p-5 mb-4">
              <Globe2 className="size-10 text-emerald-400 dark:text-emerald-500" />
            </div>
            <p className="font-medium text-foreground">{t('noStateData')}</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">{t('noStateDataDesc')}</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const { summary, stateComparison, expansionOpportunities } = data;

  const summaryCards = [
    {
      label: t('totalStates'),
      value: summary.totalStates,
      icon: Globe2,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-900/30',
      borderAccent: 'border-s-teal-400 dark:border-s-teal-600',
    },
    {
      label: t('compliantStates'),
      value: summary.fullyCompliantStates,
      icon: ShieldCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
      borderAccent: 'border-s-emerald-400 dark:border-s-emerald-600',
    },
    {
      label: t('atRiskStates'),
      value: summary.atRiskStates,
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/30',
      borderAccent: 'border-s-amber-400 dark:border-s-amber-600',
    },
    {
      label: t('criticalStates'),
      value: summary.criticalStatesCount,
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/30',
      borderAccent: 'border-s-red-400 dark:border-s-red-600',
    },
  ];

  return (
    <motion.div variants={itemVariants} className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">{t('multiStateTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('multiStateSubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className={`border-s-4 ${card.borderAccent} shadow-sm hover:shadow-md transition-shadow duration-300`}>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1.5 rounded-lg ${card.bgColor}`}>
                    <Icon className={`size-4 ${card.color}`} />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">{card.label}</span>
                </div>
                <p className={`text-2xl lg:text-3xl font-extrabold tabular-nums ${card.color}`}>{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-5 text-emerald-500" />
            {t('stateColumn')} Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('stateColumn')}</TableHead>
                  <TableHead className="text-center">{t('licensesColumn')}</TableHead>
                  <TableHead className="text-center">{t('activeColumn')}</TableHead>
                  <TableHead className="text-center">{t('expiringColumn')}</TableHead>
                  <TableHead className="text-center">{t('expiredColumn')}</TableHead>
                  <TableHead className="text-center">{t('scoreColumn')}</TableHead>
                  <TableHead className="text-center">{t('riskColumn')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stateComparison.map((state) => (
                  <TableRow key={state.state} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        <span>{getStateName(state.state)}</span>
                        <span className="text-xs text-muted-foreground">({state.state})</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{state.totalLicenses}</TableCell>
                    <TableCell className="text-center text-emerald-600 dark:text-emerald-400">{state.active}</TableCell>
                    <TableCell className="text-center text-amber-600 dark:text-amber-400">{state.expiring}</TableCell>
                    <TableCell className="text-center text-red-600 dark:text-red-400">{state.expired}</TableCell>
                    <TableCell className="text-center">{getScoreBadge(state.score)}</TableCell>
                    <TableCell className="text-center">{getRiskBadge(state.riskLevel, t)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {expansionOpportunities.length > 0 && (
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-amber-200 dark:border-amber-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="size-5 text-amber-500" />
              {t('expansionOpportunities')}
            </CardTitle>
            <CardDescription>{t('expansionDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expansionOpportunities.map((opp) => (
                <div key={opp.state} className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <MapPin className="size-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{getStateName(opp.state)} ({opp.state})</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-muted-foreground">{opp.expiredCount} expired</span>
                        {opp.licenseTypes.map((type) => (
                          <Badge key={type} variant="outline" className="text-[9px] px-1 py-0 capitalize">{type}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30" asChild>
                    <Link href="/licenses">
                      {t('viewAll')}
                      <ChevronRight className="size-3 ms-1" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
