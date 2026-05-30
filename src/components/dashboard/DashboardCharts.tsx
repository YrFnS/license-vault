'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Plus } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface LicenseDistribution {
  name: string;
  value: number;
  color: string;
}

interface MonthlyActivity {
  month: string;
  created: number;
}

interface DashboardChartsProps {
  licenseDistribution: LicenseDistribution[];
  monthlyActivity: MonthlyActivity[];
  loading?: boolean;
}

// Chart colors matching app theme (emerald/teal/amber/red)
const DISTRIBUTION_COLORS: Record<string, string> = {
  active: '#10b981',     // emerald-500
  expiring: '#f59e0b',   // amber-500
  expired: '#ef4444',    // red-500
  renewed: '#14b8a6',    // teal-500
};

// Polished tooltip style with rounded corners and shadow
const tooltipStyle: React.CSSProperties = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '10px',
  fontSize: '12px',
  color: 'hsl(var(--popover-foreground))',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)',
  padding: '8px 12px',
};

export function DashboardCharts({ licenseDistribution, monthlyActivity, loading }: DashboardChartsProps) {
  const t = useTranslations('dashboard');

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[250px]">
              <Skeleton className="h-[200px] w-[200px] rounded-full" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasDistributionData = licenseDistribution.some((d) => d.value > 0);
  const hasActivityData = monthlyActivity.some((d) => d.created > 0);

  // For donut chart center text
  const totalLicenses = licenseDistribution.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* License Status Distribution - Donut Chart */}
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <PieChartIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-base">{t('licenseDistribution')}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {hasDistributionData
                  ? t('complianceScoreDesc')
                  : t('noChartDataDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasDistributionData ? (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-[260px]">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={licenseDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {licenseDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={DISTRIBUTION_COLORS[entry.name] || entry.color || '#6b7280'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number, name: string) => {
                        const labelMap: Record<string, string> = {
                          active: t('activeLicenses'),
                          expiring: t('expiringLicenses'),
                          expired: t('expiredLicenses'),
                        };
                        return [value, labelMap[name] || name];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-foreground">{totalLicenses}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('charts')}</span>
                </div>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 justify-center">
                {licenseDistribution.map((entry) => {
                  const labelMap: Record<string, string> = {
                    active: t('activeLicenses'),
                    expiring: t('expiringLicenses'),
                    expired: t('expiredLicenses'),
                  };
                  return (
                    <div key={entry.name} className="flex items-center gap-1.5 text-sm">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: DISTRIBUTION_COLORS[entry.name] || entry.color }}
                      />
                      <span className="text-muted-foreground">{labelMap[entry.name] || entry.name}</span>
                      <span className="font-semibold text-foreground">{entry.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyChartState icon={PieChartIcon} title={t('noChartData')} description={t('noChartDataDesc')} ctaHref="/licenses/new" ctaLabel={t('addLicense')} />
          )}
        </CardContent>
      </Card>

      {/* Monthly License Activity - Bar Chart */}
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
              <BarChart3 className="size-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <CardTitle className="text-base">{t('monthlyActivity')}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {hasActivityData
                  ? t('licensesCreated')
                  : t('noChartDataDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasActivityData ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyActivity} barCategoryGap="20%">
                <XAxis
                  dataKey="month"
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
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [value, t('licensesCreated')]}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                />
                <Bar
                  dataKey="created"
                  fill="#14b8a6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                  animationBegin={0}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState icon={TrendingUp} title={t('noChartData')} description={t('noChartDataDesc')} ctaHref="/licenses/new" ctaLabel={t('addLicense')} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Lightweight pie chart icon (avoid conflict with recharts PieChart)
function PieChartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}

// Empty state for charts with gradient background, watermark icon, and CTA
function EmptyChartState({
  icon: Icon,
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center py-12 text-center overflow-hidden rounded-lg">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/40 via-muted/20 to-transparent" />
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      {/* Watermark icon in background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.04] dark:opacity-[0.03]">
        <Icon className="size-40" />
      </div>
      <div className="relative">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/20 p-5 mb-4 shadow-sm">
          <Icon className="size-10 text-emerald-400 dark:text-emerald-500" />
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-[220px] leading-relaxed">{description}</p>
        {ctaHref && ctaLabel && (
          <Button variant="outline" size="sm" className="mt-4 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-colors duration-200" asChild>
            <Link href={ctaHref}>
              <Plus className="size-4 me-1" />
              {ctaLabel}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
