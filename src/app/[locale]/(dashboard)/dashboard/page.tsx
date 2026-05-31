'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus, FileText, RefreshCw, ShieldCheck, ShieldAlert,
} from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { AnimatePresence } from 'framer-motion';
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
import { ComplianceScoreCard } from './ComplianceScoreCard';
import { QuickActions } from './QuickActions';
import { GetStartedBanner } from './GetStartedBanner';

interface LicenseDistribution { name: string; value: number; color: string }
interface MonthlyActivity { month: string; created: number }
interface ForecastData { riskScore: number; riskLevel: string; complianceScore: number; totalItems: number; activeItems: number; itemsNeedingAction: number; estimatedCostToMaintain: number; totalCeHoursNeeded: number }

interface DashboardData {
  summary: { total: number; active: number; expiringSoon: number; expired: number }
  recentLicenses: License[]
  recentActivity: ActivityEntry[]
  licenseDistribution: LicenseDistribution[]
  monthlyActivity: MonthlyActivity[]
  expiringLicenses: ForecastLicense[]
  forecast?: ForecastData
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
      if (json.summary.total === 0) {
        const dismissed = localStorage.getItem('dashboard_getStarted_dismissed');
        if (!dismissed) setShowGetStarted(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchForecast = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/forecast');
      if (!res.ok) return;
      setForecastData(await res.json());
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => { fetchForecast(); }, [fetchForecast]);
  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleRefresh = () => { setRefreshing(true); fetchDashboard(); };
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
    } catch { toast.error('Failed to delete license'); }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-7 w-12" /></CardContent></Card>
          ))}
        </div>
        <Card><CardHeader><Skeleton className="h-5 w-32" /></CardHeader><CardContent><div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div></CardContent></Card>
        <ComplianceForecastSkeleton />
        <ActivityTimelineSkeleton />
        <NotificationSummarySkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex items-center justify-center size-14 rounded-full bg-destructive/10">
              <ShieldAlert className="size-7 text-destructive" />
            </div>
            <p className="text-lg font-semibold text-foreground">{t('loadError') || 'Failed to load dashboard'}</p>
            <p className="text-muted-foreground text-sm mt-2">{error}</p>
            <Button onClick={handleRefresh} variant="outline" className="mt-6 gap-2">
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
    <div className="space-y-6">
      <AnimatePresence>
        {showGetStarted && data.summary.total === 0 && (
          <GetStartedBanner onDismiss={handleDismissGetStarted} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('welcomeBack')}, {firstName}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('overview')}</p>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t('lastUpdated')}: {lastUpdated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
            <Button variant="ghost" size="icon" className="size-7" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}
      </div>

      <QuickActions />

      <SummaryCards
        total={data.summary.total}
        active={data.summary.active}
        expiring={data.summary.expiringSoon}
        expired={data.summary.expired}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ComplianceScoreCard active={data.summary.active} total={data.summary.total} />
        {forecastData && (
          <RiskScoreGauge
            score={forecastData.riskScore}
            totalItems={forecastData.totalItems}
            itemsNeedingAction={forecastData.itemsNeedingAction}
          />
        )}
      </div>

      <DashboardCharts
        licenseDistribution={data.licenseDistribution}
        monthlyActivity={data.monthlyActivity}
      />

      <MultiStateDashboard />

      <AlertBanner
        expiredCount={data.summary.expired}
        expiringCount={data.summary.expiringSoon}
      />

      <ProactiveAlerts />
      <ExpirationCheckWidget />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ComplianceForecast
          licenses={data.expiringLicenses}
          totalLicenses={data.summary.total}
          activeLicenses={data.summary.active}
        />
        <ActivityTimeline activities={data.recentActivity} />
      </div>

      <ComplianceForecastWidget />
      <NotificationSummary />

      {/* Recent Licenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{t('recentLicenses')}</CardTitle>
            <Badge variant="secondary" className="text-xs">{data.recentLicenses.length}</Badge>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/licenses/new"><Plus className="size-4 me-1" />{tc('create')}</Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {data.recentLicenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-xl bg-muted p-4 mb-3">
                <FileText className="size-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">{t('emptyStateTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('emptyStateDesc')}</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/licenses/new"><Plus className="size-4 me-1" />{tc('create')}</Link>
              </Button>
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

      <LicenseQuickView
        license={quickViewLicense}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        onRenew={handleRenewFromQuickView}
      />
    </div>
  );
}
