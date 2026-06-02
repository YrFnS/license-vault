'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, RefreshCw, ShieldAlert } from 'lucide-react';
import type { InsuranceRecord } from './types';
import { formatCurrency, formatDate, parseEndorsementTypes } from './utils';
import { getStatusBadge, getComplianceBadge, getTypeBadge, getEndorsementBadges } from './BadgeComponents';

interface InsuranceMobileCardsProps {
  records: InsuranceRecord[];
  onEdit: (record: InsuranceRecord) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}

export default function InsuranceMobileCards({ records, onEdit, onDelete, t }: InsuranceMobileCardsProps) {
  return (
    <div className="md:hidden space-y-3">
      <AnimatePresence>
        {records.map((record) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {record.autoRenew && <RefreshCw className="size-3 text-teal-500 shrink-0" />}
                      <h3 className="font-semibold truncate">{record.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">{record.policyNumber}</p>
                  </div>
                  <div className="flex items-center gap-1.5 ms-2 shrink-0 flex-wrap justify-end">
                    {getTypeBadge(record.type, t)}
                    {getStatusBadge(record.computedStatus, t)}
                    {getComplianceBadge(record.complianceStatus, t)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">{t('provider')}:</span>
                    <p className="font-medium">{record.provider}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('coverageAmount')}:</span>
                    <p className="font-medium">{formatCurrency(record.coverageAmount)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('premiumAmount')}:</span>
                    <p className="font-medium">{formatCurrency(record.premiumAmount)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('expirationDate')}:</span>
                    <p className="font-medium">{formatDate(record.expirationDate)}</p>
                  </div>
                </div>

                {/* Endorsements */}
                {(record.additionalInsured || record.primaryNoncontrib || record.waiverSubrogation || parseEndorsementTypes(record.endorsementTypes).length > 0) && (
                  <div className="mb-3">
                    <span className="text-xs text-muted-foreground block mb-1">{t('endorsements')}:</span>
                    {getEndorsementBadges(record, t)}
                  </div>
                )}

                {/* Coverage Details */}
                {(record.perOccurrenceLimit > 0 || record.aggregateLimit > 0) && (
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    {record.perOccurrenceLimit > 0 && (
                      <div>
                        <span className="text-muted-foreground">{t('perOccurrenceLimit')}:</span>
                        <p className="font-medium">{formatCurrency(record.perOccurrenceLimit)}</p>
                      </div>
                    )}
                    {record.aggregateLimit > 0 && (
                      <div>
                        <span className="text-muted-foreground">{t('aggregateLimit')}:</span>
                        <p className="font-medium">{formatCurrency(record.aggregateLimit)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Deficiencies */}
                {record.complianceStatus === 'deficient' && record.compliance?.deficiencies?.length > 0 && (
                  <div className="mb-3 p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 text-xs font-medium mb-1">
                      <ShieldAlert className="size-3" />
                      {t('deficiencyFound')}
                    </div>
                    <ul className="text-xs text-amber-600 dark:text-amber-300 space-y-0.5">
                      {record.compliance.deficiencies.map((d, i) => (
                        <li key={i}>• {d}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {record.holderName && (
                  <p className="text-sm text-muted-foreground mb-3">
                    <span className="font-medium">{t('holderName')}:</span> {record.holderName}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(record)}
                    className="hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30"
                  >
                    <Pencil className="size-3.5 me-1.5" />
                    {t('editPolicy')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(record.id)}
                    className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="size-3.5 me-1.5" />
                    {t('deleteConfirm').split('?')[0]}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
