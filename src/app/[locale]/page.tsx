'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Bell,
  Bot,
  Users,
  Upload,
  Share2,
  Check,
  Menu,
  X,
  ArrowRight,
  ArrowLeft,
  Lock,
  Quote,
  BarChart3,
  Globe,
  Activity,
  Building2,
  Twitter,
  Linkedin,
  Github,
  ArrowUp,
  Eye,
  BellRing,
  ClipboardCheck,
  HelpCircle,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

interface PlatformStats {
  totalLicenses: number;
  totalOrgs: number;
  totalUsers: number;
  statesCovered: number;
}

const featureIcons = [Shield, Bell, Bot, Users, Upload, Share2];
const featureKeys = ['track', 'alerts', 'ai', 'team', 'import', 'compliance'] as const;

const companyColors = [
  'from-emerald-500 to-emerald-600',
  'from-teal-500 to-teal-600',
  'from-cyan-500 to-cyan-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
  'from-violet-500 to-violet-600',
];

const companyInitials = ['AC', 'BR', 'PC', 'SB', 'EW', 'GF'];

const howItWorksSteps = [
  { icon: Eye, color: 'emerald' },
  { icon: BellRing, color: 'teal' },
  { icon: ClipboardCheck, color: 'cyan' },
] as const;

const faqIcons = [Shield, Bell, Share2, Bot];

