import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Webhook, Plus, Copy, Check, Send, Pencil, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WebhookData } from './types';
import { formatDate, useEventLabel } from './helpers';

interface WebhooksSectionProps {
  t: (key: string) => string;
  tc: (key: string) => string;
  webhooks: WebhookData[];
  webhooksLoading: boolean;
  testingWebhookId: string | null;
  copiedSecret: string | null;
  onCreateClick: () => void;
  onEdit: (webhook: WebhookData) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  onCopySecret: (secret: string, id: string) => void;
}

export function WebhooksSection({
  t,
  tc,
  webhooks,
  webhooksLoading,
  testingWebhookId,
  copiedSecret,
  onCreateClick,
  onEdit,
  onDelete,
  onTest,
  onCopySecret,
}: WebhooksSectionProps) {
  const locale = useLocale();
  const getEventLabel = useEventLabel();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle>{t('webhooks.title')}</CardTitle>
          </div>
          <Button
            onClick={onCreateClick}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
          >
            <Plus className="size-4 me-1" />
            {t('webhooks.create')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {webhooksLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-10 border rounded-lg border-dashed">
            <div className="rounded-full bg-muted p-3 mx-auto w-fit mb-3">
              <Webhook className="size-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{t('webhooks.noWebhooks')}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{t('webhooks.noWebhooksDesc')}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onCreateClick}>
              <Plus className="size-4 me-1" />
              {t('webhooks.create')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className={cn(
                  'p-4 rounded-lg border transition-colors',
                  webhook.isActive
                    ? 'bg-card hover:bg-muted/30 border-border/50'
                    : 'bg-muted/20 border-border/30 opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{webhook.name}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          webhook.isActive
                            ? 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                            : 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                        )}
                      >
                        {webhook.isActive ? t('webhooks.active') : t('webhooks.inactive')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate font-mono">
                      {webhook.url}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {webhook.events.split(',').map((event) => (
                        <Badge key={event} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {getEventLabel(event)}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        {t('webhooks.lastTriggered')}: {formatDate(webhook.lastTriggeredAt, locale, t)}
                      </span>
                      {webhook.failureCount > 0 && (
                        <span className="text-red-600 dark:text-red-400">
                          {t('webhooks.failureCount')}: {webhook.failureCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => onCopySecret(webhook.secret, webhook.id)}
                        >
                          {copiedSecret === webhook.id ? (
                            <Check className="size-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                          <span className="sr-only">{t('webhooks.copySecret')}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('webhooks.copySecret')}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={testingWebhookId === webhook.id}
                          onClick={() => onTest(webhook.id)}
                        >
                          {testingWebhookId === webhook.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Send className="size-3.5" />
                          )}
                          <span className="sr-only">{t('webhooks.test')}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('webhooks.test')}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => onEdit(webhook)}
                        >
                          <Pencil className="size-3.5" />
                          <span className="sr-only">{tc('edit')}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{tc('edit')}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onDelete(webhook.id)}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">{tc('delete')}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{tc('delete')}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
