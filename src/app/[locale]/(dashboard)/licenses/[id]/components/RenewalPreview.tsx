import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface RenewalPreviewProps {
  daysUntilExpiration: number | null;
  onRenewClick: () => void;
}

export function RenewalPreview({ daysUntilExpiration, onRenewClick }: RenewalPreviewProps) {
  const tR = useTranslations('renewal');

  return (
    <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
      <CardContent className="p-4 flex items-center gap-3">
        <RefreshCw className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            {tR('renewButton')}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            {daysUntilExpiration !== null && daysUntilExpiration < 0
              ? tR('expiredAgo', { days: Math.abs(daysUntilExpiration) })
              : daysUntilExpiration !== null
                ? tR('daysUntilExpiry', { days: daysUntilExpiration })
                : ''}
          </p>
        </div>
        <Button size="sm" onClick={onRenewClick} className="ms-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shrink-0">
          <RefreshCw className="size-3.5 me-1" />
          {tR('confirm')}
        </Button>
      </CardContent>
    </Card>
  );
}
