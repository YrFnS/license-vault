import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

export function formatDate(
  date: string | null,
  locale: string,
  t: (key: string) => string
) {
  if (!date) return t('apiKeys.never');
  return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function useEventLabel() {
  const t = useTranslations('apiAccess');
  return (event: string) => {
    const map: Record<string, string> = {
      'license.created': t('events.licenseCreated'),
      'license.updated': t('events.licenseUpdated'),
      'license.expiring': t('events.licenseExpiring'),
      'license.expired': t('events.licenseExpired'),
      'insurance.expiring': t('events.insuranceExpiring'),
      'insurance.expired': t('events.insuranceExpired'),
      'compliance.changed': t('events.complianceChanged'),
      'approval.created': t('events.approvalCreated'),
      'approval.approved': t('events.approvalApproved'),
      'approval.rejected': t('events.approvalRejected'),
    };
    return map[event] || event;
  };
}

export function PermissionBadge({ perm }: { perm: string }) {
  const t = useTranslations('apiAccess');
  switch (perm) {
    case 'admin':
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800 text-xs">
          {t('apiKeys.admin')}
        </Badge>
      );
    case 'write':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-xs">
          {t('apiKeys.write')}
        </Badge>
      );
    default:
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs">
          {t('apiKeys.read')}
        </Badge>
      );
  }
}
