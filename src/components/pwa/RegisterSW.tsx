'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Wifi, Zap, Smartphone, X, Shield } from 'lucide-react';

// Type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSAL_KEY = 'lv_install_dismissed';
const DISMISSAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getIsStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
}

function wasRecentlyDismissed() {
  if (typeof window === 'undefined') return true;
  const dismissedAt = localStorage.getItem(DISMISSAL_KEY);
  if (!dismissedAt) return false;
  return Date.now() - parseInt(dismissedAt, 10) < DISMISSAL_DURATION_MS;
}

export function RegisterSW() {
  const t = useTranslations('pwa');
  const [isInstalled, setIsInstalled] = useState(getIsStandalone);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        // Check for updates periodically
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000); // Every hour

        // Listen for new service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                // Notify about update
                if (navigator.serviceWorker.controller) {
                  // There's a new version available
                }
              }
            });
          }
        });
      }).catch((err) => {
        console.log('SW registration failed:', err);
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type } = event.data || {};
        if (type === 'SYNC_COMPLETE') {
          // Could show a toast about successful sync
        }
      });
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show if not recently dismissed
      if (!wasRecentlyDismissed()) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for app installed event
    const installedHandler = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISSAL_KEY, Date.now().toString());
    setShowInstallPrompt(false);
  }, []);

  if (!showInstallPrompt || isInstalled) return null;

  const benefits = [
    { icon: Wifi, label: t('benefitOffline'), color: 'text-amber-500' },
    { icon: Zap, label: t('benefitFast'), color: 'text-emerald-500' },
    { icon: Smartphone, label: t('benefitHomeScreen'), color: 'text-teal-500' },
    { icon: Shield, label: t('benefitSecure'), color: 'text-cyan-500' },
  ];

  return (
    <AnimatePresence>
      {showInstallPrompt && (
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Install Card */}
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

            {/* Decorative header gradient */}
            <div className="relative h-28 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 flex items-center justify-center overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-2 start-4 size-12 rounded-full border-2 border-white" />
                <div className="absolute bottom-3 end-6 size-8 rounded-full border-2 border-white" />
                <div className="absolute top-8 end-12 size-6 rounded-full bg-white/20" />
              </div>

              {/* App icon mockup */}
              <div className="relative flex items-center gap-3">
                <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Shield className="size-8 text-white" />
                </div>
                <div className="text-white">
                  <h3 className="text-lg font-bold">{t('installTitle')}</h3>
                  <p className="text-xs opacity-80">v2.0</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              {/* Screenshot mockup */}
              <div className="mb-4 rounded-lg border border-border/50 bg-muted/30 p-3">
                <div className="flex gap-1.5 mb-2">
                  <div className="size-2 rounded-full bg-red-400/60" />
                  <div className="size-2 rounded-full bg-amber-400/60" />
                  <div className="size-2 rounded-full bg-emerald-400/60" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-2.5 w-3/4 rounded bg-emerald-500/20" />
                  <div className="h-2 w-1/2 rounded bg-muted-foreground/10" />
                  <div className="flex gap-2 mt-2">
                    <div className="h-8 flex-1 rounded bg-emerald-500/10 border border-emerald-500/20" />
                    <div className="h-8 flex-1 rounded bg-amber-500/10 border border-amber-500/20" />
                    <div className="h-8 flex-1 rounded bg-red-500/10 border border-red-500/20" />
                  </div>
                </div>
              </div>

              {/* Benefits list */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t('installBenefits')}
              </p>
              <div className="space-y-2 mb-4">
                {benefits.map((benefit) => (
                  <div key={benefit.label} className="flex items-center gap-2.5">
                    <benefit.icon className={`size-4 ${benefit.color}`} />
                    <span className="text-sm text-foreground">{benefit.label}</span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-xl transition-colors"
                >
                  {t('notNow')}
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Download className="size-4" />
                  {t('install')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
