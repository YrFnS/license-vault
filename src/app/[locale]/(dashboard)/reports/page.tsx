'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import {
  Download,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  FileText,
  BarChart3,
  Users,
  GraduationCap,
  Building2,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FileBarChart,
} from 'lucide-react';

interface DashboardData {
  complianceScore: number;
  totalLicenses: number;
  activeLicenses: number;
  expiringLicenses: number;
  expiredLicenses: number;
  compliantPercent: number;
  totalInsurance: number;
  activeInsurance: number;
  insuranceCompliant: number;
  insuranceDeficient: number;
  totalCoverage: number;
  totalCeHours: number;
  requiredCeHours: number;
  ceProgress: number;
  teamMembers: number;
  orgName: string;
}

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function ReportsPage() {
  const t = useTranslations('reports');
  const tD = useTranslations('dashboard');
  const tC = useTranslations('common');

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const dashboardData = await res.json();

      // Also fetch insurance data
      let insuranceSummary = { total: 0, active: 0, expiring: 0, expired: 0, compliant: 0, deficient: 0, totalCoverage: 0 };
      try {
        const insRes = await fetch('/api/insurance');
        if (insRes.ok) {
          const insJson = await insRes.json();
          // Insurance API returns { records: [...], summary: {...} }
          const summary = insJson.summary || {};
          insuranceSummary = {
            total: summary.total || 0,
            active: summary.active || 0,
            expiring: summary.expiring || 0,
            expired: summary.expiredCompliance || 0,
            compliant: summary.compliant || 0,
            deficient: summary.deficient || 0,
            totalCoverage: summary.totalCoverage || 0,
          };
        }
      } catch {
        // ignore
      }

      // Fetch CE tracking data
      let ceData = { totalEarned: 0, totalRequired: 0 };
      try {
        const ceRes = await fetch('/api/ce-tracking');
        if (ceRes.ok) {
          const ceJson = await ceRes.json();
          // CE API returns { records: [...] }
          const records = ceJson.records || [];
          ceData = {
            totalEarned: records.reduce((sum: number, r: { hoursEarned: number }) => sum + (r.hoursEarned || 0), 0),
            totalRequired: records.reduce((sum: number, r: { hoursRequired: number }) => sum + (r.hoursRequired || 0), 0),
          };
        }
      } catch {
        // ignore
      }

      // Fetch team data
      let teamCount = 0;
      try {
        const teamRes = await fetch('/api/team');
        if (teamRes.ok) {
          const teamJson = await teamRes.json();
          // Team API returns { members: [...] }
          teamCount = (teamJson.members || []).length;
        }
      } catch {
        // ignore
      }

      // Fetch settings for org name
      let orgName = '';
      try {
        const settingsRes = await fetch('/api/settings');
        if (settingsRes.ok) {
          const settingsJson = await settingsRes.json();
          orgName = settingsJson.organization?.name || '';
        }
      } catch {
        // ignore
      }

      // Dashboard API returns summary with expiringSoon (not expiring)
      const summary = dashboardData.summary || {};
      const totalLicenses = summary.total || 0;
      const activeLicenses = summary.active || 0;
      const expiringLicenses = summary.expiringSoon || 0;
      const expiredLicenses = summary.expired || 0;
      const compliantPercent = totalLicenses > 0 ? Math.round((activeLicenses / totalLicenses) * 100) : 100;
      const score = dashboardData.complianceScore ?? compliantPercent;

      const ceProgress = ceData.totalRequired > 0
        ? Math.min(Math.round((ceData.totalEarned / ceData.totalRequired) * 100), 100)
        : ceData.totalEarned > 0 ? 100 : 0;

      setData({
        complianceScore: score,
        totalLicenses,
        activeLicenses,
        expiringLicenses,
        expiredLicenses,
        compliantPercent,
        totalInsurance: insuranceSummary.total,
        activeInsurance: insuranceSummary.active,
        insuranceCompliant: insuranceSummary.compliant,
        insuranceDeficient: insuranceSummary.deficient,
        totalCoverage: insuranceSummary.totalCoverage,
        totalCeHours: ceData.totalEarned,
        requiredCeHours: ceData.totalRequired,
        ceProgress,
        teamMembers: teamCount,
        orgName,
      });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/reports/org-compliance');
      if (!res.ok) throw new Error('Failed to generate report');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `org-compliance-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // Could add toast here
    } finally {
      setGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreStroke = (score: number) => {
    if (score >= 80) return 'stroke-emerald-500';
    if (score >= 60) return 'stroke-amber-500';
    return 'stroke-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 dark:bg-emerald-950/30';
    if (score >= 60) return 'bg-amber-50 dark:bg-amber-950/30';
    return 'bg-red-50 dark:bg-red-950/30';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <ShieldCheck className="size-8 text-emerald-500" />;
    if (score >= 60) return <ShieldAlert className="size-8 text-amber-500" />;
    return <ShieldX className="size-8 text-red-500" />;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return t('complianceGood') || 'Good Standing';
    if (score >= 60) return t('complianceNeedsAttention') || 'Needs Attention';
    return t('complianceCritical') || 'Critical';
  };

  const atRiskCount = (data?.expiringLicenses || 0) + (data?.expiredLicenses || 0);

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div {...fadeIn} transition={{ duration: 0.3 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
            <FileText className="size-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{t('title')}</h1>
            {data?.orgName && (
              <p className="text-sm text-muted-foreground">{data.orgName}</p>
            )}
          </div>
        </div>
        <Button
          onClick={handleGenerateReport}
          disabled={generating}
          className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
        >
          {generating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {generating ? t('generating') : t('generateReport')}
        </Button>
      </motion.div>

      {/* Compliance Score + Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Compliance Score Card */}
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.05 }}>
          <Card className="md:col-span-1 border-0 shadow-lg h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('complianceOverview')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-2">
              <div className={`relative size-44 ${getScoreBg(data?.complianceScore ?? 0)} rounded-full flex items-center justify-center`}>
                {/* SVG circular progress ring */}
                <svg className="absolute inset-0 size-44 -rotate-90" viewBox="0 0 176 176">
                  <circle
                    cx="88"
                    cy="88"
                    r="76"
                    fill="none"
                    strokeWidth="10"
                    className="stroke-muted/30"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="76"
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    className={getScoreStroke(data?.complianceScore ?? 0)}
                    strokeDasharray={`${(data?.complianceScore ?? 0) * 4.776} ${477.6 - (data?.complianceScore ?? 0) * 4.776}`}
                  />
                </svg>
                <div className="relative flex flex-col items-center">
                  {getScoreIcon(data?.complianceScore ?? 0)}
                  <span className={`text-4xl font-bold mt-1 ${getScoreColor(data?.complianceScore ?? 0)}`}>
                    {data?.complianceScore ?? 0}%
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {getScoreLabel(data?.complianceScore ?? 0)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                {t('generatedOn', { date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) })}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats Card */}
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="md:col-span-2 border-0 shadow-lg h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('executiveSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Total Licenses */}
                <div className="flex flex-col items-center p-4 rounded-xl bg-muted/50">
                  <div className="size-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-2">
                    <ShieldCheck className="size-5 text-emerald-600" />
                  </div>
                  <span className="text-2xl font-bold">{data?.totalLicenses ?? 0}</span>
                  <span className="text-xs text-muted-foreground">{tD('summary.total')}</span>
                </div>

                {/* Compliant % */}
                <div className="flex flex-col items-center p-4 rounded-xl bg-muted/50">
                  <div className="size-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-2">
                    <TrendingUp className="size-5 text-emerald-600" />
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">{data?.compliantPercent ?? 0}%</span>
                  <span className="text-xs text-muted-foreground">{t('compliantPercent') || 'Compliant'}</span>
                </div>

                {/* Expiring Soon */}
                <div className="flex flex-col items-center p-4 rounded-xl bg-muted/50">
                  <div className="size-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-2">
                    <AlertTriangle className="size-5 text-amber-600" />
                  </div>
                  <span className="text-2xl font-bold text-amber-600">{data?.expiringLicenses ?? 0}</span>
                  <span className="text-xs text-muted-foreground">{tD('summary.expiring')}</span>
                </div>

                {/* Expired */}
                <div className="flex flex-col items-center p-4 rounded-xl bg-muted/50">
                  <div className="size-10 rounded-lg bg-gradient-to-br from-red-500/20 to-rose-500/20 flex items-center justify-center mb-2">
                    <ShieldX className="size-5 text-red-600" />
                  </div>
                  <span className="text-2xl font-bold text-red-600">{data?.expiredLicenses ?? 0}</span>
                  <span className="text-xs text-muted-foreground">{tD('summary.expired')}</span>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Additional Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Insurance Compliance */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="size-9 rounded-md bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center shrink-0">
                    <Building2 className="size-4 text-teal-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold">{data?.totalInsurance ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{t('insurancePolicies') || 'Insurance Policies'}</p>
                    {data && data.totalInsurance > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="size-3 text-emerald-500" />
                        <span className="text-[10px] text-emerald-600 font-medium">{data.insuranceCompliant} compliant</span>
                        {data.insuranceDeficient > 0 && (
                          <>
                            <XCircle className="size-3 text-red-500 ms-1" />
                            <span className="text-[10px] text-red-600 font-medium">{data.insuranceDeficient}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* CE Hours */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="size-9 rounded-md bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                    <GraduationCap className="size-4 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold">
                      {data?.totalCeHours ?? 0}
                      <span className="text-xs text-muted-foreground">/{data?.requiredCeHours || 0}h</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{t('ceHours') || 'CE Hours'}</p>
                    {data && data.requiredCeHours > 0 && (
                      <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            (data.ceProgress ?? 0) >= 100 ? 'bg-emerald-500' : (data.ceProgress ?? 0) >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(data.ceProgress ?? 0, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Team */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="size-9 rounded-md bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center shrink-0">
                    <Users className="size-4 text-rose-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold">{data?.teamMembers ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{t('teamMembers') || 'Team Members'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Insurance Compliance Summary */}
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.15 }}>
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="size-4 text-teal-600" />
                {t('insuranceCompliance') || 'Insurance Compliance'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('totalPolicies') || 'Total Policies'}</span>
                <span className="font-semibold">{data?.totalInsurance ?? 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  {t('compliant') || 'Compliant'}
                </span>
                <span className="font-semibold text-emerald-600">{data?.insuranceCompliant ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5 text-amber-500" />
                  {t('deficient') || 'Deficient'}
                </span>
                <span className="font-semibold text-amber-600">{data?.insuranceDeficient ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <XCircle className="size-3.5 text-red-500" />
                  {t('expired') || 'Expired'}
                </span>
                <span className="font-semibold text-red-600">{data?.totalInsurance ? (data.totalInsurance - data.insuranceCompliant - data.insuranceDeficient) : 0}</span>
              </div>
              {data && data.totalCoverage > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('totalCoverage') || 'Total Coverage'}</span>
                    <span className="font-semibold">${(data.totalCoverage / 1000).toFixed(0)}k</span>
                  </div>
                </>
              )}
              {data && data.totalInsurance > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{t('complianceRate') || 'Compliance Rate'}</span>
                    <span className="font-medium">{Math.round((data.insuranceCompliant / data.totalInsurance) * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                      style={{ width: `${Math.round((data.insuranceCompliant / data.totalInsurance) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* CE Hours Summary */}
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <GraduationCap className="size-4 text-violet-600" />
                {t('ceHoursSummary') || 'CE Hours Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('hoursEarned') || 'Hours Earned'}</span>
                <span className="font-semibold">{data?.totalCeHours ?? 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('hoursRequired') || 'Hours Required'}</span>
                <span className="font-semibold">{data?.requiredCeHours || 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('remaining') || 'Remaining'}</span>
                <span className={`font-semibold ${
                  (data?.requiredCeHours || 0) - (data?.totalCeHours || 0) <= 0
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}>
                  {Math.max((data?.requiredCeHours || 0) - (data?.totalCeHours || 0), 0)}
                </span>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{t('progress') || 'Progress'}</span>
                  <span className="font-medium">{data?.ceProgress ?? 0}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      (data?.ceProgress ?? 0) >= 100
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : (data?.ceProgress ?? 0) >= 50
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                          : 'bg-gradient-to-r from-red-500 to-rose-500'
                    }`}
                    style={{ width: `${Math.min(data?.ceProgress ?? 0, 100)}%` }}
                  />
                </div>
              </div>
              {data && data.totalCeHours >= (data.requiredCeHours || 0) && data.requiredCeHours > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 mt-1">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{t('ceComplete') || 'CE requirements met'}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Team & At-Risk Overview */}
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.25 }}>
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="size-4 text-rose-600" />
                {t('teamAndRisk') || 'Team & Risk Overview'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('teamMembers') || 'Team Members'}</span>
                <span className="font-semibold">{data?.teamMembers ?? 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                  {t('activeLicenses') || 'Active Licenses'}
                </span>
                <span className="font-semibold text-emerald-600">{data?.activeLicenses ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5 text-amber-500" />
                  {t('expiringSoon') || 'Expiring Soon'}
                </span>
                <span className="font-semibold text-amber-600">{data?.expiringLicenses ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <ShieldX className="size-3.5 text-red-500" />
                  {t('expiredLicenses') || 'Expired Licenses'}
                </span>
                <span className="font-semibold text-red-600">{data?.expiredLicenses ?? 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-orange-500" />
                  {t('atRiskItems')}
                </span>
                <span className={`font-bold text-lg ${atRiskCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {atRiskCount}
                </span>
              </div>
              {atRiskCount > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 mt-1">
                  <AlertTriangle className="size-4 text-red-600 shrink-0" />
                  <span className="text-xs text-red-700 dark:text-red-400 font-medium">
                    {t('atRiskWarning') || 'Immediate attention required'}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.3 }}>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/25">
                  <FileBarChart className="size-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg">{t('orgReport')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete organization-wide compliance overview including licenses, insurance, CE tracking, and team status.
                  </p>
                  <Button
                    onClick={handleGenerateReport}
                    disabled={generating}
                    className="mt-4 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                    size="sm"
                  >
                    {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                    {generating ? t('generating') : t('downloadPdf')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.35 }}>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shrink-0 shadow-md shadow-teal-500/25">
                  <BarChart3 className="size-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg">{t('licenseReport')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Individual license compliance reports are available from each license detail page. Navigate to a license and click &ldquo;Report&rdquo; to generate.
                  </p>
                  <Badge variant="outline" className="mt-4 text-muted-foreground">
                    Available per license
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
