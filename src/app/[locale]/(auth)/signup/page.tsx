'use client';

import { useState, useMemo } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Shield, Mail, Lock, Eye, EyeOff, User, Check, X, CheckCircle2 } from 'lucide-react';
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

/* Tooltip component for "Coming soon" */
function ComingSoonTooltip({ children, label }: { children: React.ReactNode; label: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-9 left-1/2 -translate-x-1/2 z-50 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg whitespace-nowrap"
          >
            {label}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-100" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Animated SVG checkmark for success state */
function SuccessCheckmark() {
  return (
    <div className="flex flex-col items-center gap-4">
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

export default function SignupPage() {
  const t = useTranslations('auth.signup');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const strengthConfig = {
    weak: { width: '33%', color: 'bg-red-500', label: t('passwordStrength.weak') },
    medium: { width: '66%', color: 'bg-amber-500', label: t('passwordStrength.medium') },
    strong: { width: '100%', color: 'bg-emerald-500', label: t('passwordStrength.strong') },
  };

  const currentStrength = strengthConfig[passwordStrength];

  // Password requirements checks
  const passwordChecks = useMemo(() => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    if (password !== confirmPassword) {
      errors.confirmPassword = t('passwordMismatch');
    }
    if (password.length < 8) {
      errors.password = t('passwordTooShort');
    }
    if (!agreeTerms) {
      errors.terms = t('agreeToTerms');
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
      return;
    }

    setIsLoading(true);

    try {
      // Register the user
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        setError(registerData.error || 'Registration failed');
        setShakeError(true);
        setTimeout(() => setShakeError(false), 600);
        setIsLoading(false);
        return;
      }

      // Show success animation briefly
      setShowSuccess(true);

      // Auto sign-in after registration after a brief delay for the animation
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        router.push('/login');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError(t('genericError'));
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full"
    >
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center justify-center mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">{tCommon('appName')}</span>
        </div>
      </div>

      <Card className="shadow-xl border-0 dark:border dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">{t('title')}</CardTitle>
          <CardDescription className="text-sm">{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center py-8 text-center space-y-4"
              >
                <SuccessCheckmark />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <h3 className="text-xl font-bold">{t('accountCreated')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t('loading')}</p>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name field */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">{t('name')}</Label>
                    <div className="relative">
                      <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoComplete="name"
                        disabled={isLoading}
                        className="ps-10 h-11 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/60"
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">{t('email')}</Label>
                    <div className="relative">
                      <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        disabled={isLoading}
                        dir="ltr"
                        className={`ps-10 h-11 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/60 ${fieldErrors.email ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Password field with strength indicator */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">{t('password')}</Label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        disabled={isLoading}
                        dir="ltr"
                        className={`ps-10 pe-10 h-11 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/60 ${fieldErrors.password ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
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
                    {password.length > 0 && (
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
                    {/* Visual password requirements */}
                    {password.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1"
                      >
                        <PasswordRequirement met={passwordChecks.length} text={t('reqLength')} />
                        <PasswordRequirement met={passwordChecks.uppercase} text={t('reqUppercase')} />
                        <PasswordRequirement met={passwordChecks.number} text={t('reqNumber')} />
                        <PasswordRequirement met={passwordChecks.special} text={t('reqSpecial')} />
                      </motion.div>
                    )}
                  </div>

                  {/* Confirm password field */}
                  <div className="space-y-2">
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
                        className={`ps-10 pe-10 h-11 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/60 ${fieldErrors.confirmPassword ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
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
                    {fieldErrors.confirmPassword && (
                      <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                    )}
                    {/* Password match indicator */}
                    {confirmPassword.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1.5"
                      >
                        {password === confirmPassword ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              {t('passwordStrength.strong')}
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
                  </div>

                  {/* Terms checkbox */}
                  <div className="space-y-1">
                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        id="terms"
                        checked={agreeTerms}
                        onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                        disabled={isLoading}
                        className="mt-0.5"
                      />
                      <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                        {t('agreeToTerms')}{' '}
                        <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4" onClick={(e) => e.preventDefault()}>
                          {t('termsOfService')}
                        </Link>{' '}
                        {t('and')}{' '}
                        <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4" onClick={(e) => e.preventDefault()}>
                          {t('privacyPolicy')}
                        </Link>
                      </Label>
                    </div>
                    {fieldErrors.terms && (
                      <p className="text-xs text-destructive">{fieldErrors.terms}</p>
                    )}
                  </div>

                  {/* Error display with shake animation */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, x: 0 }}
                        animate={{ opacity: 1, x: shakeError ? [0, -8, 8, -6, 6, -3, 3, 0] : 0 }}
                        transition={{ duration: 0.5 }}
                        className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit button with shimmer effect */}
                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 font-medium hover:scale-[1.02] relative overflow-hidden"
                    size="lg"
                    disabled={isLoading || !agreeTerms}
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
                        <span className="relative z-10">{t('loading')}</span>
                      </>
                    ) : (
                      <span className="relative z-10">{t('submit')}</span>
                    )}
                  </Button>
                </form>

                {/* Styled OR separator */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700/60" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-4 text-xs text-muted-foreground uppercase tracking-widest font-medium">
                      {t('orContinueWith')}
                    </span>
                  </div>
                </div>

                {/* Social login buttons with Coming Soon tooltips */}
                <div className="grid grid-cols-3 gap-3">
                  <ComingSoonTooltip label={t('comingSoon')}>
                    <Button
                      variant="outline"
                      className="h-12 w-full border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                      type="button"
                      disabled={isLoading}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span className="sr-only">{t('google')}</span>
                    </Button>
                  </ComingSoonTooltip>
                  <ComingSoonTooltip label={t('comingSoon')}>
                    <Button
                      variant="outline"
                      className="h-12 w-full border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                      type="button"
                      disabled={isLoading}
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      <span className="sr-only">{t('github')}</span>
                    </Button>
                  </ComingSoonTooltip>
                  <ComingSoonTooltip label={t('comingSoon')}>
                    <Button
                      variant="outline"
                      className="h-12 w-full border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                      type="button"
                      disabled={isLoading}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" fill="#00A4EF"/>
                      </svg>
                      <span className="sr-only">{t('microsoft')}</span>
                    </Button>
                  </ComingSoonTooltip>
                </div>

                {/* Login link */}
                <div className="mt-8 text-center text-sm text-muted-foreground">
                  {t('hasAccount')}{' '}
                  <Link
                    href="/login"
                    className="font-semibold text-primary hover:underline underline-offset-4 transition-all"
                  >
                    {t('login')}
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
