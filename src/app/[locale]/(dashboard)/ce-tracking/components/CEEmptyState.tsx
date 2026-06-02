'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface CEEmptyStateProps {
  canManage: boolean;
  onAdd: () => void;
}

export function CEEmptyState({ canManage, onAdd }: CEEmptyStateProps) {
  const t = useTranslations('ceTracking');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 p-4 mb-4">
            <GraduationCap className="size-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold mb-1">{t('noRecords')}</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">{t('noRecordsDesc')}</p>
          {canManage && (
            <Button
              onClick={onAdd}
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
            >
              <Plus className="size-4 me-2" />
              {t('addRecord')}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
