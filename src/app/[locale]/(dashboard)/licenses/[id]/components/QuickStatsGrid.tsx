import { useTranslations } from 'next-intl';
import { Calendar, Clock, ShieldCheck, ShieldAlert } from 'lucide-react';
import { QuickStatCard } from './QuickStatCard';

interface QuickStatsGridProps {
  daysActive: number | null;
  daysUntilExpiration: number | null;
  isRenewed: boolean;
}

export function QuickStatsGrid({ daysActive, daysUntilExpiration, isRenewed }: QuickStatsGridProps) {
  const t = useTranslations('licenses');
  const tR = useTranslations('renewal');

  const daysColorClass =
    daysUntilExpiration !== null && daysUntilExpiration < 0
      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
      : daysUntilExpiration !== null && daysUntilExpiration <= 30
        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
        : 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800';

  const daysIconColor =
    daysUntilExpiration !== null && daysUntilExpiration < 0
      ? 'text-red-600 dark:text-red-400'
      : daysUntilExpiration !== null && daysUntilExpiration <= 30
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-teal-600 dark:text-teal-400';

  const renewalColorClass = isRenewed
    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
    : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <QuickStatCard
        icon={<Calendar className="size-5 text-emerald-600 dark:text-emerald-400" />}
        label={t('detail.daysActive')}
        value={daysActive !== null ? `${daysActive}` : '—'}
        colorClass="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
      />
      <QuickStatCard
        icon={<Clock className={`size-5 ${daysIconColor}`} />}
        label={t('detail.daysUntilExpiration')}
        value={daysUntilExpiration !== null ? `${daysUntilExpiration}` : '—'}
        colorClass={daysColorClass}
      />
      <QuickStatCard
        icon={isRenewed
          ? <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
          : <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400" />
        }
        label={t('detail.renewalStatus')}
        value={isRenewed ? t('detail.renewed') : t('detail.notRenewed')}
        colorClass={renewalColorClass}
      />
    </div>
  );
}
