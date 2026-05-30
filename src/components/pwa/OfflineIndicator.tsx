'use client';

import { useSyncExternalStore, useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { WifiOff, Wifi, CheckCircle2, Clock, Shield, FileText, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return !navigator.onLine;
}

function getServerSnapshot() {
  return false;
}

function getLastSyncedFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('lv_last_synced');
}

export function OfflineIndicator() {
  const t = useTranslations('pwa');
  const isOffline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(getLastSyncedFromStorage);
  const [isExpanded, setIsExpanded] = useState(false);
  const wasOfflineRef = useRef(false);

  // Track last synced time via interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        const now = new Date().toISOString();
        localStorage.setItem('lv_last_synced', now);
        setLastSynced(now);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Listen for online/offline events to handle transitions
  useEffect(() => {
    const handleOnline = () => {
      if (wasOfflineRef.current) {
        setShowBackOnline(true);
        setIsExpanded(false);
        const now = new Date().toISOString();
        localStorage.setItem('lv_last_synced', now);
        setLastSynced(now);
        wasOfflineRef.current = false;
      }
    };

    const handleOffline = () => {
      wasOfflineRef.current = true;
      setIsExpanded(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // If already offline on mount, set the ref
    if (navigator.onLine === false) {
      wasOfflineRef.current = true;
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-dismiss "back online" toast
  useEffect(() => {
    if (!showBackOnline) return;
    const timer = setTimeout(() => {
      setShowBackOnline(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [showBackOnline]);

  const formatLastSynced = useCallback(() => {
    if (!lastSynced) return t('neverSynced');
    const date = new Date(lastSynced);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return t('minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('hoursAgo', { count: diffHours });
    return date.toLocaleDateString();
  }, [lastSynced, t]);

  const offlineFeatures = [
    { icon: FileText, label: t('offlineFeatureLicenses') },
    { icon: Shield, label: t('offlineFeatureCompliance') },
    { icon: Users, label: t('offlineFeatureTeam') },
  ];

  return (
    <>
      {/* Offline Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 start-0 end-0 z-[100]"
          >
            <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20">
              {/* Main banner */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <WifiOff className="size-5" />
                    {/* Pulse animation */}
                    <span className="absolute -top-0.5 -end-0.5 flex size-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full size-3 bg-red-500" />
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t('offlineTitle')}</p>
                    <p className="text-xs opacity-90">{t('offlineMessage')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-1.5 text-xs opacity-80">
                    <Clock className="size-3.5" />
                    <span>{t('lastSynced')}: {formatLastSynced()}</span>
                  </div>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs font-medium bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-md transition-colors"
                  >
                    {isExpanded ? t('showLess') : t('showMore')}
                  </button>
                </div>
              </div>

              {/* Expanded section with features */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-white/20"
                  >
                    <div className="px-4 py-3 bg-amber-700/30">
                      <p className="text-xs font-medium mb-2 opacity-90">{t('availableOffline')}</p>
                      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                        {offlineFeatures.map((feature) => (
                          <div key={feature.label} className="flex items-center gap-1.5 text-xs">
                            <feature.icon className="size-3.5 opacity-80" />
                            <span>{feature.label}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs mt-2 opacity-70">{t('changesSyncOnline')}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Online Toast */}
      <AnimatePresence>
        {showBackOnline && !isOffline && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-4 start-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
              <Wifi className="size-4" />
              <span className="text-sm font-medium">{t('backOnline')}</span>
              <CheckCircle2 className="size-4 opacity-80" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
