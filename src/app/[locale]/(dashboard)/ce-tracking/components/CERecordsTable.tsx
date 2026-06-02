'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { CERecord } from './types';
import { containerVariants, itemVariants, categoryColors } from './constants';

interface CERecordsTableProps {
  records: CERecord[];
  canManage: boolean;
  formatDate: (dateStr: string) => string;
  getCategoryLabel: (cat: string) => string;
  getLicenseName: (licenseId: string) => string;
  onEdit: (record: CERecord) => void;
  onDelete: (id: string) => void;
}

export function CERecordsTable({
  records,
  canManage,
  formatDate,
  getCategoryLabel,
  getLicenseName,
  onEdit,
  onDelete,
}: CERecordsTableProps) {
  const t = useTranslations('ceTracking');
  const tCommon = useTranslations('common');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="hidden md:block"
    >
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('courseName')}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('provider')}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('hoursEarned')}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('completionDate')}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('category')}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('license')}
                  </th>
                  {canManage && (
                    <th className="text-start px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {tCommon('actions')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {records.map((record) => (
                    <motion.tr
                      key={record.id}
                      variants={itemVariants}
                      className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm">{record.courseName}</div>
                        {record.notes && (
                          <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-48">{record.notes}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">{record.provider}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold tabular-nums">{record.hoursEarned}</span>
                        {record.hoursRequired > 0 && (
                          <span className="text-xs text-muted-foreground"> / {record.hoursRequired}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(record.completionDate)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs font-medium ${categoryColors[record.category] || categoryColors.general}`}>
                          {getCategoryLabel(record.category)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Shield className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm">{getLicenseName(record.licenseId)}</span>
                        </div>
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 transition-colors"
                              onClick={() => onEdit(record)}
                            >
                              <Pencil className="size-3.5" />
                              <span className="sr-only">{tCommon('edit')}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors"
                              onClick={() => onDelete(record.id)}
                            >
                              <Trash2 className="size-3.5" />
                              <span className="sr-only">{tCommon('delete')}</span>
                            </Button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
