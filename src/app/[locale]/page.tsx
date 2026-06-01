'use client';

import { useTranslations, useLocale } from 'next-intl';
// v2 redesign
import { Link } from '@/i18n/navigation';
import { useState, useEffect } from 'react';
import {
  Shield, Bell, Bot, Users, Upload, Share2,
  Check, Menu, X, ArrowRight, ArrowLeft,
  BarChart3, Clock, FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

export default function LandingPage() {
  const t = useTranslations('landing');
  const tc = useTranslations('common');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      {/* ─── Navigation ─── */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Shield className="size-4 text-white" />
            </div>
            <span className="text-base font-semibold text-slate-900 dark:text-slate-100">{tc('appName')}</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">{t('features.title').split(' ').slice(0, 2).join(' ')}</a>
            <a href="#how-it-works" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">{t('howItWorks.title')}</a>
            <a href="#pricing" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">{t('pricing.title').split(' ').slice(0, 2).join(' ')}</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">{tc('logIn')}</Link>
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
              <Link href="/signup">{t('hero.cta')}</Link>
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
            <nav className="flex flex-col gap-3">
              <a href="#features" className="text-sm text-slate-600 dark:text-slate-400">{t('features.title').split(' ').slice(0, 2).join(' ')}</a>
              <a href="#how-it-works" className="text-sm text-slate-600 dark:text-slate-400">{t('howItWorks.title')}</a>
              <a href="#pricing" className="text-sm text-slate-600 dark:text-slate-400">{t('pricing.title').split(' ').slice(0, 2).join(' ')}</a>
              <hr className="border-slate-200 dark:border-slate-800" />
              <Button variant="ghost" size="sm" asChild><Link href="/login">{tc('logIn')}</Link></Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild><Link href="/signup">{t('hero.cta')}</Link></Button>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* ─── Hero ─── */}
        <section className="border-b border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
              {/* Left: Copy (3 cols) */}
              <div className="lg:col-span-3 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 w-fit mb-6">
                  <Shield className="size-3" />
                  {t('hero.badge')}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.1]">
                  {t('hero.title')}
                </h1>
                <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                  {t('hero.subtitle')}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" asChild>
                    <Link href="/signup">{t('hero.cta')}<ArrowIcon className="size-4" /></Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-slate-300 dark:border-slate-700" asChild>
                    <Link href="/login">{t('hero.secondaryCta')}</Link>
                  </Button>
                </div>
                <div className="mt-10 flex items-center gap-6 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Check className="size-4 text-emerald-500" />
                    <span>Free forever tier</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="size-4 text-emerald-500" />
                    <span>No credit card required</span>
                  </div>
                </div>
              </div>

              {/* Right: Key metrics (2 cols) */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                      <BarChart3 className="size-4.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Compliance Score</p>
                      <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">94%</p>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full w-[94%] rounded-full bg-emerald-500" />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="size-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                      <Clock className="size-4.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Expiring in 30 days</p>
                      <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">3</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">California Plumbing License, Texas HV, Nevada General</p>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-5">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
                      <FileCheck className="size-4.5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active licenses</p>
                      <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">10<span className="text-base font-normal text-slate-400">/ 12</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Trusted By ─── */}
        <section className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="mx-auto max-w-6xl px-4 md:px-6 py-10">
            <p className="text-center text-xs font-medium uppercase tracking-wider text-slate-400 mb-6">{t('trustedBy.title')}</p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {['Acme Construction', 'Brighton Builders', 'Pinnacle Contractors', 'Summit Enterprises', 'Westbrook Group', 'Greenfield Corp'].map((name) => (
                <span key={name} className="text-sm font-medium text-slate-400">{name}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Features — Asymmetric Bento ─── */}
        <section id="features" className="border-b border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-24">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-600 mb-2">{t('features.title').split(' ').slice(0, 1).join(' ')}</p>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('features.title')}</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">{t('features.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Large card */}
              <div className="md:col-span-2 md:row-span-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-6">
                <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4">
                  <Shield className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('features.track.title')}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('features.track.description')}
                </p>
              </div>

              {[
                { icon: Bell, key: 'alerts', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' },
                { icon: Bot, key: 'ai', color: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400' },
                { icon: Users, key: 'team', color: 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400' },
                { icon: Upload, key: 'import', color: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400' },
                { icon: Share2, key: 'compliance', color: 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400' },
              ].map(({ icon: Icon, key, color }) => (
                <div key={key} className="rounded-lg border border-slate-200 dark:border-slate-800 p-5">
                  <div className={`size-9 rounded-lg ${color} flex items-center justify-center mb-3`}>
                    <Icon className="size-4.5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t(`features.${key}.title`)}</h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{t(`features.${key}.description`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works — Clean 3-step ─── */}
        <section id="how-it-works" className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-24">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-600 mb-2">How it works</p>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('howItWorks.title')}</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400">{t('howItWorks.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Upload, titleKey: 'step1', color: 'bg-emerald-600' },
                { icon: Bell, titleKey: 'step2', color: 'bg-amber-500' },
                { icon: ArrowRight, titleKey: 'step3', color: 'bg-sky-600' },
              ].map(({ icon: Icon, titleKey, color }, i) => (
                <div key={titleKey} className="flex gap-4">
                  <div className="shrink-0">
                    <div className={`size-10 rounded-lg ${color} flex items-center justify-center`}>
                      <Icon className="size-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-1">Step {i + 1}</p>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t(`howItWorks.${titleKey}.title`)}</h3>
                    <p className="mt-1 text-sm text-slate-500 leading-relaxed">{t(`howItWorks.${titleKey}.description`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Pricing ─── */}
        <section id="pricing" className="border-b border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-24">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-600 mb-2">Pricing</p>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('pricing.title')}</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400">{t('pricing.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
              {/* Free */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('pricing.free.name')}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('pricing.free.price')}</span>
                  <span className="text-slate-500 text-sm">{t('pricing.free.period')}</span>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Check className="size-4 text-emerald-500 shrink-0" />
                      {t(`pricing.free.features.${i}`)}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full mt-6 border-slate-300 dark:border-slate-700" asChild>
                  <Link href="/signup">{t('pricing.free.cta')}</Link>
                </Button>
              </div>

              {/* Pro */}
              <div className="rounded-lg border-2 border-emerald-500 p-6 relative">
                <div className="absolute -top-3 start-4">
                  <span className="bg-emerald-600 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">{t('pricing.pro.mostPopular')}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('pricing.pro.name')}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('pricing.pro.price')}</span>
                  <span className="text-slate-500 text-sm">{t('pricing.pro.period')}</span>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Check className="size-4 text-emerald-500 shrink-0" />
                      {t(`pricing.pro.features.${i}`)}
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                  <Link href="/signup">{t('pricing.pro.cta')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section>
          <div className="mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-24">
            <div className="rounded-lg bg-slate-900 dark:bg-slate-800 px-6 py-12 md:px-12 md:py-16 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white">{t('hero.cta')}</h2>
              <p className="mt-3 text-slate-300 max-w-lg mx-auto">
                {t('hero.subtitle')}
              </p>
              <div className="mt-6">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 gap-2" asChild>
                  <Link href="/signup">
                    Get started free
                    <ArrowIcon className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-10">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Shield className="size-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tc('appName')}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">{t('footer.privacy')}</a>
              <a href="#" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">{t('footer.terms')}</a>
              <span className="text-slate-400">&copy; {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
