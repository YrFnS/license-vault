'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Separator } from '@/components/ui/separator';

const APP_VERSION = 'v0.2.0';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="mt-auto border-t border-border/40 bg-gradient-to-r from-background via-background to-muted/20">
      {/* Subtle emerald-tinted top border gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="px-4 md:px-6 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          {/* Copyright */}
          <p className="order-2 sm:order-1">
            &copy; {new Date().getFullYear()} LicenseVault. {t('copyright')}.
          </p>

          {/* Version */}
          <p className="order-1 sm:order-2 font-mono text-muted-foreground/60">
            {t('version')} {APP_VERSION}
          </p>

          {/* Links */}
          <div className="order-3 flex items-center gap-3">
            <Link
              href="#"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200"
            >
              {t('privacy')}
            </Link>
            <Separator orientation="vertical" className="h-3 bg-border/40" />
            <Link
              href="#"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200"
            >
              {t('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
