'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, Lock, Eye, EyeOff, Check, X, CheckCircle2, KeyRound, ArrowLeft, AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';

function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length === 0) return 'weak';
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}

/* Animated SVG checkmark for success state */
function SuccessCheckmark() {
  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none">
        <motion.circle
          cx="40" cy="40" r="36"
          className="stroke-emerald-500 dark:stroke-emerald-400"
          strokeWidth="3" fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <motion.circle
          cx="40" cy="40" r="34"
          className="fill-emerald-50 dark:fill-emerald-950/40"
          strokeWidth="0"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
        />
        <motion.path
          d="M26 40 L36 50 L54 32"
          className="stroke-emerald-600 dark:stroke-emerald-400"
          strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
        />
      </svg>
      <motion.div
        className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1.5 }}
        transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

/* Password requirement item with animated check */
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <motion.div
      className="flex items-center gap-2"
      initial={false}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors duration-300"
        animate={{
          backgroundColor: met ? 'rgb(5, 150, 105)' : 'rgb(226, 232, 240)',
        }}
        transition={{ duration: 0.3 }}
      >
        {met ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            <Check className="h-2.5 w-2.5 text-white" />
          </motion.div>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        )}
      </motion.div>
      <span className={`text-xs transition-colors duration-300 ${met ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
        {text}
      </span>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword');
  const tSignup = useTranslations('auth.signup');
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState('');

  // Validate token presence on mount
  useEffect(() => {
    if (!token) {
      setTokenError('INVALID_TOKEN');
    }
  }, [token]);

  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const strengthConfig = {
    weak: { width: '33%', color: 'bg-red-500', label: tSignup('passwordStrength.weak') },
    medium: { width: '66%', color: 'bg-amber-500', label: tSignup('passwordStrength.medium') },
    strong: { width: '100%', color: 'bg-emerald-500', label: tSignup('passwordStrength.strong') },
  };

  const currentStrength = strengthConfig[passwordStrength];

  const passwordChecks = useMemo(() => ({
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  }), [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword,
          confirmNewPassword: confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'EXPIRED_TOKEN') {
          setTokenError('EXPIRED_TOKEN');
          return;
        }
        if (data.code === 'INVALID_TOKEN' || data.code === 'USED_TOKEN') {
          setTokenError('INVALID_TOKEN');
          return;
        }
        setError(data.error || t('error'));
        return;
      }

      setIsSuccess(true);
    } catch {
      setError(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Token error state
  if (tokenError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
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

        <Card className="shadow-xl border-0 dark:border dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none">
          <CardContent className="pt-10 pb-10">
            <div className="flex flex-col items-center text-center space-y-5">
              {/* Error icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-800/40 flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-red-500 dark:text-red-400" />
                </div>
              </motion.div>

              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <h2 className="text-2xl font-bold tracking-tight">
                  {tokenError === 'EXPIRED_TOKEN' ? t('expiredToken') : t('invalidToken')}
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {tokenError === 'EXPIRED_TOKEN'
                    ? t('expiredTokenDesc')
                    : t('invalidTokenDesc')}
                </p>
              </motion.div>

              <motion.div
                className="flex flex-col items-center gap-3 w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <Button
                  asChild
                  className="w-full max-w-xs mt-2 h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 font-medium hover:scale-[1.02]"
                >
                  <Link href="/forgot-password">
                    {t('requestNewLink')}
                  </Link>
                </Button>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors duration-200 hover:gap-2.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('backToLogin')}
                </Link>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
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
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Card className="shadow-xl border-0 dark:border dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none">
              <CardContent className="pt-10 pb-10">
                <div className="flex flex-col items-center text-center space-y-5">
                  <SuccessCheckmark />

                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                  >
                    <h2 className="text-2xl font-bold tracking-tight">{t('success')}</h2>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      {t('successDesc')}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.4 }}
                  >
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
                  <CardDescription className="text-sm">{t('description')}</CardDescription>
                </motion.div>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Key illustration */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="flex justify-center mb-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 -m-4 rounded-3xl bg-emerald-500/10 blur-xl" />
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center">
                      <KeyRound className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New password field */}
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                  >
                    <Label htmlFor="newPassword" className="text-sm font-medium">{t('newPassword')}</Label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        disabled={isLoading}
                        dir="ltr"
                        className="ps-10 pe-10 h-11 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Password strength bar */}
                    {newPassword.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-1.5"
                      >
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: currentStrength.width }}
                            className={`h-full rounded-full transition-colors duration-300 ${currentStrength.color}`}
                          />
                        </div>
                        <p className={`text-xs font-medium ${
                          passwordStrength === 'weak' ? 'text-red-500' :
                          passwordStrength === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                          {currentStrength.label}
                        </p>
                      </motion.div>
                    )}
                    {/* Password requirements */}
                    {newPassword.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1"
                      >
                        <PasswordRequirement met={passwordChecks.length} text={tSignup('reqLength')} />
                        <PasswordRequirement met={passwordChecks.uppercase} text={tSignup('reqUppercase')} />
                        <PasswordRequirement met={passwordChecks.number} text={tSignup('reqNumber')} />
                        <PasswordRequirement met={passwordChecks.special} text={tSignup('reqSpecial')} />
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Confirm password field */}
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">{t('confirmPassword')}</Label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        disabled={isLoading}
                        dir="ltr"
                        className="ps-10 pe-10 h-11 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Password match indicator */}
                    {confirmPassword.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1.5"
                      >
                        {newPassword === confirmPassword ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              {tSignup('passwordStrength.strong')}
                            </span>
                          </>
                        ) : (
                          <>
                            <X className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                            <span className="text-xs text-muted-foreground">
                              {t('passwordMismatch')}
                            </span>
                          </>
                        )}
                      </motion.div>
                    )}
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

                  {/* Submit button */}
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
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
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

                {/* Back to login */}
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
