'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { ProactiveAlerts } from '@/components/dashboard/ProactiveAlerts';
import { ExpirationCheckWidget } from '@/components/dashboard/ExpirationCheckWidget';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { ActivityTimeline, ActivityTimelineSkeleton, type ActivityEntry } from '@/components/dashboard/ActivityTimeline';
import { ComplianceForecast, ComplianceForecastSkeleton, type ForecastLicense } from '@/components/dashboard/ComplianceForecast';
import { NotificationSummary, NotificationSummarySkeleton } from '@/components/dashboard/NotificationSummary';
import { MultiStateDashboard } from '@/components/dashboard/MultiStateDashboard';
import { ComplianceForecastWidget, ComplianceForecastWidgetSkeleton } from '@/components/dashboard/ComplianceForecastWidget';
import { RiskScoreGauge } from '@/components/dashboard/RiskScoreGauge';
import { LicenseTable, type License } from '@/components/licenses/LicenseTable';
import { LicenseQuickView } from '@/components/licenses/LicenseQuickView';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  FileText,
  Upload,
  Bot,
  Bell,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRole } from '@/hooks/useRole';

interface LicenseDistribution {
  name: string;
  value: number;
  color: string;
}

interface MonthlyActivity {
  month: string;
  created: number;
}

interface ForecastData {
  riskScore: number;
  riskLevel: string;
  complianceScore: number;
  totalItems: number;
  activeItems: number;
  itemsNeedingAction: number;
  estimatedCostToMaintain: number;
  totalCeHoursNeeded: number;
}

interface DashboardData {
  summary: {
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
  };
  recentLicenses: License[];
  recentActivity: ActivityEntry[];
  licenseDistribution: LicenseDistribution[];
  monthlyActivity: MonthlyActivity[];
  expiringLicenses: ForecastLicense[];
  forecast?: ForecastData;
}

