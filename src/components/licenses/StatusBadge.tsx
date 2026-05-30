'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'expiring_soon' | 'expired';
  daysUntil?: number;
  className?: string;
}

export function StatusBadge({ status, daysUntil, className }: StatusBadgeProps) {
  const t = useTranslations('licenses.status');

  const config = {
    active: {
      label: t('active'),
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    },
    expiring_soon: {
      label: t('expiringSoon'),
      className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    },
    expired: {
      label: t('expired'),
      className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    },
  };

  const { label, className: colorClass } = config[status];

  return (
    <Badge
      variant="outline"
      className={cn(colorClass, className)}
    >
      {label}
      {status === 'expiring_soon' && daysUntil !== undefined && (
        <span className="ms-1 text-xs opacity-80">
          ({daysUntil}d)
        </span>
      )}
    </Badge>
  );
}
