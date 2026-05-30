'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Phone,
  Building2,
  AlertTriangle,
  Award,
  MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LicenseTypeInfo {
  licenseType: string;
  reciprocityStates: string[];
  nasclaAccepted: boolean;
  ceHoursRequired: number;
  renewalFeeMin: number;
  renewalFeeMax: number;
  bondRequired: boolean;
  insuranceRequired: boolean;
}

interface ReciprocityResult {
  state: string;
  hasData: boolean;
  reciprocityStates: string[];
  nasclaAccepted: boolean;
  licenseTypes: LicenseTypeInfo[];
  boardName: string | null;
  boardUrl: string | null;
  boardPhone: string | null;
}

interface StateRequirementData {
  id: string;
  state: string;
  licenseType: string;
  reciprocityStates: string[];
  nasclaAccepted: boolean;
  boardName: string | null;
  boardUrl: string | null;
  boardPhone: string | null;
  ceHoursRequired: number;
  renewalFeeMin: number;
  renewalFeeMax: number;
  bondRequired: boolean;
  insuranceRequired: boolean;
}

const ALL_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

const SEED_STATES = ['CA','TX','FL','NY','IL','OH','PA','GA','NC','MI','NJ','VA','WA','AZ','CO'];

const LICENSE_TYPE_LABELS: Record<string, string> = {
  general_contractor: 'General Contractor',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  hvac: 'HVAC',
  roofing: 'Roofing',
};

