import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
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

interface RequirementsTableProps {
  requirements: StateRequirementData[];
  expandedRows: Set<string>;
  toggleRow: (id: string) => void;
  loading: boolean;
}

export default function RequirementsTable({
  requirements,
  expandedRows,
  toggleRow,
  loading,
}: RequirementsTableProps) {
  const t = useTranslations('stateRequirements');

  return (
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
              <ExpandedDetailRow req={req} />
            )}
          </AnimatePresence>
        ))}
      </CardContent>
    </Card>
  );
}

function ExpandedDetailRow({ req }: { req: StateRequirementData }) {
  const t = useTranslations('stateRequirements');

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden border-t bg-muted/20"
    >
      <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
  );
}
