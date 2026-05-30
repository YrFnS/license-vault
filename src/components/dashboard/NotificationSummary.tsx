'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Bell, AlertTriangle, XCircle, Info, ArrowRight, BellOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

function getNotificationIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('expired') || lower.includes('منتهي')) return XCircle;
  if (lower.includes('expir') || lower.includes('ينتهي') || lower.includes('تنبيه')) return AlertTriangle;
  return Info;
}

function getNotificationIconColor(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('expired') || lower.includes('منتهي')) return 'text-red-500';
  if (lower.includes('expir') || lower.includes('ينتهي') || lower.includes('تنبيه')) return 'text-amber-500';
  return 'text-teal-500';
}

function getNotificationBgColor(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('expired') || lower.includes('منتهي')) return 'bg-red-50 dark:bg-red-950/30';
  if (lower.includes('expir') || lower.includes('ينتهي') || lower.includes('تنبيه')) return 'bg-amber-50 dark:bg-amber-950/30';
  return 'bg-teal-50 dark:bg-teal-950/30';
}

function timeAgo(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return locale === 'ar' ? 'الآن' : 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return locale === 'ar' ? `منذ ${minutes} د` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === 'ar' ? `منذ ${hours} س` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return locale === 'ar' ? `منذ ${days} ي` : `${days}d`;
}

export function NotificationSummary() {
  const t = useTranslations('dashboard');
  const tn = useTranslations('notifications');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const json = await res.json();
      setNotifications(json.notifications || []);
      setUnreadCount(json.unreadCount || 0);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const latestNotifications = notifications.slice(0, 3);

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{t('notificationSummary')}</CardTitle>
          {unreadCount > 0 && (
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 text-[10px] px-1.5 py-0 min-w-[20px] flex items-center justify-center shadow-sm shadow-emerald-500/20">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs text-muted-foreground hover:text-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors duration-200 gap-1"
        >
          <Link href="/dashboard">
            {tc('viewAll')}
            <ArrowRight className="size-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="size-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : latestNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted/50 p-3 mb-3">
              <BellOff className="size-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">{tc('noNotifications')}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {latestNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.title);
              const iconColor = getNotificationIconColor(notification.title);
              const bgColor = getNotificationBgColor(notification.title);
              return (
                <div
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors duration-150 hover:bg-muted/40',
                    !notification.read && 'bg-emerald-50/40 dark:bg-emerald-950/10'
                  )}
                >
                  <div className={cn('shrink-0 rounded-lg p-1.5 mt-0.5', bgColor)}>
                    <Icon className={cn('size-3.5', iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm leading-snug truncate',
                      !notification.read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'
                    )}>
                      {notification.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground truncate flex-1">
                        {notification.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">
                        {timeAgo(notification.createdAt, locale)}
                      </span>
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="size-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0 mt-2 shadow-sm shadow-emerald-500/30" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function NotificationSummarySkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-7 w-16" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="size-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
