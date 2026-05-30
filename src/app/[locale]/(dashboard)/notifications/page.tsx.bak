'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Bell,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Trash2,
  BellOff,
  Clock,
  Shield,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

type FilterTab = 'all' | 'unread' | 'expirations' | 'reminders' | 'system';

function getNotificationType(title: string): 'expiration' | 'reminder' | 'system' {
  const lower = title.toLowerCase();
  if (lower.includes('expired') || lower.includes('منتهي') || lower.includes('expir') || lower.includes('ينتهي')) {
    return 'expiration';
  }
  if (lower.includes('remind') || lower.includes('تذكير') || lower.includes('renewal') || lower.includes('تجديد')) {
    return 'reminder';
  }
  return 'system';
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'expiration':
      return AlertTriangle;
    case 'reminder':
      return Clock;
    default:
      return Info;
  }
}

function getNotificationIconColor(type: string) {
  switch (type) {
    case 'expiration':
      return 'text-amber-500';
    case 'reminder':
      return 'text-teal-500';
    default:
      return 'text-emerald-500';
  }
}

function getNotificationIconBg(type: string) {
  switch (type) {
    case 'expiration':
      return 'bg-gradient-to-br from-amber-500/15 to-amber-600/10 dark:from-amber-500/10 dark:to-amber-600/5';
    case 'reminder':
      return 'bg-gradient-to-br from-teal-500/15 to-emerald-500/10 dark:from-teal-500/10 dark:to-emerald-500/5';
    default:
      return 'bg-gradient-to-br from-emerald-500/15 to-teal-500/10 dark:from-emerald-500/10 dark:to-teal-500/5';
  }
}

function getNotificationBorderColor(type: string) {
  switch (type) {
    case 'expiration':
      return 'border-s-amber-400 dark:border-s-amber-600';
    case 'reminder':
      return 'border-s-teal-400 dark:border-s-teal-600';
    default:
      return 'border-s-emerald-400 dark:border-s-emerald-600';
  }
}

