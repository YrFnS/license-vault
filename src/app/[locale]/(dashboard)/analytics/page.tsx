'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import {
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  HeartPulse,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Lightbulb,
  AlertOctagon,
  FileWarning,
  Repeat,
  Users,
  FileBarChart,
  Download,
  Clock,
  Mail,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// Types
interface OverviewData {
  complianceScore: number;
  financialExposure: number;
  activeRiskItems: number;
  portfolioHealth: number;
  total: number;
  active: number;
  expiring: number;
  expired: number;
}

interface TrendPoint {
  date: string;
  score: number;
}

interface CostLicense {
  id: string;
  name: string;
  status: string;
  daysOverdue: number;
  estimatedFine: number;
  riskLevel: string;
}

interface CostData {
  totalExposure: number;
  finesRisk: number;
  projectDelayCost: number;
  lostContracts: number;
  licenses: CostLicense[];
  parameters: { avgFine: number; dailyPenaltyRate: number };
}

interface PortfolioRecommendation {
  type: string;
  severity: string;
  title: string;
  description: string;
  state?: string;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
];

const CHART_COLORS = {
  emerald: '#10b981',
  teal: '#14b8a6',
  amber: '#f59e0b',
  red: '#ef4444',
  slate: '#64748b',
};

const PIE_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPage() {
  const t = useTranslations('analytics');
  const tc = useTranslations('common');

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [trendPeriod, setTrendPeriod] = useState('30d');
  const [costData, setCostData] = useState<CostData | null>(null);
  const [teamData, setTeamData] = useState<{
    actionsByUser: { id: string; name: string; count: number }[];
    mostActiveUsers: { id: string; name: string; count: number }[];
    actionTypes: { action: string; count: number }[];
    timeline: { date: string; count: number }[];
    totalActions: number;
  } | null>(null);
  const [portfolioData, setPortfolioData] = useState<{
    recommendations: PortfolioRecommendation[];
    coverage: {
      coveredStates: string[];
      uncoveredStates: string[];
      totalStates: number;
      coveragePercent: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [avgFine, setAvgFine] = useState(2500);
  const [dailyPenalty, setDailyPenalty] = useState(100);

  // Report builder state
  const [reportType, setReportType] = useState('complianceSummary');
  const [dateRange, setDateRange] = useState('last30');
  const [stateFilter, setStateFilter] = useState('all');
  const [licenseTypeFilter, setLicenseTypeFilter] = useState('all');
  const [reportFormat, setReportFormat] = useState('pdf');
  const [generating, setGenerating] = useState(false);

  // Schedule reports state
  const [scheduleConfig, setScheduleConfig] = useState<{
    frequency: string;
    recipients: string[];
    reportType: string;
    format: string;
    enabled: boolean;
  }>({
    frequency: 'monthly',
    recipients: [],
    reportType: 'compliance',
    format: 'pdf',
    enabled: false,
  });
  const [newRecipient, setNewRecipient] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  const { toast } = useToast();

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/overview');
      if (res.ok) {
        const data = await res.json();
        setOverview(data.overview);
      }
    } catch (err) {
      console.error('Failed to fetch overview:', err);
    }
  }, []);

  const fetchTrends = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/compliance-trends?period=${trendPeriod}`);
      if (res.ok) {
        const data = await res.json();
        setTrendData(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch trends:', err);
    }
  }, [trendPeriod]);

  const fetchCost = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/cost-calculator?avgFine=${avgFine}&dailyPenalty=${dailyPenalty}`);
      if (res.ok) {
        const data = await res.json();
        setCostData(data);
      }
    } catch (err) {
      console.error('Failed to fetch cost:', err);
    }
  }, [avgFine, dailyPenalty]);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/team-activity');
      if (res.ok) {
        const data = await res.json();
        setTeamData(data);
      }
    } catch (err) {
      console.error('Failed to fetch team:', err);
    }
  }, []);

  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/portfolio');
      if (res.ok) {
        const data = await res.json();
        setPortfolioData(data);
      }
    } catch (err) {
      console.error('Failed to fetch portfolio:', err);
    }
  }, []);

  // Fetch schedule config
  const fetchScheduleConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/reports/schedule');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setScheduleConfig({
            frequency: data.config.frequency || 'monthly',
            recipients: data.config.recipients || [],
            reportType: data.config.reportType || 'compliance',
            format: data.config.format || 'pdf',
            enabled: data.config.enabled || false,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch schedule config:', err);
    }
  }, []);

  // Generate report handler
  const handleGenerateReport = useCallback(async () => {
    setGenerating(true);
    try {
      // Compute date range params
      const now = new Date();
      let startDate = '';
      let endDate = now.toISOString().split('T')[0];

      switch (dateRange) {
        case 'last7': {
          const d = new Date(); d.setDate(d.getDate() - 7); startDate = d.toISOString().split('T')[0];
          break;
        }
        case 'last30': {
          const d = new Date(); d.setDate(d.getDate() - 30); startDate = d.toISOString().split('T')[0];
          break;
        }
        case 'last90': {
          const d = new Date(); d.setDate(d.getDate() - 90); startDate = d.toISOString().split('T')[0];
          break;
        }
        case 'lastYear': {
          const d = new Date(); d.setFullYear(d.getFullYear() - 1); startDate = d.toISOString().split('T')[0];
          break;
        }
        case 'all': {
          startDate = ''; endDate = '';
          break;
        }
      }

      // Map report type to API type param
      const typeMap: Record<string, string> = {
        complianceSummary: 'compliance',
        licenseStatus: 'licenses',
        insuranceStatus: 'insurance',
        ceTracking: 'ce',
        fullAudit: 'full',
      };
      const apiType = typeMap[reportType] || 'compliance';

      let url = '';
      if (reportFormat === 'pdf') {
        const params = new URLSearchParams();
        params.set('type', apiType);
        if (stateFilter && stateFilter !== 'all') params.set('state', stateFilter);
        if (licenseTypeFilter && licenseTypeFilter !== 'all') params.set('licenseType', licenseTypeFilter);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        url = `/api/reports/pdf?${params.toString()}`;
      } else {
        const params = new URLSearchParams();
        params.set('format', 'csv');
        if (stateFilter && stateFilter !== 'all') params.set('state', stateFilter);
        if (licenseTypeFilter && licenseTypeFilter !== 'all') params.set('type', licenseTypeFilter);
        url = `/api/licenses/export?${params.toString()}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Failed to generate report' }));
        throw new Error(errData.error || 'Failed to generate report');
      }

      // Download the file
      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = reportFormat === 'pdf' ? 'compliance-report.pdf' : 'licenses-export.csv';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match) filename = match[1].replace(/['"]/g, '');
      }

      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      toast({
        title: t('reports.generate') + ' ✓',
        description: `Report downloaded as ${filename}`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  }, [reportType, dateRange, stateFilter, licenseTypeFilter, reportFormat, t, toast]);

  // Save schedule handler
  const handleSaveSchedule = useCallback(async () => {
    setSavingSchedule(true);
    try {
      const res = await fetch('/api/reports/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleConfig),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Failed to save' }));
        throw new Error(errData.error || 'Failed to save schedule');
      }
      toast({
        title: 'Schedule Saved',
        description: 'Report schedule has been saved successfully.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save schedule',
        variant: 'destructive',
      });
    } finally {
      setSavingSchedule(false);
    }
  }, [scheduleConfig, toast]);

  const addRecipient = useCallback(() => {
    const email = newRecipient.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setScheduleConfig((prev) => ({
        ...prev,
        recipients: [...prev.recipients, email],
      }));
      setNewRecipient('');
    }
  }, [newRecipient]);

  const removeRecipient = useCallback((index: number) => {
    setScheduleConfig((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index),
    }));
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchOverview(), fetchCost(), fetchTeam(), fetchPortfolio(), fetchScheduleConfig()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchOverview, fetchCost, fetchTeam, fetchPortfolio, fetchScheduleConfig]);

  useEffect(() => {
    const load = async () => {
      await fetchTrends();
    };
    load();
  }, [fetchTrends]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const getTrendIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="size-4 text-emerald-500" />;
    if (score >= 60) return <Minus className="size-4 text-amber-500" />;
    return <TrendingDown className="size-4 text-red-500" />;
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'expired_active': return <AlertOctagon className="size-4 text-red-500 shrink-0" />;
      case 'reciprocity': return <Lightbulb className="size-4 text-teal-500 shrink-0" />;
      case 'missing': return <FileWarning className="size-4 text-amber-500 shrink-0" />;
      case 'consolidation': return <Repeat className="size-4 text-emerald-500 shrink-0" />;
      default: return <AlertTriangle className="size-4 text-slate-500 shrink-0" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return <Badge className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800">{t('cost.high')}</Badge>;
      case 'medium': return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">{t('cost.medium')}</Badge>;
      case 'low': return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">{t('cost.low')}</Badge>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.4 }}>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-emerald-600 bg-clip-text text-transparent">
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('description')}</p>
      </motion.div>

      {/* Section 1: Overview Cards */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <OverviewCard
          icon={<ShieldCheck className="size-5" />}
          label={t('overview.complianceScore')}
          value={`${overview?.complianceScore ?? 0}%`}
          trend={getTrendIcon(overview?.complianceScore ?? 0)}
          iconBg="from-emerald-500/20 to-teal-500/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
          borderColor="border-s-emerald-500"
        />
        <OverviewCard
          icon={<DollarSign className="size-5" />}
          label={t('overview.financialExposure')}
          value={formatCurrency(overview?.financialExposure ?? 0)}
          trend={overview?.financialExposure ? overview.financialExposure > 0 ? <TrendingDown className="size-4 text-red-500" /> : null : null}
          iconBg="from-red-500/20 to-amber-500/20"
          iconColor="text-red-600 dark:text-red-400"
          borderColor="border-s-red-500"
        />
        <OverviewCard
          icon={<AlertTriangle className="size-5" />}
          label={t('overview.activeRiskItems')}
          value={`${overview?.activeRiskItems ?? 0}`}
          trend={overview?.activeRiskItems ? overview.activeRiskItems > 0 ? <TrendingDown className="size-4 text-amber-500" /> : null : null}
          iconBg="from-amber-500/20 to-orange-500/20"
          iconColor="text-amber-600 dark:text-amber-400"
          borderColor="border-s-amber-500"
        />
        <OverviewCard
          icon={<HeartPulse className="size-5" />}
          label={t('overview.portfolioHealth')}
          value={`${overview?.portfolioHealth ?? 0}%`}
          trend={getTrendIcon(overview?.portfolioHealth ?? 0)}
          iconBg="from-teal-500/20 to-cyan-500/20"
          iconColor="text-teal-600 dark:text-teal-400"
          borderColor="border-s-teal-500"
        />
      </motion.div>

      {/* Section 2: Compliance Trend Chart */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{t('trends.title')}</CardTitle>
                <CardDescription>{t('trends.description')}</CardDescription>
              </div>
              <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
                {(['7d', '30d', '90d', '1y'] as const).map((period) => (
                  <Button
                    key={period}
                    variant={trendPeriod === period ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'text-xs px-3 h-7',
                      trendPeriod === period && 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    )}
                    onClick={() => setTrendPeriod(period)}
                  >
                    {t(`trends.period${period.charAt(0).toUpperCase() + period.slice(1)}` as 'trends.period7d' | 'trends.period30d' | 'trends.period90d' | 'trends.period1y')}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--popover-foreground))',
                      }}
                      formatter={(value: number) => [`${value}%`, t('trends.complianceRate')]}
                      labelFormatter={(label: string) => `${t('trends.date')}: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke={CHART_COLORS.emerald}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, fill: CHART_COLORS.emerald }}
                    />
                    {/* Risk threshold line at 80% */}
                    <Line
                      type="monotone"
                      dataKey={() => 80}
                      stroke={CHART_COLORS.red}
                      strokeWidth={1}
                      strokeDasharray="6 4"
                      dot={false}
                      name={t('trends.riskThreshold')}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                <p>{t('trends.noData')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 3: Cost of Non-Compliance */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">{t('cost.title')}</CardTitle>
            <CardDescription>{t('cost.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cost summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <CostCard
                label={t('cost.totalExposure')}
                value={formatCurrency(costData?.totalExposure ?? 0)}
                valueColor="text-red-600 dark:text-red-400"
                bgGradient="from-red-50/90 via-red-50/60 to-red-100/40 dark:from-red-950/30 dark:via-red-950/20 dark:to-red-950/10"
              />
              <CostCard
                label={t('cost.finesRisk')}
                value={formatCurrency(costData?.finesRisk ?? 0)}
                valueColor="text-amber-600 dark:text-amber-400"
                bgGradient="from-amber-50/90 via-amber-50/60 to-amber-100/40 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-amber-950/10"
              />
              <CostCard
                label={t('cost.projectDelayCost')}
                value={formatCurrency(costData?.projectDelayCost ?? 0)}
                valueColor="text-orange-600 dark:text-orange-400"
                bgGradient="from-orange-50/90 via-orange-50/60 to-orange-100/40 dark:from-orange-950/30 dark:via-orange-950/20 dark:to-orange-950/10"
              />
              <CostCard
                label={t('cost.lostContracts')}
                value={formatCurrency(costData?.lostContracts ?? 0)}
                valueColor="text-slate-600 dark:text-slate-400"
                bgGradient="from-slate-50/90 via-slate-50/60 to-slate-100/40 dark:from-slate-950/30 dark:via-slate-950/20 dark:to-slate-950/10"
              />
            </div>

            {/* Parameters & Recalculate */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('cost.avgFine')}:</span>
                  <Select value={String(avgFine)} onValueChange={(v) => setAvgFine(Number(v))}>
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">$500</SelectItem>
                      <SelectItem value="1000">$1,000</SelectItem>
                      <SelectItem value="2500">$2,500</SelectItem>
                      <SelectItem value="5000">$5,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('cost.dailyPenalty')}:</span>
                  <Select value={String(dailyPenalty)} onValueChange={(v) => setDailyPenalty(Number(v))}>
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">$50/day</SelectItem>
                      <SelectItem value="100">$100/day</SelectItem>
                      <SelectItem value="200">$200/day</SelectItem>
                      <SelectItem value="500">$500/day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCost}
                className="gap-1.5 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
              >
                <RefreshCw className="size-3.5" />
                {t('cost.recalculate')}
              </Button>
            </div>

            {/* License breakdown table */}
            {costData && costData.licenses.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <ScrollArea className="max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs">{t('cost.licenseName')}</TableHead>
                        <TableHead className="text-xs">{t('cost.status')}</TableHead>
                        <TableHead className="text-xs text-end">{t('cost.daysOverdue')}</TableHead>
                        <TableHead className="text-xs text-end">{t('cost.estimatedFine')}</TableHead>
                        <TableHead className="text-xs">{t('cost.riskLevel')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costData.licenses.map((license) => (
                        <TableRow key={license.id}>
                          <TableCell className="text-sm font-medium">{license.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                license.status === 'expired'
                                  ? 'border-red-300 text-red-600 dark:border-red-800 dark:text-red-400'
                                  : 'border-amber-300 text-amber-600 dark:border-amber-800 dark:text-amber-400'
                              )}
                            >
                              {license.status === 'expired' ? t('cost.statusExpired') : t('cost.statusExpiring')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-end tabular-nums">
                            {license.daysOverdue > 0 ? license.daysOverdue : `-${Math.abs(license.daysOverdue)}`}
                          </TableCell>
                          <TableCell className="text-sm text-end tabular-nums">
                            {license.estimatedFine > 0 ? formatCurrency(license.estimatedFine) : '—'}
                          </TableCell>
                          <TableCell>{getSeverityBadge(license.riskLevel)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShieldCheck className="size-8 mx-auto mb-2 text-emerald-500" />
                <p className="font-medium text-emerald-600 dark:text-emerald-400">{t('cost.noExpired')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 4: Team Activity Analytics */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">{t('team.title')}</CardTitle>
            <CardDescription>{t('team.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {teamData && teamData.totalActions > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Actions by User - Bar Chart */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">{t('team.actionsByUser')}</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={teamData.actionsByUser.slice(0, 8)} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          tickLine={false}
                          axisLine={false}
                          interval={0}
                          angle={-30}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--popover-foreground))',
                          }}
                        />
                        <Bar dataKey="count" name={t('team.actions')} fill={CHART_COLORS.teal} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Action Types - Pie Chart */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">{t('team.actionTypes')}</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={teamData.actionTypes.slice(0, 6)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="action"
                        >
                          {teamData.actionTypes.slice(0, 6).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--popover-foreground))',
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          iconSize={8}
                          formatter={(value: string) => (
                            <span className="text-xs text-muted-foreground">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Most Active Users */}
                <div className="lg:col-span-2">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">{t('team.mostActive')}</h4>
                  <div className="flex flex-wrap gap-3">
                    {teamData.mostActiveUsers.map((user, idx) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <Avatar className="size-8 ring-1 ring-emerald-500/20">
                          <AvatarFallback className="text-xs bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-400 font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.count} {t('team.actions').toLowerCase()}</p>
                        </div>
                        {idx === 0 && (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px]">
                            #1
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="size-8 mx-auto mb-2" />
                <p>{t('team.noActivity')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 5: Portfolio Optimization */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">{t('portfolio.title')}</CardTitle>
            <CardDescription>{t('portfolio.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {portfolioData && portfolioData.recommendations.length > 0 ? (
              <>
                {/* Recommendations */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">{t('portfolio.recommendations')}</h4>
                  <div className="space-y-3">
                    {portfolioData.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg border',
                          rec.severity === 'high' && 'bg-red-50/50 border-red-200/50 dark:bg-red-950/10 dark:border-red-800/30',
                          rec.severity === 'medium' && 'bg-amber-50/50 border-amber-200/50 dark:bg-amber-950/10 dark:border-amber-800/30',
                          rec.severity === 'low' && 'bg-emerald-50/50 border-emerald-200/50 dark:bg-emerald-950/10 dark:border-emerald-800/30',
                        )}
                      >
                        {getRecommendationIcon(rec.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{t(`portfolio.${rec.title}` as any)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                        </div>
                        {getSeverityBadge(rec.severity)}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* State Coverage Grid */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">{t('portfolio.stateCoverage')}</h4>
                  <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="size-3 rounded-sm bg-emerald-500" />
                      <span>{t('portfolio.coveredStates')} ({portfolioData.coverage.coveredStates.length})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="size-3 rounded-sm bg-amber-500" />
                      <span>{t('portfolio.uncoveredStates')} ({portfolioData.coverage.uncoveredStates.length})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="size-3 rounded-sm bg-muted" />
                      <span>{t('portfolio.noOperations')}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-17 gap-1">
                    {US_STATES.map((state) => {
                      const isCovered = portfolioData.coverage.coveredStates.includes(state);
                      const isUncovered = portfolioData.coverage.uncoveredStates.includes(state);
                      return (
                        <div
                          key={state}
                          className={cn(
                            'flex items-center justify-center p-1.5 rounded text-[10px] font-medium transition-colors',
                            isCovered && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
                            isUncovered && 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
                            !isCovered && !isUncovered && 'bg-muted/30 text-muted-foreground'
                          )}
                          title={isCovered ? `${state}: Covered` : isUncovered ? `${state}: Coverage Gap` : `${state}: No operations`}
                        >
                          {state}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${portfolioData.coverage.coveragePercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium tabular-nums">
                      {portfolioData.coverage.coveragePercent}%
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShieldCheck className="size-8 mx-auto mb-2 text-emerald-500" />
                <p className="font-medium text-emerald-600 dark:text-emerald-400">{t('portfolio.noRecommendations')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 6: Custom Report Builder */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">{t('reports.title')}</CardTitle>
            <CardDescription>{t('reports.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('reports.reportType')}</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="complianceSummary">{t('reports.complianceSummary')}</SelectItem>
                    <SelectItem value="licenseStatus">{t('reports.licenseStatus')}</SelectItem>
                    <SelectItem value="insuranceStatus">{t('reports.insuranceStatus')}</SelectItem>
                    <SelectItem value="ceTracking">{t('reports.ceTracking')}</SelectItem>
                    <SelectItem value="fullAudit">{t('reports.fullAudit')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('reports.dateRange')}</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last7">{t('reports.last7days')}</SelectItem>
                    <SelectItem value="last30">{t('reports.last30days')}</SelectItem>
                    <SelectItem value="last90">{t('reports.last90days')}</SelectItem>
                    <SelectItem value="lastYear">{t('reports.lastYear')}</SelectItem>
                    <SelectItem value="all">{t('reports.allTime')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('reports.stateFilter')}</label>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('reports.allStates')}</SelectItem>
                    {US_STATES.slice(0, 20).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('reports.licenseTypeFilter')}</label>
                <Select value={licenseTypeFilter} onValueChange={setLicenseTypeFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('reports.allTypes')}</SelectItem>
                    <SelectItem value="state">{t('reports.typeStateLicense')}</SelectItem>
                    <SelectItem value="city">{t('reports.typeCityPermit')}</SelectItem>
                    <SelectItem value="certification">{t('reports.typeCertification')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('reports.format')}</label>
                <Select value={reportFormat} onValueChange={setReportFormat}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">{t('reports.pdf')}</SelectItem>
                    <SelectItem value="csv">{t('reports.csv')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm"
                  onClick={handleGenerateReport}
                  disabled={generating}
                >
                  <FileBarChart className="size-4" />
                  {generating ? t('reports.generating') : t('reports.generate')}
                </Button>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Schedule Reports */}
            <div>
              <h4 className="text-sm font-semibold mb-4 text-muted-foreground flex items-center gap-2">
                <Clock className="size-4" />
                Schedule Reports
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Frequency</label>
                  <Select value={scheduleConfig.frequency} onValueChange={(v) => setScheduleConfig((p) => ({ ...p, frequency: v }))}>
                    <SelectTrigger className="w-full h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">Report Type</label>
                  <Select value={scheduleConfig.reportType} onValueChange={(v) => setScheduleConfig((p) => ({ ...p, reportType: v }))}>
                    <SelectTrigger className="w-full h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compliance">Compliance Summary</SelectItem>
                      <SelectItem value="full">Full Audit</SelectItem>
                      <SelectItem value="licenses">License Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">Format</label>
                  <Select value={scheduleConfig.format} onValueChange={(v) => setScheduleConfig((p) => ({ ...p, format: v }))}>
                    <SelectTrigger className="w-full h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Recipients */}
              <div className="space-y-2 mb-4">
                <label className="text-xs font-medium">Recipients</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="email@example.com"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRecipient(); } }}
                    className="h-9 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addRecipient}
                    className="gap-1 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300"
                  >
                    <Plus className="size-3.5" />
                    Add
                  </Button>
                </div>
                {scheduleConfig.recipients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {scheduleConfig.recipients.map((email, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border/50 text-xs">
                        <Mail className="size-3 text-muted-foreground" />
                        <span>{email}</span>
                        <button onClick={() => removeRecipient(idx)} className="text-muted-foreground hover:text-red-500 transition-colors">
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enable toggle + Save */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="schedule-enabled"
                    checked={scheduleConfig.enabled}
                    onCheckedChange={(checked) => setScheduleConfig((p) => ({ ...p, enabled: checked }))}
                  />
                  <Label htmlFor="schedule-enabled" className="text-xs">Enable scheduled reports</Label>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveSchedule}
                  disabled={savingSchedule}
                  className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                >
                  {savingSchedule ? 'Saving...' : 'Save Schedule'}
                </Button>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Previous Reports */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">{t('reports.previousReports')}</h4>
              <div className="text-center py-6 text-muted-foreground">
                <Download className="size-6 mx-auto mb-2" />
                <p className="text-sm">{t('reports.noReports')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Sub-components

function OverviewCard({
  icon,
  label,
  value,
  trend,
  iconBg,
  iconColor,
  borderColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: React.ReactNode;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}) {
  return (
    <Card className={cn('shadow-sm hover:shadow-md transition-all duration-300 border-s-4', borderColor)}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className={cn('flex items-center justify-center size-10 rounded-xl bg-gradient-to-br', iconBg, iconColor)}>
            {icon}
          </div>
          {trend}
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        <p className="text-2xl md:text-3xl font-extrabold tabular-nums mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function CostCard({
  label,
  value,
  valueColor,
  bgGradient,
}: {
  label: string;
  value: string;
  valueColor: string;
  bgGradient: string;
}) {
  return (
    <div className={cn('p-4 rounded-xl bg-gradient-to-br border border-border/30', bgGradient)}>
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
      <p className={cn('text-xl md:text-2xl font-extrabold tabular-nums mt-1', valueColor)}>{value}</p>
    </div>
  );
}
