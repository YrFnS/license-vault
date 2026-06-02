'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface ComplianceErrorProps {
  error: string;
  onRetry: () => void;
}

export default function ComplianceError({ error, onRetry }: ComplianceErrorProps) {
  const t = useTranslations('compliance');
  const tc = useTranslations('common');

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full border-destructive/20 shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center size-16 rounded-full bg-destructive/10">
            <ShieldAlert className="size-8 text-destructive" />
          </div>
          <p className="text-lg font-semibold text-foreground">{t('loadError')}</p>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">{error}</p>
          <p className="text-xs text-muted-foreground/70 mt-2">{t('loadErrorHint')}</p>
          <Button onClick={onRetry} variant="outline" className="mt-6 gap-2 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-colors duration-200">
            <RefreshCw className="size-4" />
            {tc('retry')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
