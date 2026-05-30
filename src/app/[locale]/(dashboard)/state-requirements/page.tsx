'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin,
  Shield,
  Clock,
  DollarSign,
  FileCheck,
  ChevronDown,
  ExternalLink,
  Phone,
  Building2,
  StickyNote,
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StateRequirementData {
  id: string;
  state: string;
  licenseType: string;
  renewPeriodMonths: number;
  ceHoursRequired: number;
  renewalFeeMin: number;
  renewalFeeMax: number;
  bondRequired: boolean;
  bondAmountMin: number;
  insuranceRequired: boolean;
  boardName: string | null;
  boardUrl: string | null;
  boardPhone: string | null;
  notes: string | null;
  reciprocityStates?: string[];
  nasclaAccepted?: boolean;
}

const ALL_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM',
  'NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA',
  'WV','WI','WY',
];
const LICENSE_TYPES = ['general_contractor', 'electrical', 'plumbing', 'hvac', 'roofing'];

export default function StateRequirementsPage() {
  const t = useTranslations('stateRequirements');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');

  const [requirements, setRequirements] = useState<StateRequirementData[]>([]);
  const [allRequirements, setAllRequirements] = useState<StateRequirementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [licenseTypeFilter, setLicenseTypeFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [primaryState, setPrimaryState] = useState<string>('');

  // Wizard state
  const [wizardState, setWizardState] = useState<string>('');
  const [wizardType, setWizardType] = useState<string>('');
  const [wizardResult, setWizardResult] = useState<StateRequirementData | null>(null);
  const [wizardLoading, setWizardLoading] = useState(false);

  const fetchRequirements = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (stateFilter && stateFilter !== 'all') params.set('state', stateFilter);
      if (licenseTypeFilter && licenseTypeFilter !== 'all') params.set('licenseType', licenseTypeFilter);

      const res = await fetch(`/api/state-requirements?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRequirements(data.requirements);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [stateFilter, licenseTypeFilter]);

  const fetchAllRequirements = useCallback(async () => {
    try {
      const res = await fetch('/api/state-requirements');
      if (res.ok) {
        const data = await res.json();
        setAllRequirements(data.requirements);
      }
    } catch {
      // silently fail
    }
  }, []);

  const fetchPrimaryState = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.organization?.primaryState) {
          setPrimaryState(data.organization.primaryState);
        }
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchAllRequirements();
    fetchPrimaryState();
  }, [fetchAllRequirements, fetchPrimaryState]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  const handleWizardCheck = async () => {
    if (!wizardState || !wizardType) return;
    setWizardLoading(true);
    setWizardResult(null);
    try {
      const res = await fetch(`/api/state-requirements?state=${wizardState}&licenseType=${wizardType}`);
      if (res.ok) {
        const data = await res.json();
        if (data.requirements && data.requirements.length > 0) {
          setWizardResult(data.requirements[0]);
        } else {
          setWizardResult(null);
        }
      }
    } catch {
      // silently fail
    } finally {
      setWizardLoading(false);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const primaryStateRequirements = allRequirements.filter(
    (r) => r.state === primaryState
  );

  const formatCurrency = (min: number, max: number) => {
    if (min === 0 && max === 0) return '—';
    if (min === max) return `$${min}`;
    return `$${min} – $${max}`;
  };

  const formatBondAmount = (amount: number) => {
    if (amount === 0) return '—';
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}k`;
    return `$${amount}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  // Loading state
  if (loading && requirements.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900 shrink-0">
          <MapPin className="size-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      {/* ===== "What Do I Need?" Wizard ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-emerald-50/30 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-emerald-950/10">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="size-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-semibold">What Do I Need?</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Select a state and license type to instantly see the requirements you need to meet.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Select value={wizardState} onValueChange={setWizardState}>
                <SelectTrigger className="w-full sm:w-52 bg-white/70 dark:bg-background/50">
                  <MapPin className="size-4 me-2 text-muted-foreground" />
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {t(`states.${state}` as any) !== `states.${state}`
                        ? `${t(`states.${state}` as any)} (${state})`
                        : state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={wizardType} onValueChange={setWizardType}>
                <SelectTrigger className="w-full sm:w-52 bg-white/70 dark:bg-background/50">
                  <Shield className="size-4 me-2 text-muted-foreground" />
                  <SelectValue placeholder="Select License Type" />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`licenseTypes.${type}` as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleWizardCheck}
                disabled={!wizardState || !wizardType || wizardLoading}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                {wizardLoading ? (
                  <Loader2 className="size-4 me-1 animate-spin" />
                ) : (
                  <Search className="size-4 me-1" />
                )}
                Check Requirements
              </Button>
            </div>

            {/* Wizard Result */}
            <AnimatePresence>
              {wizardResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl bg-white/80 dark:bg-background/60 border border-emerald-200/60 dark:border-emerald-800/40 p-4 md:p-5 space-y-4">
                    {/* Result Header */}
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="font-semibold text-base">
                        {t(`states.${wizardResult.state}` as any)} — {t(`licenseTypes.${wizardResult.licenseType}` as any)}
                      </h3>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 p-3 text-center">
                        <Clock className="size-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                        <p className="text-lg font-bold">{wizardResult.renewPeriodMonths}</p>
                        <p className="text-xs text-muted-foreground">{t('renewPeriod')}</p>
                      </div>
                      <div className="rounded-lg bg-teal-50/60 dark:bg-teal-950/20 p-3 text-center">
                        <FileCheck className="size-4 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
                        <p className="text-lg font-bold">{wizardResult.ceHoursRequired > 0 ? `${wizardResult.ceHoursRequired}h` : 'None'}</p>
                        <p className="text-xs text-muted-foreground">{t('ceHours')}</p>
                      </div>
                      <div className="rounded-lg bg-amber-50/60 dark:bg-amber-950/20 p-3 text-center">
                        <DollarSign className="size-4 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
                        <p className="text-lg font-bold">{formatCurrency(wizardResult.renewalFeeMin, wizardResult.renewalFeeMax)}</p>
                        <p className="text-xs text-muted-foreground">{t('feeRange')}</p>
                      </div>
                      <div className="rounded-lg bg-rose-50/60 dark:bg-rose-950/20 p-3 text-center">
                        <Shield className="size-4 text-rose-600 dark:text-rose-400 mx-auto mb-1" />
                        <p className="text-lg font-bold">
                          {wizardResult.bondRequired ? formatBondAmount(wizardResult.bondAmountMin) : wizardResult.insuranceRequired ? 'Ins.' : 'None'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {wizardResult.bondRequired ? 'Bond' : wizardResult.insuranceRequired ? 'Insurance' : 'No Req.'}
                        </p>
                      </div>
                    </div>

                    {/* Bond & Insurance Details */}
                    <div className="flex gap-2 flex-wrap">
                      {wizardResult.bondRequired ? (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                          {t('bondRequired')} {wizardResult.bondAmountMin > 0 ? `(${formatBondAmount(wizardResult.bondAmountMin)})` : ''}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <XCircle className="size-3 me-1" />
                          {t('notRequired')} (Bond)
                        </Badge>
                      )}
                      {wizardResult.insuranceRequired ? (
                        <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 border-teal-200 dark:border-teal-800">
                          {t('insuranceRequired')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <XCircle className="size-3 me-1" />
                          {t('notRequired')} (Insurance)
                        </Badge>
                      )}
                      {wizardResult.nasclaAccepted && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                          NASCLA Accepted
                        </Badge>
                      )}
                    </div>

                    {/* Board Contact */}
                    <div className="pt-3 border-t border-border/50">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        {t('boardContact')}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {wizardResult.boardName && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{wizardResult.boardName}</span>
                          </div>
                        )}
                        {wizardResult.boardPhone && (
                          <a
                            href={`tel:${wizardResult.boardPhone}`}
                            className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            <Phone className="size-3.5 shrink-0" />
                            {wizardResult.boardPhone}
                          </a>
                        )}
                        {wizardResult.boardUrl && (
                          <a
                            href={wizardResult.boardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            <ExternalLink className="size-3.5 shrink-0" />
                            Visit Website
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {wizardResult.notes && (
                      <div className="pt-3 border-t border-border/50">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                          {t('notes')}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-start gap-2">
                          <StickyNote className="size-3.5 mt-0.5 text-muted-foreground shrink-0" />
                          {wizardResult.notes}
                        </p>
                      </div>
                    )}

                    {/* Reciprocity */}
                    {wizardResult.reciprocityStates && wizardResult.reciprocityStates.length > 0 && (
                      <div className="pt-3 border-t border-border/50">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                          Reciprocity States
                        </p>
                        <div className="flex gap-1.5 flex-wrap">
                          {wizardResult.reciprocityStates.map((s: string) => (
                            <Badge key={s} variant="outline" className="font-mono text-xs">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* No result found */}
              {wizardState && wizardType && !wizardLoading && wizardResult === null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl bg-white/80 dark:bg-background/60 border border-border/50 p-4 text-center"
                >
                  <AlertCircle className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No requirements found for this combination.</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Try a different state or license type.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Your State Requirements Card */}
      {primaryState && primaryStateRequirements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-emerald-50/30 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-emerald-950/10">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="size-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg font-semibold">{t('yourState')}</h2>
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                  {primaryState}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {primaryStateRequirements.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-lg bg-white/70 dark:bg-background/50 border border-border/50 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t(`licenseTypes.${req.licenseType}` as any)}</span>
                      <div className="flex gap-1">
                        {req.bondRequired && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                            {t('bondRequired')}
                          </Badge>
                        )}
                        {req.insuranceRequired && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800">
                            {t('insuranceRequired')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {req.renewPeriodMonths} {t('months')}
                      </span>
                      {req.ceHoursRequired > 0 && (
                        <span className="flex items-center gap-1">
                          <FileCheck className="size-3" />
                          {req.ceHoursRequired}h CE
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <DollarSign className="size-3" />
                        {formatCurrency(req.renewalFeeMin, req.renewalFeeMax)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <MapPin className="size-4 me-2 text-muted-foreground" />
            <SelectValue placeholder={t('searchState')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('searchState')}</SelectItem>
            {ALL_STATES.map((state) => (
              <SelectItem key={state} value={state}>
                {t(`states.${state}` as any) !== `states.${state}` ? t(`states.${state}` as any) : state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={licenseTypeFilter} onValueChange={setLicenseTypeFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <Shield className="size-4 me-2 text-muted-foreground" />
            <SelectValue placeholder={t('searchType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('searchType')}</SelectItem>
            {LICENSE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`licenseTypes.${type}` as any)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(stateFilter !== 'all' || licenseTypeFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStateFilter('all');
              setLicenseTypeFilter('all');
            }}
            className="text-muted-foreground"
          >
            ✕ {tCommon('cancel')}
          </Button>
        )}
      </div>

      {/* Results count */}
      {requirements.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {requirements.length} {requirements.length === 1 ? 'requirement' : 'requirements'} found
        </p>
      )}

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('state')}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('licenseType')}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('renewPeriod')}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('ceHours')}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('feeRange')}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('bondRequired')}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('insuranceRequired')}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('boardContact')}
                  </th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <AnimatePresence>
                <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                  {requirements.map((req) => (
                    <motion.tr
                      key={req.id}
                      variants={itemVariants}
                      className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {req.state}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {t(`licenseTypes.${req.licenseType}` as any)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {req.renewPeriodMonths} {t('months')}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {req.ceHoursRequired > 0 ? `${req.ceHoursRequired}h` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatCurrency(req.renewalFeeMin, req.renewalFeeMax)}
                      </td>
                      <td className="px-4 py-3">
                        {req.bondRequired ? (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-xs">
                            {t('required')}
                            {req.bondAmountMin > 0 && ` (${formatBondAmount(req.bondAmountMin)})`}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {t('notRequired')}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {req.insuranceRequired ? (
                          <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 border-teal-200 dark:border-teal-800 text-xs">
                            {t('required')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {t('notRequired')}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-48 truncate">
                        {req.boardName || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => toggleRow(req.id)}
                        >
                          <motion.div
                            animate={{ rotate: expandedRows.has(req.id) ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="size-4" />
                          </motion.div>
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </AnimatePresence>
            </table>
          </div>

          {/* Empty state */}
          {requirements.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="size-12 text-muted-foreground/50 mb-3" />
              <p className="font-medium text-muted-foreground">{t('noResults')}</p>
              <p className="text-sm text-muted-foreground/70 mt-1">{t('noResultsDesc')}</p>
            </div>
          )}

          {/* Expanded detail rows */}
          {requirements.map((req) => (
            <AnimatePresence key={`detail-${req.id}`}>
              {expandedRows.has(req.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t bg-muted/20"
                >
                  <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Board Name */}
                    {req.boardName && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {t('boardName')}
                        </p>
                        <p className="text-sm flex items-center gap-2">
                          <Building2 className="size-3.5 text-muted-foreground" />
                          {req.boardName}
                        </p>
                      </div>
                    )}
                    {/* Board URL */}
                    {req.boardUrl && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {t('boardUrl')}
                        </p>
                        <a
                          href={req.boardUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="size-3.5" />
                          Visit Website
                        </a>
                      </div>
                    )}
                    {/* Board Phone */}
                    {req.boardPhone && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {t('boardPhone')}
                        </p>
                        <a
                          href={`tel:${req.boardPhone}`}
                          className="text-sm hover:underline flex items-center gap-1"
                        >
                          <Phone className="size-3.5 text-muted-foreground" />
                          {req.boardPhone}
                        </a>
                      </div>
                    )}
                    {/* Bond Amount */}
                    {req.bondRequired && req.bondAmountMin > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Min. Bond Amount
                        </p>
                        <p className="text-sm font-medium">
                          ${req.bondAmountMin.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {/* Notes */}
                    {req.notes && (
                      <div className="space-y-1 sm:col-span-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {t('notes')}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-start gap-2">
                          <StickyNote className="size-3.5 mt-0.5 text-muted-foreground shrink-0" />
                          {req.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {requirements.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="size-12 text-muted-foreground/50 mb-3" />
            <p className="font-medium text-muted-foreground">{t('noResults')}</p>
            <p className="text-sm text-muted-foreground/70 mt-1">{t('noResultsDesc')}</p>
          </div>
        )}

        <AnimatePresence>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {requirements.map((req) => (
              <motion.div key={req.id} variants={itemVariants}>
                <Collapsible
                  open={expandedRows.has(req.id)}
                  onOpenChange={() => toggleRow(req.id)}
                >
                  <Card className="shadow-sm">
                    <CollapsibleTrigger asChild>
                      <CardContent className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {req.state}
                            </Badge>
                            <span className="text-sm font-medium">
                              {t(`licenseTypes.${req.licenseType}` as any)}
                            </span>
                          </div>
                          <motion.div
                            animate={{ rotate: expandedRows.has(req.id) ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="size-4 text-muted-foreground" />
                          </motion.div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                            <Clock className="size-3" />
                            {req.renewPeriodMonths} {t('months')}
                          </span>
                          {req.ceHoursRequired > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                              <FileCheck className="size-3" />
                              {req.ceHoursRequired}h CE
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                            <DollarSign className="size-3" />
                            {formatCurrency(req.renewalFeeMin, req.renewalFeeMax)}
                          </span>
                        </div>

                        <div className="flex gap-1.5">
                          {req.bondRequired ? (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[10px] px-1.5 py-0">
                              {t('bondRequired')} {req.bondAmountMin > 0 ? `(${formatBondAmount(req.bondAmountMin)})` : ''}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                              {t('notRequired')}
                            </Badge>
                          )}
                          {req.insuranceRequired ? (
                            <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 border-teal-200 dark:border-teal-800 text-[10px] px-1.5 py-0">
                              {t('insuranceRequired')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                              {t('notRequired')}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-0 border-t space-y-3">
                        {req.boardName && (
                          <div className="pt-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                              {t('boardName')}
                            </p>
                            <p className="text-sm flex items-center gap-2">
                              <Building2 className="size-3.5 text-muted-foreground" />
                              {req.boardName}
                            </p>
                          </div>
                        )}
                        {req.boardUrl && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                              {t('boardUrl')}
                            </p>
                            <a
                              href={req.boardUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="size-3.5" />
                              Visit Website
                            </a>
                          </div>
                        )}
                        {req.boardPhone && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                              {t('boardPhone')}
                            </p>
                            <a
                              href={`tel:${req.boardPhone}`}
                              className="text-sm hover:underline flex items-center gap-1"
                            >
                              <Phone className="size-3.5 text-muted-foreground" />
                              {req.boardPhone}
                            </a>
                          </div>
                        )}
                        {req.bondRequired && req.bondAmountMin > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                              Min. Bond Amount
                            </p>
                            <p className="text-sm font-medium">
                              ${req.bondAmountMin.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {req.notes && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                              {t('notes')}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-start gap-2">
                              <StickyNote className="size-3.5 mt-0.5 text-muted-foreground shrink-0" />
                              {req.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
