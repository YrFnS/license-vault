import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';

export default function PageHeader() {
  const t = useTranslations('stateRequirements');

  return (
    <div className="flex items-start gap-3">
      <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900 shrink-0">
        <MapPin className="size-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>
    </div>
  );
}
