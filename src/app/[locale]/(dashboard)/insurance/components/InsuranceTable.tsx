'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, RefreshCw } from 'lucide-react';
import type { InsuranceRecord } from './types';
import { formatCurrency } from './utils';
import { getStatusBadge, getComplianceBadge, getTypeBadge, getEndorsementBadges } from './BadgeComponents';

interface InsuranceTableProps {
  records: InsuranceRecord[];
  onEdit: (record: InsuranceRecord) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}

export function InsuranceDesktopTable({ records, onEdit, onDelete, t }: InsuranceTableProps) {
  return (
    <div className="hidden lg:block">
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('type')}</TableHead>
                <TableHead>{t('policyNumber')}</TableHead>
                <TableHead>{t('provider')}</TableHead>
                <TableHead className="text-end">{t('coverageDetails')}</TableHead>
                <TableHead>{t('endorsements')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('compliance')}</TableHead>
                <TableHead className="text-end" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {records.map((record) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {record.autoRenew && <RefreshCw className="size-3 text-teal-500" />}
                        {record.name}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(record.type, t)}</TableCell>
                    <TableCell className="font-mono text-sm">{record.policyNumber}</TableCell>
                    <TableCell>{record.provider}</TableCell>
                    <TableCell className="text-end">
                      <div className="text-xs space-y-0.5">
                        <div className="font-medium">{formatCurrency(record.coverageAmount)}</div>
                        {(record.perOccurrenceLimit > 0 || record.aggregateLimit > 0) && (
                          <>
                            {record.perOccurrenceLimit > 0 && (
                              <div className="text-muted-foreground">{t('perOccurrenceLimit')}: {formatCurrency(record.perOccurrenceLimit)}</div>
                            )}
                            {record.aggregateLimit > 0 && (
                              <div className="text-muted-foreground">{t('aggregateLimit')}: {formatCurrency(record.aggregateLimit)}</div>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getEndorsementBadges(record, t)}</TableCell>
                    <TableCell>{getStatusBadge(record.computedStatus, t)}</TableCell>
                    <TableCell>{getComplianceBadge(record.complianceStatus, t)}</TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 transition-colors duration-200"
                          onClick={() => onEdit(record)}
                        >
                          <Pencil className="size-3.5" />
                          <span className="sr-only">{t('editPolicy')}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors duration-200"
                          onClick={() => onDelete(record.id)}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">{t('deleteConfirm')}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function InsuranceMediumTable({ records, onEdit, onDelete, t }: InsuranceTableProps) {
  return (
    <div className="hidden md:block lg:hidden">
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('type')}</TableHead>
                <TableHead>{t('coverageDetails')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('compliance')}</TableHead>
                <TableHead className="text-end" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {records.map((record) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {record.autoRenew && <RefreshCw className="size-3 text-teal-500" />}
                        <div>
                          <div className="truncate max-w-32">{record.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{record.policyNumber}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(record.type, t)}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div className="font-medium">{formatCurrency(record.coverageAmount)}</div>
                        {record.perOccurrenceLimit > 0 && (
                          <div className="text-muted-foreground">Occ: {formatCurrency(record.perOccurrenceLimit)}</div>
                        )}
                        {record.aggregateLimit > 0 && (
                          <div className="text-muted-foreground">Agg: {formatCurrency(record.aggregateLimit)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(record.computedStatus, t)}</TableCell>
                    <TableCell>{getComplianceBadge(record.complianceStatus, t)}</TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30"
                          onClick={() => onEdit(record)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                          onClick={() => onDelete(record.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
