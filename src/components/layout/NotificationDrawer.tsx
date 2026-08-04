"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Bell, BellOff, Check, Info, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

function getNotificationAppearance(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("expired") || lower.includes("منتهي")) {
    return { Icon: XCircle, className: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400" };
  }
  if (lower.includes("expir") || lower.includes("ينتهي") || lower.includes("تنبيه")) {
    return { Icon: AlertTriangle, className: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" };
  }
  return { Icon: Info, className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" };
}

function timeAgo(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) return locale === "ar" ? "الآن" : "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return locale === "ar" ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === "ar" ? `منذ ${hours} ساعة` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return locale === "ar" ? `منذ ${days} يوم` : `${days}d ago`;

  return date.toLocaleDateString(locale === "ar" ? "ar-IQ" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

export function NotificationDrawer() {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      setNotifications(payload.notifications || []);
      setUnreadCount(payload.unreadCount || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  const handleMarkAllRead = async () => {
    const response = await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    if (!response.ok) return;

    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  };

  const handleMarkOneRead = async (id: string) => {
    const response = await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationIds: [id] }),
    });
    if (!response.ok) return;

    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-8" aria-label={t("title")}>
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -end-1 -top-1 flex size-4 items-center justify-center border-0 bg-emerald-600 p-0 text-[10px] text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        className="flex w-full flex-col p-0 sm:w-96"
      >
        <SheetHeader className="border-b px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="size-4 text-emerald-600" />
              {t("title")}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs">
                <Check className="me-1 size-3" />
                {tc("markAllRead")}
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex animate-pulse gap-3">
                  <div className="size-8 shrink-0 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <BellOff className="size-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{tc("noNotifications")}</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const { Icon, className } = getNotificationAppearance(notification.title);
                return (
                  <article
                    key={notification.id}
                    className={cn(
                      "flex gap-3 px-4 py-3",
                      !notification.read && "bg-emerald-50/50 dark:bg-emerald-950/10",
                    )}
                  >
                    <div className={cn("mt-0.5 rounded-full p-1.5", className)}>
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm leading-tight", !notification.read && "font-semibold")}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() => handleMarkOneRead(notification.id)}
                            className="rounded p-1 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950/40"
                            aria-label={tc("markAllRead")}
                          >
                            <Check className="size-3" />
                          </button>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground/70">
                        {timeAgo(notification.createdAt, locale)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
