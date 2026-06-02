'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTranslations } from 'next-intl';

interface ProgressSectionProps {
  totalHours: number;
  totalRequired: number;
}

export function ProgressSection({ totalHours, totalRequired }: ProgressSectionProps) {
  const t = useTranslations('ceTracking');

  if (totalRequired <= 0) return null;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{t('progress')}</span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {totalHours} / {totalRequired} {t('totalHours').toLowerCase()}
          </span>
        </div>
        <Progress
          value={Math.min(100, (totalHours / totalRequired) * 100)}
          className="h-3"
        />
      </CardContent>
    </Card>
  );
}
