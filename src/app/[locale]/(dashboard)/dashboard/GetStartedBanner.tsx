'use client';

import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export function GetStartedBanner({ onDismiss }: { onDismiss: () => void }) {
  const t = useTranslations('dashboard');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30"
      >
        <div className="flex items-start gap-4 p-5">
          <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-600 shrink-0">
            <Sparkles className="size-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">{t('getStarted')}</h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">{t('getStartedDesc')}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
              <Link href="/onboarding">
                {t('getStartedCta')}
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="size-8 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900" onClick={onDismiss} aria-label={t('getStartedDismiss')}>
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