// Circular progress indicator for compliance score
function ComplianceScore({ active, total }: { active: number; total: number }) {
  const t = useTranslations('dashboard');
  const percentage = total > 0 ? Math.round((active / total) * 100) : -1;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage < 0) return 'text-muted-foreground';
    if (percentage >= 80) return 'text-emerald-500';
    if (percentage >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getTrackColor = () => {
    if (percentage < 0) return 'stroke-muted-foreground/20';
    if (percentage >= 80) return 'stroke-emerald-200 dark:stroke-emerald-900';
    if (percentage >= 60) return 'stroke-amber-200 dark:stroke-amber-900';
    return 'stroke-red-200 dark:stroke-red-900';
  };

  const getFillColor = () => {
    if (percentage < 0) return 'stroke-muted-foreground/30';
    if (percentage >= 80) return 'stroke-emerald-500';
    if (percentage >= 60) return 'stroke-amber-500';
    return 'stroke-red-500';
  };

  const displayPercentage = percentage < 0 ? '—' : `${percentage}%`;
  const actualOffset = percentage < 0 ? circumference : strokeDashoffset;

  return (
    <Card className="relative overflow-hidden border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-900/20 shadow-md hover:shadow-xl transition-all duration-300 border-s-[5px] border-s-emerald-400 dark:border-s-emerald-600 border-t-[3px] border-t-emerald-300 dark:border-t-emerald-600">
      {/* Subtle glow behind SVG */}
      <div className="absolute top-1/2 -translate-y-1/2 start-6 size-28 rounded-full bg-emerald-300/20 dark:bg-emerald-600/10 blur-2xl pointer-events-none" />
      {/* Decorative glow */}
      <div className="absolute -top-12 -end-12 size-32 rounded-full bg-emerald-200/30 dark:bg-emerald-700/10 blur-2xl" />
      <CardContent className="relative p-4 md:p-6 flex items-center gap-6">
        <div className="relative shrink-0">
          <svg width="96" height="96" className="transform -rotate-90 animate-breathe">
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              strokeWidth="8"
              className={getTrackColor()}
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={actualOffset}
              className={`${getFillColor()} transition-all duration-1000 ease-out`}
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
              className={`text-2xl font-extrabold ${getColor()}`}
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
            >
              {displayPercentage}
            </motion.span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{t('complianceScore')}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('complianceScoreDesc')}</p>
          <div className="flex items-center gap-1.5 mt-2">
            {percentage < 0 ? (
              <ShieldAlert className="size-4 text-muted-foreground shrink-0" />
            ) : percentage >= 80 ? (
              <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
            ) : (
              <ShieldAlert className="size-4 text-amber-500 shrink-0" />
            )}
            <span className="text-xs font-medium text-muted-foreground">
              {percentage < 0 ? t('emptyStateTitle') : percentage >= 80 ? t('complianceGood') : t('complianceNeedsAttention')}
            </span>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
          <span className="text-2xl font-bold text-foreground">{active}</span>
          <span className="text-xs text-muted-foreground">
            {total > 0 ? `/ ${total}` : t('emptyStateTitle').split(' ').slice(0,2).join(' ')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Actions section
function QuickActions() {
  const t = useTranslations('dashboard');
  const { canManageLicenses, canManage } = useRole();

  const allActions = [
    {
      key: 'addLicense',
      icon: Plus,
      href: '/licenses/new',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      requireManage: true,
    },
    {
      key: 'importCsv',
      icon: Upload,
      href: '/import',
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-950/30',
      borderColor: 'border-teal-200 dark:border-teal-800',
      requireManage: true,
    },
    {
      key: 'aiChat',
      icon: Bot,
      href: '/ai-chat',
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-50 dark:bg-violet-950/30',
      borderColor: 'border-violet-200 dark:border-violet-800',
    },
    {
      key: 'viewAlerts',
      icon: Bell,
      href: '/alerts',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.07 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {allActions.filter(a => !a.requireManage || canManage).map((action) => {
        const Icon = action.icon;
        return (
          <motion.div key={action.key} variants={itemVariants}>
            <Link
              href={action.href}
              className="group flex flex-col items-center gap-2 rounded-xl border py-5 px-4 transition-all duration-200 hover:shadow-lg hover:scale-[1.03] hover:-translate-y-0.5 bg-card shadow-sm"
            >
              <div className={`rounded-full p-2.5 ${action.bgColor} ${action.borderColor} border transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3`}>
                <Icon className={`size-5 ${action.color} transition-transform duration-200 group-hover:-rotate-3`} />
              </div>
              <span className="text-xs font-medium text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                {t(action.key)}
              </span>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// Get Started Banner for new users with no licenses
function GetStartedBanner({ onDismiss }: { onDismiss: () => void }) {
  const t = useTranslations('dashboard');

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-lg"
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
      <div className="absolute -top-16 -end-16 size-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-12 -start-12 size-36 rounded-full bg-teal-300/20 blur-xl" />

      <div className="relative p-8 md:p-10">
        <button
          onClick={onDismiss}
          className="absolute top-5 end-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label={t('getStartedDismiss')}
        >
          <X className="size-4 text-white" />
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
          <div className="flex items-center justify-center size-16 rounded-2xl bg-white/15 backdrop-blur-sm shrink-0 shadow-lg shadow-emerald-900/20">
            <Sparkles className="size-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-white">{t('getStarted')}</h2>
            <p className="text-sm md:text-base text-emerald-50/90 mt-1.5 max-w-lg leading-relaxed">{t('getStartedDesc')}</p>
          </div>
          <div className="shrink-0">
            <Button
              asChild
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold gap-2 shadow-lg shadow-emerald-900/20 transition-all duration-200 hover:scale-[1.02]"
            >
              <Link href="/onboarding">
                {t('getStartedCta')}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [quickViewLicense, setQuickViewLicense] = useState<License | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      // Check if user has no licenses and hasn't dismissed the banner
      if (json.summary.total === 0) {
        const dismissed = localStorage.getItem('dashboard_getStarted_dismissed');
        if (!dismissed) {
          setShowGetStarted(true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch forecast data separately
  const fetchForecast = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/forecast');
      if (!res.ok) return;
      const json = await res.json();
      setForecastData(json);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleDismissGetStarted = useCallback(() => {
    setShowGetStarted(false);
    localStorage.setItem('dashboard_getStarted_dismissed', 'true');
  }, []);

  const handleDeleteLicense = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete license');
      toast.success('License deleted successfully');
      fetchDashboard();
    } catch {
      toast.error('Failed to delete license');
    }
  }, [fetchDashboard]);

  const handleQuickView = useCallback((license: License) => {
    setQuickViewLicense(license);
    setQuickViewOpen(true);
  }, []);

  const handleRenewFromQuickView = useCallback((id: string) => {
    router.push(`/licenses/${id}`);
  }, [router]);

  const userName = session?.user?.name || 'User';
  const firstName = userName.split(' ')[0];

  // Format last updated time
  const formatLastUpdated = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 md:p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <ComplianceForecastSkeleton />
        <ActivityTimelineSkeleton />
        <NotificationSummarySkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full border-destructive/20 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex items-center justify-center size-16 rounded-full bg-destructive/10">
              <ShieldAlert className="size-8 text-destructive" />
            </div>
            <p className="text-lg font-semibold text-foreground">{t('loadError') || 'Failed to load dashboard'}</p>
            <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">{error}</p>
            <p className="text-xs text-muted-foreground/70 mt-2">{t('loadErrorHint') || 'Check your connection and try again'}</p>
            <Button onClick={handleRefresh} variant="outline" className="mt-6 gap-2 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-colors duration-200">
              <RefreshCw className="size-4" />
              {tc('retry') || 'Retry'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Get Started Banner - only shown when no licenses */}
      <AnimatePresence>
        {showGetStarted && data.summary.total === 0 && (
          <GetStartedBanner onDismiss={handleDismissGetStarted} />
        )}
      </AnimatePresence>

      {/* Welcome Message + Last Updated */}
      <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        {/* Decorative gradient behind welcome */}
        <div className="absolute -top-8 -start-8 size-52 rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/30 dark:from-emerald-900/30 dark:to-teal-900/20 blur-3xl pointer-events-none" />
        <div className="absolute -top-4 start-12 size-20 rounded-full bg-emerald-300/20 dark:bg-emerald-700/10 blur-2xl pointer-events-none" />
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-emerald-600 dark:to-emerald-400 bg-clip-text text-transparent">
            {t('welcomeBack')}, {firstName}!
          </h1>
          <p className="text-muted-foreground/80 mt-1.5 text-sm md:text-base">{t('overview')}</p>
        </div>
        {lastUpdated && (
          <div className="relative flex items-center gap-2 text-xs text-muted-foreground shrink-0 rounded-full bg-muted/50 px-3 py-1.5 border border-border/50">
            <span>{t('lastUpdated')}: {formatLastUpdated(lastUpdated)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`size-3 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-wider mb-3">{t('quickActions')}</h2>
        <QuickActions />
      </div>

      {/* Summary Cards */}
      <SummaryCards
        total={data.summary.total}
        active={data.summary.active}
        expiring={data.summary.expiringSoon}
        expired={data.summary.expired}
      />

      {/* Compliance Score + Risk Score */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComplianceScore
          active={data.summary.active}
          total={data.summary.total}
        />
        {forecastData && (
          <RiskScoreGauge
            score={forecastData.riskScore}
            totalItems={forecastData.totalItems}
            itemsNeedingAction={forecastData.itemsNeedingAction}
          />
        )}
      </div>

      {/* Dashboard Charts */}
      <DashboardCharts
        licenseDistribution={data.licenseDistribution}
        monthlyActivity={data.monthlyActivity}
      />

      {/* Multi-State Dashboard */}
      <MultiStateDashboard />

      {/* Alert Banner */}
      <AlertBanner
        expiredCount={data.summary.expired}
        expiringCount={data.summary.expiringSoon}
      />

      {/* AI Compliance Alerts */}
      <ProactiveAlerts />

      {/* Expiration Check Widget */}
      <ExpirationCheckWidget />

      {/* Compliance Forecast + Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComplianceForecast
          licenses={data.expiringLicenses}
          totalLicenses={data.summary.total}
          activeLicenses={data.summary.active}
        />
        <ActivityTimeline activities={data.recentActivity} />
      </div>

      {/* Compliance Forecast Widget (with risk + what-if) */}
      <ComplianceForecastWidget />

      {/* Notification Summary */}
      <NotificationSummary />

      {/* Recent Licenses */}
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>{t('recentLicenses')}</CardTitle>
            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              {data.recentLicenses.length}
            </Badge>
          </div>
          <Button variant="outline" size="sm" asChild className="hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-colors duration-200">
            <Link href="/licenses/new">
              <Plus className="size-4 me-1" />
              {tc('create')}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.recentLicenses.length === 0 ? (
            <div className="relative flex flex-col items-center justify-center py-16 text-center overflow-hidden rounded-lg">
              {/* Subtle background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-muted/10 to-transparent" />
              <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="relative">
                <div className="relative mb-6">
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/20 p-6">
                    <FileText className="size-12 text-emerald-400 dark:text-emerald-500" />
                  </div>
                  <div className="absolute -bottom-1 -end-1 rounded-full bg-emerald-100 dark:bg-emerald-900 p-1.5">
                    <Plus className="size-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <p className="font-medium text-foreground">{t('emptyStateTitle')}</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">{t('emptyStateDesc')}</p>
                <Button variant="outline" size="sm" className="mt-4 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-colors duration-200" asChild>
                  <Link href="/licenses/new">
                    <Plus className="size-4 me-1" />
                    {tc('create')}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <LicenseTable
              licenses={data.recentLicenses}
              onDelete={handleDeleteLicense}
              onQuickView={handleQuickView}
              compact
            />
          )}
        </CardContent>
      </Card>

      {/* License Quick View Modal */}
      <LicenseQuickView
        license={quickViewLicense}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        onRenew={handleRenewFromQuickView}
      />
    </div>
  );
}
