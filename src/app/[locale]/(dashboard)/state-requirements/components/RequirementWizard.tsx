import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  Shield,
  Clock,
  DollarSign,
  FileCheck,
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Phone,
  Building2,
  StickyNote,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StateRequirementData } from '../types';
import { ALL_STATES, LICENSE_TYPES } from '../constants';
import { formatCurrency, formatBondAmount } from '../helpers';

interface RequirementWizardProps {
  wizardState: string;
  setWizardState: (v: string) => void;
  wizardType: string;
  setWizardType: (v: string) => void;
  wizardResult: StateRequirementData | null;
  wizardLoading: boolean;
  wizardSubmitted: boolean;
  handleWizardCheck: () => void;
}

export default function RequirementWizard({
  wizardState,
  setWizardState,
  wizardType,
  setWizardType,
  wizardResult,
  wizardLoading,
  wizardSubmitted,
  handleWizardCheck,
}: RequirementWizardProps) {
  const t = useTranslations('stateRequirements');

  return (
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
              <WizardResultCard wizardResult={wizardResult} />
            )}

            {/* No result found */}
            {wizardState && wizardType && !wizardLoading && wizardSubmitted && wizardResult === null && (
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
  );
}

function WizardResultCard({ wizardResult }: { wizardResult: StateRequirementData }) {
  const t = useTranslations('stateRequirements');

  return (
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
  );
}
