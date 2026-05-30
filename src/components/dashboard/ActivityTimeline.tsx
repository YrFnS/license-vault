'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Download,
  UserPlus,
  Settings,
  Activity,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';

export interface ActivityEntry {
  id: string;
  action: string;
  entityType: string;
  entityName?: string | null;
  details?: string | null;
  userName?: string | null;
  createdAt: string;
}

interface ActivityTimelineProps {
  activities: ActivityEntry[];
}

// Action type configuration: icon + color classes
const ACTION_CONFIG: Record<string, {
  icon: typeof Plus;
  iconColor: string;
  dotColor: string;
  bgColor: string;
}> = {
  LICENSE_CREATED: {
    icon: Plus,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  LICENSE_UPDATED: {
    icon: Pencil,
    iconColor: 'text-teal-600 dark:text-teal-400',
    dotColor: 'bg-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
  },
  LICENSE_DELETED: {
    icon: Trash2,
    iconColor: 'text-red-600 dark:text-red-400',
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  LICENSE_IMPORTED: {
    icon: Upload,
    iconColor: 'text-amber-600 dark:text-amber-400',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  LICENSE_EXPORTED: {
    icon: Download,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    dotColor: 'bg-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
  },
  USER_INVITED: {
    icon: UserPlus,
    iconColor: 'text-violet-600 dark:text-violet-400',
    dotColor: 'bg-violet-500',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
  },
  SETTINGS_UPDATED: {
    icon: Settings,
    iconColor: 'text-slate-600 dark:text-slate-400',
    dotColor: 'bg-slate-500',
    bgColor: 'bg-slate-100 dark:bg-slate-800/50',
  },
};

const DEFAULT_CONFIG = {
  icon: Activity,
  iconColor: 'text-muted-foreground',
  dotColor: 'bg-muted-foreground',
  bgColor: 'bg-muted/50',
};

function getActionConfig(action: string) {
  return ACTION_CONFIG[action] || DEFAULT_CONFIG;
}

// Relative time formatting
function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 5) return `${diffWeek}w ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Action description builder
function getActionDescription(action: string, entityName?: string | null, details?: string | null): string {
  const name = entityName || 'item';
  switch (action) {
    case 'LICENSE_CREATED':
      return `Created license "${name}"`;
    case 'LICENSE_UPDATED':
      return `Updated license "${name}"`;
    case 'LICENSE_DELETED':
      return `Deleted license "${name}"`;
    case 'LICENSE_IMPORTED':
      return details || `Imported licenses`;
    case 'LICENSE_EXPORTED':
      return details || `Exported licenses`;
    case 'USER_INVITED':
      return details || `Invited a new team member`;
    case 'SETTINGS_UPDATED':
      return details || `Updated organization settings`;
    default:
      return details || `Performed ${action.toLowerCase().replace(/_/g, ' ')}`;
  }
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const t = useTranslations('dashboard');

  if (activities.length === 0) {
    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader>
          <CardTitle>{t('activityTimeline')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative flex flex-col items-center justify-center py-12 text-center overflow-hidden rounded-lg">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-muted/10 to-transparent" />
            <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/20 p-5 mb-4 shadow-sm">
                <Activity className="size-10 text-emerald-400 dark:text-emerald-500" />
              </div>
              <p className="font-semibold text-foreground">{t('noActivity')}</p>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
                {t('noActivityDesc')}
              </p>
              <Button variant="outline" size="sm" className="mt-4 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-colors duration-200" asChild>
                <Link href="/licenses/new">
                  <Plus className="size-4 me-1" />
                  {t('addLicense')}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>{t('activityTimeline')}</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs text-muted-foreground hover:text-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors duration-200"
        >
          <Link href="/audit-log">
            {t('viewAllActivity')}
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-96">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative ps-6"
          >
            {/* Vertical timeline line */}
            <div className="absolute start-2.5 top-2 bottom-2 w-px bg-gradient-to-b from-border via-border/60 to-transparent" />

            {activities.map((entry, index) => {
              const config = getActionConfig(entry.action);
              const Icon = config.icon;
              const isLast = index === activities.length - 1;

              return (
                <motion.div
                  key={entry.id}
                  variants={itemVariants}
                  className={`relative pb-5 rounded-lg transition-colors duration-150 hover:bg-muted/30 ${isLast ? 'pb-0' : ''}`}
                >
                  {/* Timeline dot */}
                  <div className={`absolute -start-6 top-1.5 size-3.5 rounded-full ${config.dotColor} ring-2 ring-background shadow-sm shadow-current/20`} />

                  {/* Content */}
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 rounded-lg p-1.5 ${config.bgColor}`}>
                      <Icon className={`size-3.5 ${config.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">
                        {getActionDescription(entry.action, entry.entityName, entry.details)}
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
                </motion.div>
              );
            })}
          </motion.div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Loading skeleton for the timeline
export function ActivityTimelineSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-7 w-20" />
      </CardHeader>
      <CardContent>
        <div className="relative ps-6 space-y-5">
          {/* Vertical line skeleton */}
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
      </CardContent>
    </Card>
  );
}
