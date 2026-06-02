'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Clock, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CERecord } from './types';
import { containerVariants, itemVariants, categoryColors } from './constants';

interface CERecordsCardsProps {
  records: CERecord[];
  canManage: boolean;
  formatDate: (dateStr: string) => string;
  getCategoryLabel: (cat: string) => string;
  getLicenseName: (licenseId: string) => string;
  onEdit: (record: CERecord) => void;
  onDelete: (id: string) => void;
}

export function CERecordsCards({
  records,
  canManage,
  formatDate,
  getCategoryLabel,
  getLicenseName,
  onEdit,
  onDelete,
}: CERecordsCardsProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="md:hidden space-y-3"
    >
      <AnimatePresence>
        {records.map((record) => (
          <motion.div key={record.id} variants={itemVariants}>
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm truncate">{record.courseName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{record.provider}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs font-medium shrink-0 ${categoryColors[record.category] || categoryColors.general}`}>
                    {getCategoryLabel(record.category)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    <span className="font-semibold text-foreground tabular-nums">{record.hoursEarned}</span>
                    {record.hoursRequired > 0 && <span>/ {record.hoursRequired}</span>}
                  </span>
                  <span>{formatDate(record.completionDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="size-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{getLicenseName(record.licenseId)}</span>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30"
                        onClick={() => onEdit(record)}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                        onClick={() => onDelete(record.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {record.notes && (
                  <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">{record.notes}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
