import { useTranslations } from 'next-intl';
import { CheckCircle2, Puzzle } from 'lucide-react';

export function EmptyAllConnected() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-500" />
      <p className="font-medium text-emerald-600 dark:text-emerald-400">All integrations connected</p>
      <p className="text-sm">You&apos;ve connected all available integrations for this category</p>
    </div>
  );
}

export function EmptyNoIntegrations() {
  const t = useTranslations('integrations');
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Puzzle className="size-12 mx-auto mb-3 text-muted-foreground/50" />
      <p className="font-medium text-lg">{t('noIntegrations')}</p>
      <p className="text-sm mt-1">{t('noIntegrationsDesc')}</p>
    </div>
  );
}
