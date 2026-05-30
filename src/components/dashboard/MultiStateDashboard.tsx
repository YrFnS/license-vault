'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, ChevronUp, MapPin, Shield, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StateData {
  state: string;
  stateName: string;
  total: number;
  active: number;
  expiring: number;
  expired: number;
  complianceRate: number;
  nextExpiration: string | null;
}

interface MultiStateData {
  states: StateData[];
  overallMultiStateCoverage: number;
  totalStatesWithLicenses: number;
}

// Grid-based US cartogram layout
// Each row represents a horizontal band, columns roughly approximate US geography
const US_CARTOGRAM: string[][] = [
  ['', '', '', '', '', '', '', '', '', '', '', 'ME'],
  ['', '', '', '', '', '', '', '', '', '', 'VT', 'NH'],
  ['', '', '', '', '', 'WA', '', '', 'NY', 'MA', '', 'RI'],
  ['', '', '', '', 'MT', 'ID', 'OR', 'WI', 'CT', '', '', ''],
  ['', '', '', 'ND', 'SD', 'WY', 'NV', 'MI', 'NJ', 'DE', '', ''],
  ['', '', 'MN', '', 'NE', 'CO', 'UT', 'IN', 'OH', 'PA', 'MD', 'DC'],
  ['', '', 'IA', 'KS', 'OK', 'NM', 'AZ', 'IL', 'WV', 'VA', '', ''],
  ['', 'MO', 'AR', '', '', '', '', 'KY', 'TN', 'NC', 'SC', ''],
  ['', '', 'LA', 'MS', 'AL', '', '', 'GA', '', '', '', ''],
  ['', 'TX', '', '', '', '', 'FL', '', '', '', '', ''],
  ['', '', '', '', '', 'HI', '', '', '', '', '', 'AK'],
];

function getStateColor(stateData: StateData | undefined): string {
  if (!stateData) return 'bg-muted/30 border-border/30';
  if (stateData.expired > 0 || stateData.complianceRate < 50) {
    return 'bg-red-400 dark:bg-red-500 border-red-500 dark:border-red-400';
  }
  if (stateData.complianceRate < 80) {
    return 'bg-amber-400 dark:bg-amber-500 border-amber-500 dark:border-amber-400';
  }
  return 'bg-emerald-400 dark:bg-emerald-500 border-emerald-500 dark:border-emerald-400';
}

function getStateHoverColor(stateData: StateData | undefined): string {
  if (!stateData) return 'hover:bg-muted/50';
  if (stateData.expired > 0 || stateData.complianceRate < 50) {
    return 'hover:bg-red-300 dark:hover:bg-red-400';
  }
  if (stateData.complianceRate < 80) {
    return 'hover:bg-amber-300 dark:hover:bg-amber-400';
  }
  return 'hover:bg-emerald-300 dark:hover:bg-emerald-400';
}

function getEmptyStateColor(): string {
  return 'bg-muted/20 border-border/20';
}

function ComplianceBadge({ rate }: { rate: number }) {
  if (rate >= 80) {
    return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px]">{rate}%</Badge>;
  }
  if (rate >= 50) {
    return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[10px]">{rate}%</Badge>;
  }
  return <Badge className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800 text-[10px]">{rate}%</Badge>;
}

function StatusIndicator({ state }: { state: StateData }) {
  const t = useTranslations('dashboard');
  if (state.expired > 0) {
    return <div className="flex items-center gap-1 text-red-600 dark:text-red-400"><AlertTriangle className="size-3" /><span className="text-xs">{t('expiredStatus', { count: state.expired })}</span></div>;
  }
  if (state.expiring > 0) {
    return <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><Clock className="size-3" /><span className="text-xs">{t('expiringStatus', { count: state.expiring })}</span></div>;
  }
  return <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><Shield className="size-3" /><span className="text-xs">{t('allActiveStatus')}</span></div>;
}

