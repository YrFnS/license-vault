import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Unplug, AlertCircle, RefreshCw } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('integrations');

  switch (status) {
    case 'connected':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-1">
          <CheckCircle2 className="size-3" />
          {t('connected')}
        </Badge>
      );
    case 'disconnected':
      return (
        <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 gap-1">
          <Unplug className="size-3" />
          {t('disconnected')}
        </Badge>
      );
    case 'error':
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800 gap-1">
          <AlertCircle className="size-3" />
          {t('error')}
        </Badge>
      );
    case 'syncing':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 gap-1">
          <RefreshCw className="size-3 animate-spin" />
          {t('syncing')}
        </Badge>
      );
    default:
      return null;
  }
}
