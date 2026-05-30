'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { BarChart3, Users, CheckCircle, Clock, ShieldAlert, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

interface DashboardData {
  summary: {
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
  };
  recentLicenses: Array<{
    id: string;
    name: string;
    status: string;
    expirationDate: string;
  }>;
}

interface AdminStats {
  totalUsers: number;
  totalOrganizations: number;
  totalLicenses: number;
  licenseDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  licenseTypeDistribution: Array<{
    type: string;
    count: number;
  }>;
  monthlySignups: Array<{
    month: string;
    signups: number;
  }>;
  complianceTrend: Array<{
    month: string;
    rate: number;
  }>;
  recentActivityCount: number;
}

interface TeamData {
  members: Array<{
    id: string;
    role: string;
    joinedAt: string | null;
  }>;
}

// Pie chart colors
const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444']; // emerald, amber, red

export default function AdminPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [userRole, setUserRole] = useState<string>('member');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [dashRes, settingsRes, teamRes, adminStatsRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/settings'),
        fetch('/api/team'),
        fetch('/api/admin/stats'),
      ]);

      if (dashRes.ok) {
        const data = await dashRes.json();
        setDashboardData(data);
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setUserRole(data.userRole || 'member');
      }

      if (teamRes.ok) {
        const data = await teamRes.json();
        setTeamData(data);
      }

      if (adminStatsRes.ok) {
        const data = await adminStatsRes.json();
        setAdminStats(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const canAccess = ['owner', 'admin'].includes(userRole);

  // Compute values from admin stats API (primary) or fallback to dashboard data
  const totalLicenses = adminStats?.totalLicenses || dashboardData?.summary.total || 0;
  const totalUsers = adminStats?.totalUsers || teamData?.members.length || 0;
  const activeCount = dashboardData?.summary.active || 0;
  const expiringCount = dashboardData?.summary.expiringSoon || 0;
  const expiredCount = dashboardData?.summary.expired || 0;
  const complianceRate = totalLicenses > 0
    ? Math.round(((totalLicenses - expiredCount) / totalLicenses) * 100)
    : 100;

  // Compliance trend from real data
  const complianceTrend = adminStats?.complianceTrend || [];

  // License type distribution from real data
  const licenseTypeData = adminStats?.licenseTypeDistribution || [];

  // Pie chart data from admin stats distribution or fallback
  const pieData = (adminStats?.licenseDistribution || [
    { name: 'active', value: activeCount, color: '#10b981' },
    { name: 'expiring', value: expiringCount, color: '#f59e0b' },
    { name: 'expired', value: expiredCount, color: '#ef4444' },
  ])
    .map((d) => ({
      name: d.name === 'active' ? t('active') : d.name === 'expiring' ? t('expiringSoon') : d.name === 'expired' ? t('expired') : d.name,
      value: d.value,
    }))
    .filter((d) => d.value > 0);

  // If all zero, show placeholder
  const hasLicenseData = totalLicenses > 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      locale === 'ar' ? 'ar-SA' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <ShieldAlert className="size-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">{t('accessDenied')}</h2>
            <p className="text-sm text-muted-foreground">
              Only owners and admins can access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Licenses */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
                <BarChart3 className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('stats.totalLicenses')}</p>
                <p className="text-2xl font-bold">{totalLicenses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
                <Users className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('stats.totalUsers')}</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
                <CheckCircle className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('stats.complianceRate')}</p>
                <p className="text-2xl font-bold">{complianceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Count */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900">
                <Activity className="size-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('recentActivity')}</p>
                <p className="text-2xl font-bold">{adminStats?.recentActivityCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compliance Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('complianceTrend')}</CardTitle>
            <CardDescription>{t('complianceTrendDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {complianceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={complianceTrend}>
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                    formatter={(value: number) => [`${value}%`, t('complianceRate')]}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6, fill: '#059669' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {tCommon('noResults')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* License Status Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('statusDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            {hasLicenseData ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'hsl(var(--popover-foreground))',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-4 mt-2 justify-center">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="size-3 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{entry.name}</span>
                      <span className="font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {tCommon('noResults')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* License Distribution Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('licenseDistribution')}</CardTitle>
          <CardDescription>{t('licenseDistributionDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {licenseTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={licenseTypeData}>
                <XAxis
                  dataKey="type"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#14b8a6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {tCommon('noResults')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Status Distribution (Progress bars) + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution Detail */}
        <Card>
          <CardHeader>
            <CardTitle>{t('statusBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {totalLicenses === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {tCommon('noResults')}
              </p>
            ) : (
              <>
                {/* Active */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-emerald-500" />
                      {t('active')}
                    </span>
                    <span className="font-medium">{activeCount} ({Math.round((activeCount / totalLicenses) * 100)}%)</span>
                  </div>
                  <Progress
                    value={(activeCount / totalLicenses) * 100}
                    className="h-2"
                  />
                </div>

                {/* Expiring Soon */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-amber-500" />
                      {t('expiringSoon')}
                    </span>
                    <span className="font-medium">{expiringCount} ({Math.round((expiringCount / totalLicenses) * 100)}%)</span>
                  </div>
                  <Progress
                    value={(expiringCount / totalLicenses) * 100}
                    className="h-2"
                  />
                </div>

                {/* Expired */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-red-500" />
                      {t('expired')}
                    </span>
                    <span className="font-medium">{expiredCount} ({Math.round((expiredCount / totalLicenses) * 100)}%)</span>
                  </div>
                  <Progress
                    value={(expiredCount / totalLicenses) * 100}
                    className="h-2"
                  />
                </div>

                {/* Visual bar */}
                <Separator />
                <div className="flex h-4 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-emerald-500 transition-all"
                    style={{ width: `${(activeCount / totalLicenses) * 100}%` }}
                  />
                  <div
                    className="bg-amber-500 transition-all"
                    style={{ width: `${(expiringCount / totalLicenses) * 100}%` }}
                  />
                  <div
                    className="bg-red-500 transition-all"
                    style={{ width: `${(expiredCount / totalLicenses) * 100}%` }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData && dashboardData.recentLicenses.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData.recentLicenses.map((license) => (
                  <div
                    key={license.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{license.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(license.expirationDate)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'shrink-0 capitalize text-xs',
                        license.status === 'active' && 'text-emerald-600 border-emerald-300',
                        license.status === 'expiring_soon' && 'text-amber-600 border-amber-300',
                        license.status === 'expired' && 'text-red-600 border-red-300',
                      )}
                    >
                      {license.status === 'active'
                        ? t('active')
                        : license.status === 'expiring_soon'
                        ? t('expiringSoon')
                        : t('expired')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('noActivity')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