export default function ReciprocityPage() {
  const t = useTranslations('reciprocity');
  const tStateReq = useTranslations('stateRequirements');

  const [sourceState, setSourceState] = useState<string>('');
  const [targetState, setTargetState] = useState<string>('');
  const [checking, setChecking] = useState(false);
  const [sourceResult, setSourceResult] = useState<ReciprocityResult | null>(null);
  const [targetResult, setTargetResult] = useState<ReciprocityResult | null>(null);
  const [allRequirements, setAllRequirements] = useState<StateRequirementData[]>([]);
  const [primaryState, setPrimaryState] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedGridState, setSelectedGridState] = useState<string | null>(null);
  const [gridStateResult, setGridStateResult] = useState<ReciprocityResult | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [reqRes, settingsRes] = await Promise.all([
        fetch('/api/state-requirements'),
        fetch('/api/settings'),
      ]);
      if (reqRes.ok) {
        const data = await reqRes.json();
        setAllRequirements(data.requirements);
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.organization?.primaryState) {
          setPrimaryState(data.organization.primaryState);
        }
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

  const checkReciprocity = useCallback(async () => {
    if (!sourceState || !targetState) return;
    setChecking(true);
    try {
      const [srcRes, tgtRes] = await Promise.all([
        fetch(`/api/state-requirements?action=reciprocity&state=${sourceState}`),
        fetch(`/api/state-requirements?action=reciprocity&state=${targetState}`),
      ]);
      if (srcRes.ok) {
        const data = await srcRes.json();
        setSourceResult(data);
      }
      if (tgtRes.ok) {
        const data = await tgtRes.json();
        setTargetResult(data);
      }
    } catch {
      // silently fail
    } finally {
      setChecking(false);
    }
  }, [sourceState, targetState]);

  const checkGridState = useCallback(async (stateCode: string) => {
    setSelectedGridState(stateCode);
    try {
      const res = await fetch(`/api/state-requirements?action=reciprocity&state=${stateCode}`);
      if (res.ok) {
        const data = await res.json();
        setGridStateResult(data);
      }
    } catch {
      // silently fail
    }
  }, []);

  // Build reciprocity map: which states have reciprocity to primary state
  const reciprocityMap = useCallback((): Set<string> => {
    const result = new Set<string>();
    if (!primaryState) return result;
    for (const req of allRequirements) {
      if (req.reciprocityStates && req.reciprocityStates.includes(primaryState)) {
        result.add(req.state);
      }
      // Also check if primary state has reciprocity to this state
      if (req.state === primaryState && req.reciprocityStates) {
        req.reciprocityStates.forEach((s: string) => result.add(s));
      }
    }
    return result;
  }, [allRequirements, primaryState]);

  const recipStates = reciprocityMap();

  // Determine if reciprocity exists between source and target
  const hasReciprocity =
    sourceResult?.reciprocityStates?.includes(targetState) ||
    targetResult?.reciprocityStates?.includes(sourceState);

  // Get covered license types
  const coveredTypes: { type: string; fromSource: boolean; fromTarget: boolean }[] = [];
  if (sourceResult && targetResult) {
    const sourceTypes = sourceResult.licenseTypes.filter((lt) =>
      lt.reciprocityStates.includes(targetState)
    );
    const targetTypes = targetResult.licenseTypes.filter((lt) =>
      lt.reciprocityStates.includes(sourceState)
    );

    const allTypes = new Set([
      ...sourceTypes.map((lt) => lt.licenseType),
      ...targetTypes.map((lt) => lt.licenseType),
    ]);

    for (const type of allTypes) {
      coveredTypes.push({
        type,
        fromSource: sourceTypes.some((lt) => lt.licenseType === type),
        fromTarget: targetTypes.some((lt) => lt.licenseType === type),
      });
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3"
      >
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900 shrink-0">
          <ArrowLeftRight className="size-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
      </motion.div>

      {/* Lookup Tool */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-emerald-50/30 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-emerald-950/10">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="size-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-semibold">{t('checkReciprocity')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{t('selectSourceState')}</label>
                <Select value={sourceState} onValueChange={setSourceState}>
                  <SelectTrigger>
                    <MapPin className="size-4 me-2 text-muted-foreground" />
                    <SelectValue placeholder={t('selectSourceState')} />
                  </SelectTrigger>
                  <SelectContent>
                    {SEED_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{t('selectTargetState')}</label>
                <Select value={targetState} onValueChange={setTargetState}>
                  <SelectTrigger>
                    <MapPin className="size-4 me-2 text-muted-foreground" />
                    <SelectValue placeholder={t('selectTargetState')} />
                  </SelectTrigger>
                  <SelectContent>
                    {SEED_STATES.filter((s) => s !== sourceState).map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={checkReciprocity}
              disabled={!sourceState || !targetState || checking}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {checking ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Checking...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ArrowLeftRight className="size-4" />
                  {t('checkReciprocity')}
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results Card */}
      <AnimatePresence>
        {sourceResult && targetResult && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.4, ease: 'easeOut' as const }}
          >
            <Card className={hasReciprocity
              ? 'border-emerald-200 dark:border-emerald-800/50'
              : 'border-gray-200 dark:border-gray-800/50'
            }>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  {hasReciprocity ? (
                    <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="size-6 text-gray-400 dark:text-gray-500" />
                  )}
                  <span>{hasReciprocity ? t('reciprocityExists') : t('noReciprocity')}</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {sourceState} ↔ {targetState}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasReciprocity && (
                  <>
                    {/* NASCLA Info */}
                    {(sourceResult.nasclaAccepted || targetResult.nasclaAccepted) && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                        <Award className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          {t('nasclaNote')}
                        </span>
                      </div>
                    )}

                    {/* Covered License Types */}
                    {coveredTypes.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold">{t('coveredTypes')}</h3>
                        <div className="flex flex-wrap gap-2">
                          {coveredTypes.map((ct) => (
                            <Badge
                              key={ct.type}
                              className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            >
                              {LICENSE_TYPE_LABELS[ct.type] || ct.type}
                              {ct.fromSource && ct.fromTarget && ' (Both)'}
                              {ct.fromSource && !ct.fromTarget && ` (${sourceState})`}
                              {!ct.fromSource && ct.fromTarget && ` (${targetState})`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Requirements Warning */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
                      <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-amber-700 dark:text-amber-300">
                        {t('additionalRequirements')}
                      </span>
                    </div>

                    {/* Board Contact Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Source State Board */}
                      {sourceResult.boardName && (
                        <div className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {sourceState} - {t('boardContact')}
                          </p>
                          <div className="space-y-1.5">
                            <p className="text-sm flex items-center gap-2">
                              <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                              {sourceResult.boardName}
                            </p>
                            {sourceResult.boardUrl && (
                              <a
                                href={sourceResult.boardUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="size-3.5" />
                                Website
                              </a>
                            )}
                            {sourceResult.boardPhone && (
                              <a
                                href={`tel:${sourceResult.boardPhone}`}
                                className="text-sm hover:underline flex items-center gap-1"
                              >
                                <Phone className="size-3.5 text-muted-foreground" />
                                {sourceResult.boardPhone}
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Target State Board */}
                      {targetResult.boardName && (
                        <div className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {targetState} - {t('boardContact')}
                          </p>
                          <div className="space-y-1.5">
                            <p className="text-sm flex items-center gap-2">
                              <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                              {targetResult.boardName}
                            </p>
                            {targetResult.boardUrl && (
                              <a
                                href={targetResult.boardUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="size-3.5" />
                                Website
                              </a>
                            )}
                            {targetResult.boardPhone && (
                              <a
                                href={`tel:${targetResult.boardPhone}`}
                                className="text-sm hover:underline flex items-center gap-1"
                              >
                                <Phone className="size-3.5 text-muted-foreground" />
                                {targetResult.boardPhone}
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Reciprocity states for each */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      {sourceState} — {t('statesWithReciprocity')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {sourceResult.reciprocityStates.length > 0 ? (
                        sourceResult.reciprocityStates.map((s) => (
                          <Badge
                            key={s}
                            variant="outline"
                            className={`font-mono text-xs ${
                              s === targetState
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                                : ''
                            }`}
                          >
                            {s}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      {targetState} — {t('statesWithReciprocity')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {targetResult.reciprocityStates.length > 0 ? (
                        targetResult.reciprocityStates.map((s) => (
                          <Badge
                            key={s}
                            variant="outline"
                            className={`font-mono text-xs ${
                              s === sourceState
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                                : ''
                            }`}
                          >
                            {s}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* State Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-5 text-emerald-600 dark:text-emerald-400" />
              {t('statesWithReciprocity')}
              {primaryState && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-mono">
                  {primaryState}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {ALL_STATES.map((stateCode) => {
                const isSeeded = SEED_STATES.includes(stateCode);
                const hasRecip = recipStates.has(stateCode);
                const isSelected = selectedGridState === stateCode;
                const isPrimary = stateCode === primaryState;

                return (
                  <motion.button
                    key={stateCode}
                    variants={itemVariants}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => isSeeded && checkGridState(stateCode)}
                    disabled={!isSeeded}
                    className={`
                      relative flex items-center justify-center rounded-lg p-2 text-xs font-bold transition-colors duration-200
                      ${isPrimary
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                        : hasRecip
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/70'
                          : isSeeded
                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            : 'bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-600 cursor-not-allowed'
                      }
                      ${isSelected ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-background' : ''}
                    `}
                  >
                    {stateCode}
                  </motion.button>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded bg-emerald-500" />
                Primary
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800" />
                Reciprocity
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
                Seeded (no recip.)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800" />
                Not seeded
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grid State Detail */}
      <AnimatePresence>
        {selectedGridState && gridStateResult && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: 'easeOut' as const }}
          >
            <Card className="border-emerald-200 dark:border-emerald-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  <MapPin className="size-5 text-emerald-600 dark:text-emerald-400" />
                  {selectedGridState} — Reciprocity Details
                  {gridStateResult.nasclaAccepted && (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                      <Award className="size-3 me-1" />
                      NASCLA
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {gridStateResult.hasData ? (
                  <>
                    {/* Reciprocity states */}
                    <div>
                      <p className="text-sm font-medium mb-2">{t('statesWithReciprocity')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {gridStateResult.reciprocityStates.length > 0 ? (
                          gridStateResult.reciprocityStates.map((s: string) => (
                            <Badge
                              key={s}
                              className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-mono"
                            >
                              {s}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No reciprocity agreements on file</span>
                        )}
                      </div>
                    </div>

                    {/* License types */}
                    <div>
                      <p className="text-sm font-medium mb-2">{t('coveredTypes')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {gridStateResult.licenseTypes.map((lt: LicenseTypeInfo) => (
                          <div
                            key={lt.licenseType}
                            className="rounded-lg bg-muted/50 border border-border/50 p-3 space-y-1.5"
                          >
                            <p className="text-sm font-medium">
                              {LICENSE_TYPE_LABELS[lt.licenseType] || lt.licenseType}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {lt.nasclaAccepted && (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5 py-0">
                                  NASCLA
                                </Badge>
                              )}
                              {lt.bondRequired && (
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[10px] px-1.5 py-0">
                                  Bond
                                </Badge>
                              )}
                              {lt.insuranceRequired && (
                                <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800 text-[10px] px-1.5 py-0">
                                  Insurance
                                </Badge>
                              )}
                            </div>
                            {lt.reciprocityStates.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Reciprocity: {lt.reciprocityStates.join(', ')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Board Contact */}
                    {gridStateResult.boardName && (
                      <div className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {t('boardContact')}
                        </p>
                        <div className="space-y-1.5">
                          <p className="text-sm flex items-center gap-2">
                            <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                            {gridStateResult.boardName}
                          </p>
                          {gridStateResult.boardUrl && (
                            <a
                              href={gridStateResult.boardUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="size-3.5" />
                              Website
                            </a>
                          )}
                          {gridStateResult.boardPhone && (
                            <a
                              href={`tel:${gridStateResult.boardPhone}`}
                              className="text-sm hover:underline flex items-center gap-1"
                            >
                              <Phone className="size-3.5 text-muted-foreground" />
                              {gridStateResult.boardPhone}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No reciprocity data available for this state.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
