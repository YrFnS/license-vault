'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, Mail, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';

/* Animated SVG checkmark that draws itself */
function AnimatedCheckmark() {
  return (
    <div className="relative flex items-center justify-center">
      <svg
        className="w-20 h-20"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <motion.circle
          cx="40"
          cy="40"
          r="36"
          className="stroke-emerald-500 dark:stroke-emerald-400"
          strokeWidth="3"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' as const }}
        />
        {/* Filled circle background */}
        <motion.circle
          cx="40"
          cy="40"
          r="34"
          className="fill-emerald-50 dark:fill-emerald-950/40"
          strokeWidth="0"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' as const }}
        />
        {/* Checkmark path */}
        <motion.path
          d="M26 40 L36 50 L54 32"
          className="stroke-emerald-600 dark:stroke-emerald-400"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' as const }}
        />
      </svg>
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1.5 }}
        transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' as const }}
      />
    </div>
  );
}

/* Mail illustration with animated elements */
function MailIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="flex justify-center mb-6"
    >
      <div className="relative">
        {/* Outer glow */}
        <div className="absolute inset-0 -m-4 rounded-3xl bg-emerald-500/10 blur-xl" />
        {/* Mail container */}
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center">
          <Mail className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          {/* Animated notification dot */}
          <motion.div
            className="absolute -top-1.5 -end-1.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 500, damping: 15 }}
          />
          {/* Small floating envelope lines */}
          <motion.div
            className="absolute -start-6 top-1/2 w-3 h-0.5 rounded-full bg-emerald-300 dark:bg-emerald-700"
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: [0, 1, 0], x: [5, 0, -5] }}
            transition={{ delay: 1, duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
          <motion.div
            className="absolute -end-6 top-1/3 w-2.5 h-0.5 rounded-full bg-teal-300 dark:bg-teal-700"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: [0, 1, 0], x: [-5, 0, 5] }}
            transition={{ delay: 1.3, duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('error'));
        return;
      }

      // The API now sends a reset email - show success confirmation
      // User will click the link in their email to access reset-password
      setIsSuccess(true);
    } catch {
      setError(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' as const }}
      className="w-full"
    >
      {/* Mobile logo */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="lg:hidden flex items-center justify-center mb-8"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">LicenseVault</span>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' as const }}
          >
            <Card className="shadow-xl border-0 dark:border dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none">
              <CardContent className="pt-10 pb-10">
                <div className="flex flex-col items-center text-center space-y-5">
                  {/* Animated checkmark */}
                  <AnimatedCheckmark />

                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                  >
                    <h2 className="text-2xl font-bold tracking-tight">{t('successTitle')}</h2>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      {t('successMessage')}
                    </p>
                  </motion.div>

                  <motion.div
                    className="flex flex-col items-center gap-3 w-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.4 }}
                  >
                    {/* Resend link */}
                    <p className="text-xs text-muted-foreground">
                      {t('resendLink')}
                    </p>

                    {/* Prominent Back to Login button */}
                    <Button
                      asChild
                      className="w-full max-w-xs mt-2 h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 font-medium hover:scale-[1.02]"
                    >
                      <Link href="/login">
                        <ArrowLeft className="h-4 w-4 me-2" />
                        {t('backToLogin')}
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="shadow-xl border-0 dark:border dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none">
              <CardHeader className="text-center pb-2">
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >
                  <CardTitle className="text-2xl font-bold tracking-tight">{t('title')}</CardTitle>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <CardDescription className="text-sm">{t('subtitle')}</CardDescription>
                </motion.div>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Mail illustration */}
                <MailIllustration />

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email field */}
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                  >
                    <Label htmlFor="email" className="text-sm font-medium">{t('email')}</Label>
                    <div className="relative">
                      <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        disabled={isLoading}
                        dir="ltr"
                        className="ps-10 h-11 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/60"
                      />
                    </div>
                  </motion.div>

                  {/* Error display */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit button with shimmer */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.4 }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 font-medium hover:scale-[1.02] relative overflow-hidden"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <motion.span
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' as const }}
                        />
                      )}
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin me-2 relative z-10" />
                          <span className="relative z-10">...</span>
                        </>
                      ) : (
                        <span className="relative z-10">{t('submit')}</span>
                      )}
                    </Button>
                  </motion.div>
                </form>

                {/* Back to login - more prominent */}
                <motion.div
                  className="mt-6 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55, duration: 0.4 }}
                >
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors duration-200 hover:gap-2.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t('backToLogin')}
                  </Link>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