export function MultiStateDashboard() {
  const t = useTranslations('dashboard');
  const [data, setData] = useState<MultiStateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showAllStates, setShowAllStates] = useState(false);

  const fetchMultiState = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/multi-state');
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
    fetchMultiState();
  }, [fetchMultiState]);

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded" />
            <Skeleton className="h-6 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.states.length === 0) {
    return null;
  }

  const stateMap = new Map(data.states.map(s => [s.state, s]));

  const filteredStates = selectedState
    ? data.states.filter(s => s.state === selectedState)
    : data.states;

  const displayedStates = showAllStates ? filteredStates : filteredStates.slice(0, 5);

  const handleStateClick = (stateAbbr: string) => {
    setSelectedState(prev => prev === stateAbbr ? null : stateAbbr);
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="size-5 text-emerald-500" />
          <CardTitle>{t('multiStateView')}</CardTitle>
        </div>
        {data && (
          <Badge variant="outline" className="text-xs">
            {t('stateCoverage')}: {data.overallMultiStateCoverage}% ({data.totalStatesWithLicenses}/50)
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* US Grid Cartogram Map */}
        <div className="relative">
          <div className="flex justify-center">
            <div className="inline-block">
              {US_CARTOGRAM.map((row, rowIdx) => (
                <div key={rowIdx} className="flex gap-[3px] justify-center">
                  {row.map((stateAbbr, colIdx) => {
                    const stateData = stateAbbr ? stateMap.get(stateAbbr) : undefined;
                    const isSelected = selectedState === stateAbbr;
                    const hasLicenses = !!stateData;

                    return (
                      <motion.div
                        key={`${rowIdx}-${colIdx}`}
                        whileHover={hasLicenses ? { scale: 1.3, zIndex: 10 } : undefined}
                        whileTap={hasLicenses ? { scale: 0.95 } : undefined}
                        onClick={() => stateAbbr && hasLicenses ? handleStateClick(stateAbbr) : undefined}
                        className={`
                          relative size-7 sm:size-8 rounded-sm border transition-all duration-200
                          flex items-center justify-center
                          ${stateAbbr
                            ? hasLicenses
                              ? `${getStateColor(stateData)} ${getStateHoverColor(stateData)} cursor-pointer ${isSelected ? 'ring-2 ring-foreground ring-offset-1 ring-offset-background scale-110' : ''}`
                              : `${getEmptyStateColor()} cursor-default`
                            : 'invisible border-transparent'
                          }
                        `}
                        title={stateAbbr && hasLicenses ? `${stateData!.stateName}: ${stateData!.complianceRate}% compliance` : stateAbbr || ''}
                      >
                        {stateAbbr && (
                          <span className={`text-[7px] sm:text-[8px] font-bold leading-none ${
                            hasLicenses ? 'text-white dark:text-white' : 'text-muted-foreground/50'
                          }`}>
                            {stateAbbr}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Map Legend */}
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-sm bg-emerald-400 dark:bg-emerald-500" />
              <span>{'> '}80%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-sm bg-amber-400 dark:bg-amber-500" />
              <span>50-80%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-sm bg-red-400 dark:bg-red-500" />
              <span>{'< '}50%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-sm bg-muted/20 border border-border/30" />
              <span>{t('noStateLicenses')}</span>
            </div>
          </div>

          {/* Selected state indicator */}
          <AnimatePresence>
            {selectedState && stateMap.get(selectedState) && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center justify-center mt-2"
              >
                <button
                  onClick={() => setSelectedState(null)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  <MapPin className="size-3" />
                  {stateMap.get(selectedState)?.stateName}
                  <span className="text-emerald-500">✕</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* State-by-State Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">{t('licensesInState')}</h4>
            {selectedState && (
              <button
                onClick={() => setSelectedState(null)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {t('showAll')}
              </button>
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block">
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-start px-4 py-2.5 font-medium text-muted-foreground">{t('stateCol')}</th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">{t('licensesInState')}</th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">{t('activeCol')}</th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">{t('complianceCol')}</th>
                    <th className="text-start px-4 py-2.5 font-medium text-muted-foreground">{t('statusCol')}</th>
                    <th className="text-start px-4 py-2.5 font-medium text-muted-foreground">{t('nextExpirationCol')}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedStates.map((state, idx) => (
                    <motion.tr
                      key={state.state}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`border-t hover:bg-muted/30 cursor-pointer transition-colors ${selectedState === state.state ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}
                      onClick={() => handleStateClick(state.state)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`size-2.5 rounded-full ${getStateColor(state).split(' ')[0]}`} />
                          <span className="font-medium text-foreground">{state.stateName}</span>
                          <span className="text-muted-foreground text-xs">({state.state})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{state.total}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-emerald-600 dark:text-emerald-400">{state.active}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ComplianceBadge rate={state.complianceRate} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusIndicator state={state} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {state.nextExpiration
                          ? new Date(state.nextExpiration).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden space-y-2">
            {displayedStates.map((state, idx) => (
              <motion.div
                key={state.state}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleStateClick(state.state)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/30 ${
                  selectedState === state.state ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`size-2.5 rounded-full ${getStateColor(state).split(' ')[0]}`} />
                    <span className="font-medium text-foreground">{state.stateName}</span>
                    <span className="text-muted-foreground text-xs">({state.state})</span>
                  </div>
                  <ComplianceBadge rate={state.complianceRate} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{state.total} {t('licensesInState').toLowerCase()}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{t('activeLabel', { count: state.active })}</span>
                  <StatusIndicator state={state} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Show more/less toggle */}
          {filteredStates.length > 5 && (
            <button
              onClick={() => setShowAllStates(!showAllStates)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
            >
              {showAllStates ? (
                <>{t('showLess')} <ChevronUp className="size-3" /></>
              ) : (
                <>{t('showAllStates', { count: filteredStates.length })} <ChevronDown className="size-3" /></>
              )}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
