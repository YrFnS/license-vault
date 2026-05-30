'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Bell, Check, AlertTriangle, XCircle, Info, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

function getNotificationIconBg(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('expired') || lower.includes('منتهي')) return 'bg-gradient-to-br from-red-500/15 to-red-600/10';
  if (lower.includes('expir') || lower.includes('ينتهي') || lower.includes('تنبيه')) return 'bg-gradient-to-br from-amber-500/15 to-amber-600/10';
  return 'bg-gradient-to-br from-teal-500/15 to-emerald-500/10';
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

function timeAgo(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return locale === 'ar' ? 'الآن' : 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return locale === 'ar' ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === 'ar' ? `منذ ${hours} ساعة` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return locale === 'ar' ? `منذ ${days} يوم` : `${days}d ago`;
  return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
}

export function NotificationDrawer() {
  const t = useTranslations('notifications');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const json = await res.json();
      setNotifications(json.notifications || []);
      setUnreadCount(json.unreadCount || 0);

      // Auto-seed if no notifications exist
      if (json.notifications && json.notifications.length === 0) {
        const seedRes = await fetch('/api/notifications/seed');
        if (seedRes.ok) {
          const seedData = await seedRes.json();
          if (seedData.created > 0) {
            // Re-fetch after seeding
            const res2 = await fetch('/api/notifications');
            if (res2.ok) {
              const json2 = await res2.json();
              setNotifications(json2.notifications || []);
              setUnreadCount(json2.unreadCount || 0);
            }
          }
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Re-fetch when drawer opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch {
      // Silently fail
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [id] }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Silently fail
    }
  };

  const sheetSide = locale === 'ar' ? 'left' : 'right';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative transition-all duration-200 hover:bg-muted/80">
          <Bell className="size-4 transition-transform duration-300 hover:rotate-12" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -end-1 size-4 p-0 flex items-center justify-center text-[10px] bg-gradient-to-r from-emerald-500 to-teal-500 border-0 animate-pulse shadow-sm shadow-emerald-500/30">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">{t('title')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side={sheetSide} className="w-full sm:w-96 p-0 flex flex-col">
        <SheetHeader className="px-4 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="size-4 text-primary" />
              {t('title')}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:text-primary/80"
              >
                <Check className="size-3 me-1" />
                {tc('markAllRead')}
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="size-8 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <BellOff className="size-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{tc('noNotifications')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.title);
                const iconColor = getNotificationIconColor(notification.title);
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex gap-3 px-4 py-3 transition-all duration-200 hover:bg-muted/50 cursor-default',
                      !notification.read && 'bg-gradient-to-r from-emerald-50/60 to-teal-50/30 dark:from-emerald-950/15 dark:to-teal-950/10'
                    )}
                  >
                    <div className="shrink-0 mt-0.5">
                      <div className={cn('rounded-full p-1.5', getNotificationIconBg(notification.title), iconColor)}>
                        <Icon className="size-3.5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-sm leading-tight',
                          !notification.read ? 'font-semibold' : 'font-medium text-muted-foreground'
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkOneRead(notification.id)}
                            className="shrink-0 mt-0.5 p-0.5 rounded hover:bg-emerald-500/10 transition-all duration-200 hover:scale-110"
                            title={tc('markAllRead')}
                          >
                            <Check className="size-3 text-emerald-500" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {timeAgo(notification.createdAt, locale)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="size-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0 mt-2 shadow-sm shadow-emerald-500/30" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
