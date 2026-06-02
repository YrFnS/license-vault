import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Activity } from 'lucide-react';
import type { ActivityEntry } from './types';
import { ACTIVITY_CONFIG, DEFAULT_ACTIVITY_CONFIG } from './constants';
import { getRelativeTime } from './helpers';

interface ActivityTimelineProps {
  activityEntries: ActivityEntry[];
  activityLoading: boolean;
}

function buildDescription(entry: ActivityEntry): string {
  const name = entry.entityName || 'item';
  switch (entry.action) {
    case 'LICENSE_CREATED':
      return `Created license "${name}"`;
    case 'LICENSE_UPDATED':
      return entry.details || `Updated license "${name}"`;
    case 'LICENSE_DELETED':
      return `Deleted license "${name}"`;
    case 'LICENSE_IMPORTED':
      return entry.details || 'Imported licenses';
    case 'LICENSE_EXPORTED':
      return entry.details || 'Exported licenses';
    case 'DOCUMENT_UPLOADED':
      return entry.details || `Uploaded document to "${name}"`;
    case 'DOCUMENT_DELETED':
      return entry.details || `Deleted document from "${name}"`;
    case 'renew':
      return entry.details || `Renewed license "${name}"`;
    default:
      return entry.details || `Performed ${entry.action.toLowerCase().replace(/_/g, ' ')}`;
  }
}

export function ActivityTimeline({ activityEntries, activityLoading }: ActivityTimelineProps) {
  const tA = useTranslations('licenses.activity');

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          {tA('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activityLoading ? (
          <div className="relative ps-6 space-y-5">
            <div className="absolute start-2.5 top-2 bottom-2 w-px bg-border" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="relative flex items-start gap-3">
                <div className="absolute -start-6 top-1.5 size-3 rounded-full bg-muted-foreground/20 ring-2 ring-background" />
                <Skeleton className="shrink-0 size-7 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-full max-w-[200px]" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : activityEntries.length > 0 ? (
          <ScrollArea className="max-h-96">
            <div className="relative ps-6">
              {/* Vertical timeline line */}
              <div className="absolute start-2.5 top-2 bottom-2 w-px bg-gradient-to-b from-border via-border/60 to-transparent" />

              {activityEntries.map((entry, index) => {
                const config = ACTIVITY_CONFIG[entry.action] || DEFAULT_ACTIVITY_CONFIG;
                const Icon = config.icon;
                const isLast = index === activityEntries.length - 1;
                const description = buildDescription(entry);

                return (
                  <div
                    key={entry.id}
                    className={`relative pb-5 ${isLast ? 'pb-0' : ''}`}
                  >
                    {/* Timeline dot */}
                    <div className={`absolute -start-6 top-1.5 size-3 rounded-full ${config.dotColor} ring-2 ring-background shadow-sm`} />

                    {/* Content */}
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 rounded-lg p-1.5 ${config.bgColor}`}>
                        <Icon className={`size-3.5 ${config.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug">
                          {description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {entry.userName && (
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                              {entry.userName}
                            </span>
                          )}
                          {entry.userName && (
                            <span className="text-xs text-muted-foreground/40">·</span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground/70 shrink-0">
                            <Clock className="size-2.5" />
                            {getRelativeTime(entry.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/20 p-5 mb-4">
              <Activity className="size-10 text-emerald-400 dark:text-emerald-500" />
            </div>
            <p className="font-medium text-foreground">{tA('noActivity')}</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {tA('noActivityDesc')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
