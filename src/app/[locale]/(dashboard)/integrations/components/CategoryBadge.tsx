import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const t = useTranslations('integrations');

  switch (category) {
    case 'construction_erp':
      return <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400">{t('constructionErp')}</Badge>;
    case 'accounting':
      return <Badge variant="outline" className="text-xs border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-400">{t('accounting')}</Badge>;
    case 'hris':
      return <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">{t('hrPayroll')}</Badge>;
    case 'custom':
      return <Badge variant="outline" className="text-xs border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-400">{t('custom')}</Badge>;
    default:
      return null;
  }
}
