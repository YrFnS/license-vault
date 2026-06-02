import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Code2, ChevronDown, Shield, Webhook } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WEBHOOK_EVENTS } from './constants';
import { useEventLabel } from './helpers';

interface ApiDocsSectionProps {
  t: (key: string) => string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ENDPOINTS = [
  { method: 'GET', path: '/api/v1/licenses', descKey: 'docs.getLicenses' },
  { method: 'GET', path: '/api/v1/licenses/:id', descKey: 'docs.getLicense' },
  { method: 'GET', path: '/api/v1/compliance', descKey: 'docs.getCompliance' },
  { method: 'GET', path: '/api/v1/projects', descKey: 'docs.getProjects' },
];

export function ApiDocsSection({ t, open, onOpenChange }: ApiDocsSectionProps) {
  const getEventLabel = useEventLabel();
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  const displayUrl = `${baseUrl}/api/v1`;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle>{t('docs.title')}</CardTitle>
              </div>
              <ChevronDown
                className={cn(
                  'size-5 text-muted-foreground transition-transform duration-200',
                  open && 'rotate-180'
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Base URL */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t('docs.baseUrl')}</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 rounded-lg bg-muted font-mono text-sm">
                  {displayUrl}
                </code>
              </div>
            </div>

            {/* Authentication */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Shield className="size-4 text-emerald-600" />
                {t('docs.auth')}
              </Label>
              <p className="text-sm text-muted-foreground">{t('docs.authDesc')}</p>
              <div className="rounded-lg bg-muted p-4 font-mono text-sm overflow-x-auto">
                <div className="text-muted-foreground">{'# '}{t('docs.authDesc')}</div>
                <div>
                  <span className="text-blue-600 dark:text-blue-400">Authorization</span>
                  :{' '}
                  <span className="text-emerald-600 dark:text-emerald-400">Bearer</span>{' '}
                  lv_live_your_api_key_here
                </div>
              </div>
            </div>

            {/* Endpoints */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">{t('docs.endpoints')}</Label>
              {ENDPOINTS.map((endpoint) => (
                <div
                  key={endpoint.path}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20"
                >
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-mono text-xs px-2">
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm font-mono">{endpoint.path}</code>
                  <span className="text-xs text-muted-foreground ms-auto">
                    {t(endpoint.descKey as any)}
                  </span>
                </div>
              ))}
            </div>

            {/* Example curl */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t('docs.example')}</Label>
              <div className="rounded-lg bg-slate-950 dark:bg-slate-900 p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-emerald-400">
{`curl -X GET \\
  ${process.env.NEXT_PUBLIC_API_URL || 'https://api.licensevault.app'}/api/v1/licenses \\
  -H "Authorization: Bearer lv_live_your_api_key" \\
  -H "Content-Type: application/json"`}
                </pre>
              </div>
            </div>

            {/* Event Types Reference */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Webhook Event Types</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <div
                    key={event}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/30 text-sm"
                  >
                    <Webhook className="size-3.5 text-emerald-600 shrink-0" />
                    <code className="text-xs font-mono">{event}</code>
                    <span className="text-xs text-muted-foreground ms-auto">
                      {getEventLabel(event)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
