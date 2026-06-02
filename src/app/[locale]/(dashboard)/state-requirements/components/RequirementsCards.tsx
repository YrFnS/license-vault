import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Clock,
  DollarSign,
  FileCheck,
  ChevronDown,
  ExternalLink,
  Phone,
  Building2,
  StickyNote,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StateRequirementData } from '../types';
import { containerVariants, itemVariants } from '../constants';
import { formatCurrency, formatBondAmount } from '../helpers';

interface RequirementsCardsProps {
  requirements: StateRequirementData[];
  expandedRows: Set<string>;
  toggleRow: (id: string) => void;
  loading: boolean;
}

export default function RequirementsCards({
  requirements,
  expandedRows,
  toggleRow,
  loading,
}: RequirementsCardsProps) {
  const t = useTranslations('stateRequirements');

  return (
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
  );
}
