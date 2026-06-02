import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Terminal, ExternalLink } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface ApiDocsFullLinkProps {
  t: (key: string) => string;
}

export function ApiDocsFullLink({ t }: ApiDocsFullLinkProps) {
  return (
    <Card className="border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
              <Terminal className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-medium">{t('docs.viewFullDocs')}</p>
              <p className="text-sm text-muted-foreground">{t('docs.viewFullDocsDesc')}</p>
            </div>
          </div>
          <Link href="/developer-settings/api-docs">
            <Button
              variant="outline"
              className="gap-2 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              {t('docs.viewFullDocs')}
              <ExternalLink className="size-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
