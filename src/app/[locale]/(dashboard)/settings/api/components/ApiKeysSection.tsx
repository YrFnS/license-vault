import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Key, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApiKeyData } from './types';
import { formatDate, PermissionBadge } from './helpers';

interface ApiKeysSectionProps {
  t: (key: string) => string;
  apiKeys: ApiKeyData[];
  keysLoading: boolean;
  onCreateClick: () => void;
  onRevokeClick: (id: string) => void;
  onCopyPrefix: (prefix: string) => void;
}

export function ApiKeysSection({
  t,
  apiKeys,
  keysLoading,
  onCreateClick,
  onRevokeClick,
  onCopyPrefix,
}: ApiKeysSectionProps) {
  const locale = useLocale();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle>{t('apiKeys.title')}</CardTitle>
          </div>
          <Button
            onClick={onCreateClick}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
          >
            <Plus className="size-4 me-1" />
            {t('apiKeys.create')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {keysLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-10 border rounded-lg border-dashed">
            <div className="rounded-full bg-muted p-3 mx-auto w-fit mb-3">
              <Key className="size-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{t('apiKeys.noKeys')}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{t('apiKeys.noKeysDesc')}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onCreateClick}>
              <Plus className="size-4 me-1" />
              {t('apiKeys.create')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border transition-colors',
                  apiKey.isActive
                    ? 'bg-card hover:bg-muted/30 border-border/50'
                    : 'bg-muted/20 border-border/30 opacity-60'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{apiKey.name}</span>
                    <PermissionBadge perm={apiKey.permissions} />
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs cursor-pointer',
                        apiKey.isActive
                          ? 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                          : 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                      )}
                      onClick={() => onCopyPrefix(apiKey.keyPrefix)}
                    >
                      {apiKey.keyPrefix}••••
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                    <span>
                      {t('apiKeys.lastUsed')}: {formatDate(apiKey.lastUsedAt, locale, t)}
                    </span>
                    <span>
                      {t('apiKeys.expires')}: {apiKey.expiresAt ? formatDate(apiKey.expiresAt, locale, t) : t('apiKeys.never')}
                    </span>
                    <span>{apiKey.isActive ? t('apiKeys.active') : t('apiKeys.revoked')}</span>
                  </div>
                </div>
                {apiKey.isActive && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => onRevokeClick(apiKey.id)}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">{t('apiKeys.revoke')}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('apiKeys.revoke')}</TooltipContent>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
