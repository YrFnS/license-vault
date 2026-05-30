'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Shield, Lock, CheckCircle2, Quote } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('auth.layout');
  const tCommon = useTranslations('common');

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Hidden on mobile, visible on lg+ */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700">
        {/* Decorative background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large circle */}
          <div className="absolute -top-24 -start-24 w-96 h-96 rounded-full bg-white/5" />
          {/* Medium circle */}
          <div className="absolute top-1/3 -end-16 w-64 h-64 rounded-full bg-white/5" />
          {/* Small circles */}
          <div className="absolute bottom-1/4 start-16 w-32 h-32 rounded-full bg-white/5" />
          {/* Floating dots */}
          <div className="absolute top-20 end-32 w-3 h-3 rounded-full bg-white/20 animate-pulse" />
          <div className="absolute top-1/2 start-24 w-2 h-2 rounded-full bg-white/15 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-32 end-48 w-2.5 h-2.5 rounded-full bg-white/20 animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-2/3 start-48 w-2 h-2 rounded-full bg-white/10 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-48 start-12 w-3 h-3 rounded-full bg-white/10 animate-pulse" style={{ animationDelay: '1.5s' }} />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Top: Logo + Tagline */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                {tCommon('appName')}
              </span>
            </div>
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-3">
              {t('tagline')}
            </h2>

            {/* Shield illustration area */}
            <div className="mt-10 flex items-center justify-center">
              <div className="relative">
                {/* Outer glow ring */}
                <div className="absolute inset-0 -m-8 rounded-full bg-white/5 blur-xl" />
                {/* Shield icon */}
                <div className="relative w-32 h-32 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <Shield className="h-16 w-16 text-white/90" />
                </div>
                {/* Floating lock icons */}
                <div className="absolute -top-3 -end-6 w-10 h-10 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center animate-bounce" style={{ animationDuration: '3s' }}>
                  <Lock className="h-5 w-5 text-white/80" />
                </div>
                <div className="absolute -bottom-2 -start-5 w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                  <Lock className="h-4 w-4 text-white/70" />
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Bullet points */}
          <div className="space-y-4 my-8">
            {[
              { key: 'bullet1' as const },
              { key: 'bullet2' as const },
              { key: 'bullet3' as const },
            ].map((item, index) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.15, duration: 0.5 }}
                className="flex items-center gap-4"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                </div>
                <span className="text-white/90 text-lg">{t(item.key)}</span>
              </motion.div>
            ))}
          </div>

          {/* Bottom: Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/15"
          >
            <Quote className="h-8 w-8 text-white/30 mb-3" />
            <p className="text-white/90 text-sm leading-relaxed mb-4">
              &ldquo;{t('testimonial.quote')}&rdquo;
            </p>
            <div>
              <p className="text-white font-semibold text-sm">{t('testimonial.author')}</p>
              <p className="text-white/60 text-xs">{t('testimonial.role')}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth form */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' as const }}
        className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 sm:p-8 lg:p-12"
      >
        {/* Mobile-only logo */}
        <div className="lg:hidden absolute top-6 start-6 flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold">{tCommon('appName')}</span>
        </div>
        <div className="w-full max-w-md">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