export default function LandingPage() {
  const t = useTranslations('landing');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/platform/stats');
        if (res.ok) {
          const data = await res.json();
          setPlatformStats(data);
        }
      } catch {
        // Silently fail, defaults will be used
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);
  const isRTL = locale === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const trustedCompanies = [
    { name: t('trustedBy.companies.0') },
    { name: t('trustedBy.companies.1') },
    { name: t('trustedBy.companies.2') },
    { name: t('trustedBy.companies.3') },
    { name: t('trustedBy.companies.4') },
    { name: t('trustedBy.companies.5') },
  ];

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  // Back to top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background scroll-smooth">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-gradient-to-r from-background/95 via-background/90 to-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm shadow-emerald-500/20">
              <Shield className="size-4.5 text-white" />
            </div>
            <span className="text-lg font-bold">{tc('appName')}</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              onClick={(e) => handleSmoothScroll(e, '#features')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('features.title').split(' ').slice(0, 2).join(' ')}
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => handleSmoothScroll(e, '#how-it-works')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('howItWorks.title')}
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleSmoothScroll(e, '#pricing')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('pricing.title').split(' ').slice(0, 2).join(' ')}
            </a>
            <a
              href="#faq"
              onClick={(e) => handleSmoothScroll(e, '#faq')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('faq.title').split(' ').slice(0, 2).join(' ')}
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">{tc('logIn')}</Link>
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-sm shadow-emerald-500/20" asChild>
              <Link href="/signup">{t('hero.cta')}</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t bg-background p-4"
          >
            <nav className="flex flex-col gap-3">
              <a
                href="#features"
                onClick={(e) => handleSmoothScroll(e, '#features')}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {t('features.title').split(' ').slice(0, 2).join(' ')}
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => handleSmoothScroll(e, '#how-it-works')}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {t('howItWorks.title')}
              </a>
              <a
                href="#pricing"
                onClick={(e) => handleSmoothScroll(e, '#pricing')}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {t('pricing.title').split(' ').slice(0, 2).join(' ')}
              </a>
              <a
                href="#faq"
                onClick={(e) => handleSmoothScroll(e, '#faq')}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {t('faq.title').split(' ').slice(0, 2).join(' ')}
              </a>
              <Separator className="my-2" />
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{tc('logIn')}</Link>
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0" asChild>
                <Link href="/signup">{t('hero.cta')}</Link>
              </Button>
            </nav>
          </motion.div>
        )}
      </header>

      <main className="flex-1">
        {/* ===== Hero Section ===== */}
        <section className="relative overflow-hidden">
          {/* Animated gradient background with mesh blobs */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/30 animate-gradient-shift" />

          {/* Floating mesh gradient blobs for depth */}
          <div className="absolute top-0 start-0 w-[500px] h-[500px] rounded-full bg-emerald-400/10 dark:bg-emerald-500/5 blur-[100px] animate-mesh-float-1" />
          <div className="absolute top-1/3 end-0 w-[400px] h-[400px] rounded-full bg-teal-400/10 dark:bg-teal-500/5 blur-[100px] animate-mesh-float-2" />
          <div className="absolute bottom-0 start-1/4 w-[350px] h-[350px] rounded-full bg-cyan-400/8 dark:bg-cyan-500/5 blur-[100px] animate-mesh-float-3" />

          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Floating shield/lock icon */}
          <motion.div
            className="absolute top-1/4 start-10 md:start-20 opacity-10"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut' as const,
            }}
          >
            <Shield className="size-24 md:size-32 text-emerald-600 dark:text-emerald-400" />
          </motion.div>
          <motion.div
            className="absolute bottom-1/4 end-10 md:end-20 opacity-10"
            animate={{
              y: [0, 15, 0],
              rotate: [0, -5, 5, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: 'easeInOut' as const,
              delay: 1,
            }}
          >
            <Lock className="size-20 md:size-28 text-teal-600 dark:text-teal-400" />
          </motion.div>

          {/* Floating particles/dots */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute size-1.5 rounded-full bg-emerald-500/20"
              style={{
                top: `${15 + i * 15}%`,
                left: `${10 + i * 16}%`,
              }}
              animate={{
                y: [0, -30 - i * 5, 0],
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 4 + i * 0.8,
                repeat: Infinity,
                ease: 'easeInOut' as const,
                delay: i * 0.6,
              }}
            />
          ))}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`teal-${i}`}
              className="absolute size-1 rounded-full bg-teal-500/15"
              style={{
                top: `${20 + i * 20}%`,
                right: `${8 + i * 20}%`,
              }}
              animate={{
                y: [0, 20 + i * 3, 0],
                opacity: [0.15, 0.4, 0.15],
              }}
              transition={{
                duration: 5 + i * 0.5,
                repeat: Infinity,
                ease: 'easeInOut' as const,
                delay: i * 0.8 + 0.3,
              }}
            />
          ))}

          <div className="relative container mx-auto px-4 md:px-6 py-20 md:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Gradient border badge */}
                <div className="inline-block mb-6 rounded-full p-[1.5px] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                  <Badge
                    variant="secondary"
                    className="px-4 py-1.5 text-xs font-medium bg-white dark:bg-background text-emerald-700 dark:text-emerald-300 border-0 rounded-full gap-1.5"
                  >
                    <Lock className="size-3.5" />
                    {t('hero.badge')}
                  </Badge>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] bg-gradient-to-r from-foreground via-foreground to-emerald-700 dark:to-emerald-400 bg-clip-text text-transparent">
                  {t('hero.title')}
                </h1>
                <p className="mt-6 text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
                  {t('hero.subtitle')}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" className="text-base px-8 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02]" asChild>
                    <Link href="/signup">
                      {t('hero.cta')}
                      <ArrowIcon className="size-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-base px-8 border-border/50 hover:border-emerald-500/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all duration-300">
                    {t('hero.secondaryCta')}
                  </Button>
                </div>
              </motion.div>

              {/* Hero inline stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-12 flex items-center justify-center gap-8 md:gap-12 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2 group cursor-default">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors duration-300">
                    <Shield className="size-4 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  {statsLoading ? (
                    <Skeleton className="h-5 w-16" />
                  ) : (
                    <span className="font-semibold text-foreground">{(platformStats?.totalLicenses ?? 0).toLocaleString()}+</span>
                  )} {t('hero.statLicenses')}
                </div>
                <div className="flex items-center gap-2 group cursor-default">
                  <div className="p-1.5 rounded-lg bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors duration-300">
                    <Users className="size-4 text-teal-500 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  {statsLoading ? (
                    <Skeleton className="h-5 w-12" />
                  ) : (
                    <span className="font-semibold text-foreground">{(platformStats?.totalOrgs ?? 0).toLocaleString()}+</span>
                  )} {t('hero.statTeams')}
                </div>
                <div className="flex items-center gap-2 group cursor-default">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors duration-300">
                    <Activity className="size-4 text-cyan-500 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="font-semibold text-foreground">99.9%</span> {t('hero.statUptime')}
                </div>
              </motion.div>

              {/* Dashboard mockup placeholder */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="mt-12 md:mt-16 max-w-3xl mx-auto"
              >
                <div className="rounded-xl md:rounded-2xl border border-border/40 bg-background/80 backdrop-blur-sm shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-500/5 overflow-hidden">
                  {/* Mock browser top bar */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-gradient-to-r from-muted/40 to-muted/20">
                    <div className="flex gap-1.5">
                      <div className="size-3 rounded-full bg-red-400/80" />
                      <div className="size-3 rounded-full bg-amber-400/80" />
                      <div className="size-3 rounded-full bg-green-400/80" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="h-6 rounded-md bg-muted/50 flex items-center px-3 border border-border/20">
                        <span className="text-[11px] text-muted-foreground/70">{typeof window !== 'undefined' ? window.location.host : ''}/dashboard</span>
                      </div>
                    </div>
                  </div>
                  {/* Mock dashboard content */}
                  <div className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-semibold">{t('hero.dashboardPreview')}</div>
                      <Badge variant="outline" className="text-[10px]">v2.0</Badge>
                    </div>
                    {/* Mini stat cards - generic placeholders */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: 'Total', color: 'bg-emerald-50 dark:bg-emerald-950/30' },
                        { label: 'Active', color: 'bg-teal-50 dark:bg-teal-950/30' },
                        { label: 'Expiring', color: 'bg-amber-50 dark:bg-amber-950/30' },
                      ].map((stat) => (
                        <div key={stat.label} className={`rounded-lg p-3 ${stat.color}`}>
                          <div className="h-5 w-8 rounded bg-current opacity-15" />
                          <div className="text-[10px] opacity-75 mt-1">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    {/* Mini license table mockup - generic placeholder rows */}
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 text-xs">
                          <div className="h-3 w-32 rounded bg-muted/60" />
                          <div className="h-4 w-12 rounded bg-muted/60" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== Trusted By Section ===== */}
        <section className="py-14 border-y border-border/30 bg-gradient-to-b from-muted/20 to-muted/10">
          <div className="container mx-auto px-4 md:px-6">
            <p className="text-center text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground/50 mb-8">
              {t('trustedBy.title')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-16">
              {trustedCompanies.map((company, index) => (
                <motion.div
                  key={company.name}
                  className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-all duration-500 cursor-default group"
                  whileHover={{ scale: 1.08, y: -2 }}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 0.4 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className={`size-10 rounded-xl bg-gradient-to-br ${companyColors[index]} flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:shadow-md group-hover:shadow-emerald-500/10 transition-all duration-300 group-hover:scale-110`}>
                    {companyInitials[index]}
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground/70 group-hover:text-foreground transition-colors duration-300">
                    {company.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Features Section ===== */}
        <section id="features" className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              className="text-center mb-12 md:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                {t('features.title').split(' ').slice(0, 1).join(' ')}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-emerald-700 dark:to-emerald-400 bg-clip-text text-transparent">
                {t('features.title')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('features.subtitle')}
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featureKeys.map((key, index) => {
                const Icon = featureIcons[index];
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    whileHover={{ scale: 1.03, y: -6 }}
                    className="group"
                  >
                    <Card className="h-full hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 border-border/40 cursor-default bg-gradient-to-b from-background to-muted/10 relative overflow-hidden">
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />
                      <CardHeader className="relative">
                        <div className="size-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mb-3 group-hover:from-emerald-500/20 group-hover:to-teal-500/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-emerald-500/10 transform">
                          <Icon className="size-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <CardTitle className="text-lg">
                          {t(`features.${key}.title`)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative">
                        <CardDescription className="text-sm leading-relaxed">
                          {t(`features.${key}.description`)}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===== How It Works Section ===== */}
        <section id="how-it-works" className="py-20 md:py-28 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-emerald-50/30 to-background dark:via-emerald-950/10" />
          <div className="absolute top-1/4 start-0 w-[400px] h-[400px] rounded-full bg-emerald-400/5 dark:bg-emerald-500/3 blur-[100px] animate-mesh-float-1" />
          <div className="absolute bottom-1/4 end-0 w-[350px] h-[350px] rounded-full bg-teal-400/5 dark:bg-teal-500/3 blur-[100px] animate-mesh-float-2" />

          <div className="relative container mx-auto px-4 md:px-6">
            <motion.div
              className="text-center mb-12 md:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                <Zap className="size-3 me-1" />
                {t('howItWorks.title')}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-emerald-700 dark:to-emerald-400 bg-clip-text text-transparent">
                {t('howItWorks.title')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('howItWorks.subtitle')}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-4xl mx-auto relative">
              {/* Connecting line (desktop only) */}
              <div className="hidden md:block absolute top-16 start-[16.67%] end-[16.67%] h-[2px] bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 dark:from-emerald-700 dark:via-teal-700 dark:to-cyan-700 opacity-30" />

              {[0, 1, 2].map((i) => {
                const step = howItWorksSteps[i];
                const StepIcon = step.icon;
                const stepKey = `step${i + 1}` as const;
                const colorClasses = [
                  'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
                  'from-teal-500 to-teal-600 shadow-teal-500/25',
                  'from-cyan-500 to-cyan-600 shadow-cyan-500/25',
                ];
                const bgClasses = [
                  'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/50',
                  'bg-teal-50 dark:bg-teal-950/30 border-teal-200/50 dark:border-teal-800/50',
                  'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200/50 dark:border-cyan-800/50',
                ];

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2, duration: 0.5 }}
                    className="flex flex-col items-center text-center group"
                  >
                    {/* Step number + icon */}
                    <div className="relative mb-6">
                      <div className={`size-16 rounded-2xl bg-gradient-to-br ${colorClasses[i]} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                        <StepIcon className="size-7 text-white" />
                      </div>
                      <div className={`absolute -top-2 -end-2 size-6 rounded-full bg-background border-2 ${i === 0 ? 'border-emerald-500' : i === 1 ? 'border-teal-500' : 'border-cyan-500'} flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'text-emerald-600 dark:text-emerald-400' : i === 1 ? 'text-teal-600 dark:text-teal-400' : 'text-cyan-600 dark:text-cyan-400'}`}>
                        {i + 1}
                      </div>
                    </div>
                    {/* Content */}
                    <h3 className="text-xl font-bold mb-2">{t(`howItWorks.${stepKey}.title`)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{t(`howItWorks.${stepKey}.description`)}</p>
                    {/* Arrow between steps (desktop) */}
                    {i < 2 && (
                      <div className="hidden md:flex absolute top-16 end-0 translate-x-1/2 items-center justify-center">
                        <ChevronRight className="size-5 text-muted-foreground/30 rtl:rotate-180" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===== Testimonials Section ===== */}
        <section id="testimonials" className="py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              className="text-center mb-12 md:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                Testimonials
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-emerald-700 dark:to-emerald-400 bg-clip-text text-transparent">
                {t('testimonials.title')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('testimonials.subtitle')}
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.4 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                >
                  <Card className="h-full hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 border-border/40 relative overflow-hidden group">
                    {/* Subtle glow on hover */}
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-emerald-500/3 via-transparent to-teal-500/3" />
                    <CardHeader className="pb-4 relative">
                      <Quote className="size-8 text-emerald-200 dark:text-emerald-900/50 mb-2" />
                      <p className="text-sm leading-relaxed text-muted-foreground italic">
                        &ldquo;{t(`testimonials.items.${i}.quote`)}&rdquo;
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0 relative">
                      <Separator className="mb-4" />
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-full bg-gradient-to-br ${companyColors[i]} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                          {t(`testimonials.items.${i}.name`).charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{t(`testimonials.items.${i}.name`)}</div>
                          <div className="text-xs text-muted-foreground">{t(`testimonials.items.${i}.role`)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Pricing Section ===== */}
        <section id="pricing" className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              className="text-center mb-12 md:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                Pricing
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-emerald-700 dark:to-emerald-400 bg-clip-text text-transparent">
                {t('pricing.title')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t('pricing.subtitle')}
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                whileHover={{ y: -6 }}
              >
                <Card className="relative h-full hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 border-border/40">
                  <CardHeader>
                    <CardTitle className="text-xl">{t('pricing.free.name')}</CardTitle>
                    <div className="mt-2">
                      <span className="text-4xl font-extrabold">{t('pricing.free.price')}</span>
                      <span className="text-muted-foreground">{t('pricing.free.period')}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <div className="size-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span>{t(`pricing.free.features.${i}`)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all duration-300" asChild>
                      <Link href="/signup">{t('pricing.free.cta')}</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>

              {/* Pro Plan with gradient border / glow + "Most Popular" badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15, duration: 0.4 }}
                whileHover={{ y: -6 }}
              >
                <div className="relative rounded-xl p-[2px] bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/20 h-full transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30">
                  {/* Animated glow behind the card */}
                  <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 animate-glow-pulse -z-10 blur-md" />
                  <Card className="relative h-full bg-background rounded-[10px]">
                    <div className="absolute -top-3 inset-x-0 flex justify-center">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1 border-0 shadow-sm shadow-emerald-500/30 text-xs font-semibold">
                        <Zap className="size-3 me-1" />
                        {t('pricing.pro.mostPopular')}
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl">{t('pricing.pro.name')}</CardTitle>
                      <div className="mt-2">
                        <span className="text-4xl font-extrabold">{t('pricing.pro.price')}</span>
                        <span className="text-muted-foreground">{t('pricing.pro.period')}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <div className="size-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                              <Check className="size-3 text-emerald-500" />
                            </div>
                            <span>{t(`pricing.pro.features.${i}`)}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02]" asChild>
                        <Link href="/signup">{t('pricing.pro.cta')}</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== FAQ Section ===== */}
        <section id="faq" className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/10">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              className="text-center mb-12 md:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                FAQ
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-emerald-700 dark:to-emerald-400 bg-clip-text text-transparent">
                {t('faq.title')}
              </h2>
            </motion.div>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                {[0, 1, 2, 3].map((i) => {
                  const FaqIcon = faqIcons[i];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                    >
                      <AccordionItem value={`item-${i}`} className="border-border/40 group">
                        <AccordionTrigger className="text-start hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-4 hover:no-underline">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 flex items-center justify-center shrink-0 transition-colors duration-300">
                              <FaqIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-start">{t(`faq.items.${i}.q`)}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed pb-4 ps-11">
                          {t(`faq.items.${i}.a`)}
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  );
                })}
              </Accordion>
            </div>
          </div>
        </section>

        {/* ===== CTA Section ===== */}
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600" />
              {/* Gradient mesh blobs for depth */}
              <div className="absolute top-0 start-0 w-[300px] h-[300px] rounded-full bg-emerald-400/20 blur-[80px] animate-mesh-float-1" />
              <div className="absolute bottom-0 end-0 w-[250px] h-[250px] rounded-full bg-teal-400/20 blur-[80px] animate-mesh-float-2" />
              <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-cyan-400/15 blur-[60px] animate-mesh-float-3" />
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='0.15' fill-rule='evenodd'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
              {/* Shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10" />
              {/* Animated shimmer sweep */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 animate-shimmer-slide">
                  <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
                </div>
              </div>
              <div className="relative px-6 py-14 md:px-12 md:py-20 text-center">
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 drop-shadow-sm">
                  {t('hero.cta')}
                </h2>
                <p className="text-emerald-100/90 text-lg max-w-xl mx-auto mb-8">
                  {t('hero.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    size="lg"
                    className="text-base px-8 gap-2 bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg shadow-black/10 hover:scale-[1.02] transition-all duration-300"
                    asChild
                  >
                    <Link href="/signup">
                      {t('hero.cta')}
                      <ArrowIcon className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ===== Enhanced Footer ===== */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand column */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm shadow-emerald-500/20">
                  <Shield className="size-4.5 text-white" />
                </div>
                <span className="text-lg font-bold">{tc('appName')}</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
                {t('footer.description')}
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="size-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                  <Twitter className="size-4" />
                </a>
                <a href="#" className="size-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                  <Linkedin className="size-4" />
                </a>
                <a href="#" className="size-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                  <Github className="size-4" />
                </a>
              </div>
            </div>

            {/* Product column */}
            <div>
              <h4 className="font-semibold text-sm mb-4">{t('footer.product')}</h4>
              <ul className="space-y-2.5">
                <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.features')}</a></li>
                <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.pricing')}</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.integrations')}</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.changelog')}</a></li>
              </ul>
            </div>

            {/* Company column */}
            <div>
              <h4 className="font-semibold text-sm mb-4">{t('footer.company')}</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.about')}</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.blog')}</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.careers')}</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.contact')}</a></li>
              </ul>
            </div>

            {/* Legal column */}
            <div>
              <h4 className="font-semibold text-sm mb-4">{t('footer.legal')}</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.privacyPolicy')}</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.termsOfService')}</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.cookiePolicy')}</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('footer.security')}</a></li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {tc('appName')}. {t('footer.rights')}
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                {t('footer.privacy')}
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                {t('footer.terms')}
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== Back to Top Floating Button ===== */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className="fixed bottom-6 end-6 z-50 size-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-110 transition-all duration-300 flex items-center justify-center"
            aria-label={t('backToTop')}
          >
            <ArrowUp className="size-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