function timeAgo(dateStr: string, t: any): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return t('justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('minutesAgo', { minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('hoursAgo', { hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t('daysAgo', { days });
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const t = useTranslations('notifications.page');
  const tc = useTranslations('common');
  const tn = useTranslations('notifications');
  const locale = useLocale();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      toast.error(t('clearAllError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkOneRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        toast.success(t('markReadSuccess'));
      } else {
        toast.error(t('markReadError'));
      }
    } catch {
      toast.error(t('markReadError'));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success(t('markReadSuccess'));
      }
    } catch {
      toast.error(t('markReadError'));
    }
  };

  const handleDeleteOne = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        toast.success(t('deleteSuccess'));
      } else {
        toast.error(t('deleteError'));
      }
    } catch {
      toast.error(t('deleteError'));
    }
  };

  const handleClearAll = async () => {
    try {
      // Delete all notifications one by one (batch)
      const deletePromises = notifications.map((n) =>
        fetch(`/api/notifications/${n.id}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);
      setNotifications([]);
      toast.success(t('clearAllSuccess'));
    } catch {
      toast.error(t('clearAllError'));
    }
    setShowClearAllDialog(false);
  };

  // Computed values
  const unreadCount = notifications.filter((n) => !n.read).length;
  const expirationCount = notifications.filter((n) => getNotificationType(n.title) === 'expiration').length;
  const reminderCount = notifications.filter((n) => getNotificationType(n.title) === 'reminder').length;
  const systemCount = notifications.filter((n) => getNotificationType(n.title) === 'system').length;

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    switch (activeFilter) {
      case 'unread':
        return !n.read;
      case 'expirations':
        return getNotificationType(n.title) === 'expiration';
      case 'reminders':
        return getNotificationType(n.title) === 'reminder';
      case 'system':
        return getNotificationType(n.title) === 'system';
      default:
        return true;
    }
  });

  const filterTabs: { key: FilterTab; count: number }[] = [
    { key: 'all', count: notifications.length },
    { key: 'unread', count: unreadCount },
    { key: 'expirations', count: expirationCount },
    { key: 'reminders', count: reminderCount },
    { key: 'system', count: systemCount },
  ];

  // Summary cards data
  const summaryCards = [
    {
      label: t('totalNotifications'),
      value: notifications.length,
      icon: Bell,
      color: 'teal',
      gradient: 'from-teal-50/90 via-teal-50/60 to-teal-100/40 border-s-teal-400 dark:from-teal-950/40 dark:via-teal-950/20 dark:to-teal-900/10 dark:border-s-teal-600',
      iconBg: 'bg-teal-100 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400',
    },
    {
      label: t('unreadNotifications'),
      value: unreadCount,
      icon: CheckCircle2,
      color: 'emerald',
      gradient: 'from-emerald-50/90 via-emerald-50/60 to-emerald-100/40 border-s-emerald-400 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-emerald-900/10 dark:border-s-emerald-600',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: t('expirationAlerts'),
      value: expirationCount,
      icon: AlertTriangle,
      color: 'amber',
      gradient: 'from-amber-50/90 via-amber-50/60 to-amber-100/40 border-s-amber-400 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-amber-900/10 dark:border-s-amber-600',
      iconBg: 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
    },
    {
      label: t('reminders'),
      value: reminderCount,
      icon: Clock,
      color: 'teal',
      gradient: 'from-teal-50/90 via-teal-50/60 to-emerald-100/40 border-s-teal-400 dark:from-teal-950/40 dark:via-teal-950/20 dark:to-emerald-900/10 dark:border-s-teal-600',
      iconBg: 'bg-teal-100 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="absolute -top-12 -end-12 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -start-8 size-32 rounded-full bg-white/5 blur-xl" />
        <div className="relative flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
            <Bell className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{t('title')}</h1>
            <p className="text-white/75 text-sm mt-0.5">{t('description')}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={cn('bg-gradient-to-br border-s-4', card.gradient, 'hover:shadow-md transition-shadow')}>
                <CardContent className="p-3 md:p-4 lg:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">{card.label}</p>
                      <p className="text-2xl lg:text-4xl font-extrabold tabular-nums mt-1">{card.value}</p>
                    </div>
                    <div className={cn('p-2 lg:p-3 rounded-xl', card.iconBg)}>
                      <Icon className="size-4 lg:size-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filter Tabs + Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                activeFilter === tab.key
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              {t(`filter${tab.key.charAt(0).toUpperCase() + tab.key.slice(1)}` as any)}
              {tab.count > 0 && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'h-5 min-w-5 px-1.5 text-[10px] font-bold',
                    activeFilter === tab.key
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
            >
              <Check className="size-3.5 me-1.5" />
              {t('markAllRead')}
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearAllDialog(true)}
              className="text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            >
              <Trash2 className="size-3.5 me-1.5" />
              {t('clearAll')}
            </Button>
          )}
        </div>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="size-10 rounded-xl bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 mb-4">
              <BellOff className="size-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground">{t('emptyTitle')}</h3>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm mx-auto">{t('emptyDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-400px)]">
          <div className="grid gap-2">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification, idx) => {
                const notifType = getNotificationType(notification.title);
                const Icon = getNotificationIcon(notifType);
                const iconColor = getNotificationIconColor(notifType);
                const iconBg = getNotificationIconBg(notifType);
                const borderColor = getNotificationBorderColor(notifType);

                return (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                    transition={{ delay: idx * 0.02, duration: 0.2 }}
                  >
                    <Card
                      className={cn(
                        'transition-all duration-200 hover:shadow-sm border-s-4',
                        borderColor,
                        !notification.read
                          ? 'bg-gradient-to-r from-emerald-50/60 via-teal-50/30 to-transparent dark:from-emerald-950/15 dark:via-teal-950/10 dark:to-transparent'
                          : 'bg-card'
                      )}
                    >
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={cn('shrink-0 mt-0.5 p-2 rounded-xl', iconBg)}>
                            <Icon className={cn('size-4', iconColor)} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={cn(
                                    'text-sm leading-tight truncate',
                                    !notification.read ? 'font-semibold' : 'font-medium text-muted-foreground'
                                  )}>
                                    {notification.title}
                                  </p>
                                  {!notification.read && (
                                    <span className="shrink-0 size-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/30" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-[10px] text-muted-foreground/60 mt-1.5 flex items-center gap-1">
                                  <Clock className="size-3" />
                                  {timeAgo(notification.createdAt, t)}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/30 transition-colors"
                                    onClick={() => handleMarkOneRead(notification.id)}
                                    title={t('markAsRead')}
                                  >
                                    <Check className="size-3.5" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                                  onClick={() => handleDeleteOne(notification.id)}
                                  title={t('deleteNotification')}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}

      {/* Clear All Confirmation */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('clearAll')}</AlertDialogTitle>
            <AlertDialogDescription>{t('clearAllConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
