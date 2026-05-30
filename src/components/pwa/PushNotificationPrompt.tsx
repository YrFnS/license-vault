'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, AlertTriangle, CheckCircle2, Clock, X, Shield } from 'lucide-react';

const NOTIFICATION_PREF_KEY = 'lv_notification_preference';
const NOTIFICATION_ASKED_KEY = 'lv_notification_asked';
const ACTIVE_DELAY_MS = 30 * 1000; // Show after 30 seconds of activity

type NotificationPreference = 'granted' | 'denied' | 'default';

export function PushNotificationPrompt() {
  const t = useTranslations('pwa');
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const checkShouldShow = useCallback(() => {
    // Don't show if already asked
    const asked = localStorage.getItem(NOTIFICATION_ASKED_KEY);
    if (asked) return false;

    // Don't show if already granted or denied via browser
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = Notification.permission;
      if (permission === 'granted' || permission === 'denied') return false;
    }

    // Check stored preference
    const pref = localStorage.getItem(NOTIFICATION_PREF_KEY) as NotificationPreference | null;
    if (pref === 'denied') return false;

    return true;
  }, []);

  useEffect(() => {
    if (!checkShouldShow()) return;

    // Only show on HTTPS or localhost
    if (typeof window !== 'undefined' && location.protocol !== 'https:' && location.hostname !== 'localhost') {
      return;
    }

    // Don't show if Notification API not available
    if (typeof window !== 'undefined' && !('Notification' in window)) {
      return;
    }

    // Delay showing the prompt until user has been active for a while
    const timer = setTimeout(() => {
      // Check again in case state changed during delay
      if (checkShouldShow()) {
        setShowPrompt(true);
      }
    }, ACTIVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [checkShouldShow]);

  const handleGrant = async () => {
    setIsRequesting(true);

    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          localStorage.setItem(NOTIFICATION_PREF_KEY, 'granted');

          // Show a test notification
          try {
            new Notification(t('notificationWelcomeTitle'), {
              body: t('notificationWelcomeBody'),
              icon: '/icons/icon-192x192.png',
              badge: '/icons/maskable-icon-192x192.png',
              tag: 'welcome',
            });
          } catch {
            // Notification might fail in some contexts
          }

          // Register for push if service worker is available
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
              // We'd normally send the subscription to the server here
              // For now, just log that push is available
              console.log('Push notifications ready for subscription');
            }
          }
        } else {
          localStorage.setItem(NOTIFICATION_PREF_KEY, 'denied');
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsRequesting(false);
      localStorage.setItem(NOTIFICATION_ASKED_KEY, Date.now().toString());
      setShowPrompt(false);
    }
  };

  const handleDeny = () => {
    localStorage.setItem(NOTIFICATION_PREF_KEY, 'denied');
    localStorage.setItem(NOTIFICATION_ASKED_KEY, Date.now().toString());
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    // Dismiss without storing preference - will ask again next session
    setShowPrompt(false);
  };

  const notificationTypes = [
    { icon: AlertTriangle, label: t('notificationExpiring'), color: 'text-amber-500' },
    { icon: CheckCircle2, label: t('notificationCompliance'), color: 'text-emerald-500' },
    { icon: Clock, label: t('notificationRenewal'), color: 'text-teal-500' },
    { icon: Shield, label: t('notificationSecurity'), color: 'text-cyan-500' },
  ];

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Notification Card */}
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 end-3 z-10 size-7 flex items-center justify-center rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>

            {/* Header */}
            <div className="relative h-24 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center overflow-hidden">
              {/* Background decorations */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1 start-8 size-10 rounded-full border-2 border-white" />
                <div className="absolute bottom-2 end-10 size-6 rounded-full bg-white/20" />
              </div>

              {/* Bell icon with ring animation */}
              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  <BellRing className="size-12 text-white" />
                </motion.div>
                {/* Notification dot */}
                <span className="absolute -top-1 -end-1 flex size-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-4 bg-red-500" />
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-foreground mb-1">
                {t('notificationTitle')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('notificationDescription')}
              </p>

              {/* Notification types */}
              <div className="bg-muted/30 rounded-xl p-3 mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('notificationTypes')}
                </p>
                <div className="space-y-2">
                  {notificationTypes.map((nt) => (
                    <div key={nt.label} className="flex items-center gap-2.5">
                      <nt.icon className={`size-4 ${nt.color}`} />
                      <span className="text-sm text-foreground">{nt.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy note */}
              <div className="flex items-start gap-2 mb-4">
                <Shield className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {t('notificationPrivacy')}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDeny}
                  disabled={isRequesting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
                >
                  {t('notificationDeny')}
                </button>
                <button
                  onClick={handleGrant}
                  disabled={isRequesting}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Bell className="size-4" />
                  {isRequesting ? t('notificationRequesting') : t('notificationAllow')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
