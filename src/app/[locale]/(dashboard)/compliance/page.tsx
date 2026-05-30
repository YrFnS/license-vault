'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useRouter } from '@/i18n/navigation';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Upload,
  GraduationCap,
  Send,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  Lightbulb,
  Globe2,
  Zap,
  BarChart3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { usePageTitle } from '@/hooks/use-page-title';
import MultiStateSection from '@/components/compliance/MultiStateSection';
import ForecastSection from '@/components/compliance/ForecastSection';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

// --- Types ---
interface BreakdownCategory {
  score: number;
  total: number;
  active: number;
  completed?: number;
  uploaded?: number;
}

interface AtRiskItem {
  id: string;
  name: string;
  type: string;
  expirationDate: string;
  status: string;
  daysUntil: number;
}

interface Recommendation {
  id: string;
  titleKey: string;
  descKey: string;
  priority: 'high' | 'medium' | 'low';
  actionType: string;
  active: boolean;
}

interface ComplianceData {
  overallScore: number;
  trend: 'up' | 'down' | 'same';
  trendDelta: number;
  breakdown: {
    license: BreakdownCategory;
    insurance: BreakdownCategory;
    ce: BreakdownCategory;
    documents: BreakdownCategory;
  };
  atRiskItems: AtRiskItem[];
  recommendations: Recommendation[];
  history: Array<{ month: string; score: number }>;
}

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
} as const;

const cardHover = {
  scale: 1.02,
  y: -2,
  transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
} as const;

// --- Helper Functions ---
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
}

function getScoreLabel(score: number, t: (key: string) => string): string {
  if (score >= 90) return t('scoreExcellent');
  if (score >= 80) return t('scoreGood');
  if (score >= 60) return t('scoreFair');
  if (score > 0) return t('scorePoor');
  return t('scoreNoData');
}

function getScoreGradient(score: number): string {
  if (score >= 80) return 'from-emerald-500 to-teal-500';
  if (score >= 60) return 'from-amber-500 to-orange-500';
  return 'from-red-500 to-rose-500';
}

function getScoreStrokeGradient(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function getScoreTrackColor(score: number): string {
  if (score >= 80) return 'stroke-emerald-200 dark:stroke-emerald-900/50';
  if (score >= 60) return 'stroke-amber-200 dark:stroke-amber-900/50';
  return 'stroke-red-200 dark:stroke-red-900/50';
}

function getScoreBgGradient(score: number): string {
  if (score >= 80) return 'from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-900/20';
  if (score >= 60) return 'from-amber-50/80 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-900/20';
  return 'from-red-50/80 to-rose-50/50 dark:from-red-950/30 dark:to-rose-900/20';
}

function getScoreBorderColor(score: number): string {
  if (score >= 80) return 'border-emerald-200 dark:border-emerald-800';
  if (score >= 60) return 'border-amber-200 dark:border-amber-800';
  return 'border-red-200 dark:border-red-800';
}

function getPriorityColor(priority: string): string {
  if (priority === 'high') return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400';
  if (priority === 'medium') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
}

function getPriorityLabel(priority: string): string {
  if (priority === 'high') return 'High';
  if (priority === 'medium') return 'Medium';
  return 'Low';
}

function getItemTypeIcon(type: string) {
  if (type === 'insurance') return ShieldAlert;
  if (type === 'qualifier') return CheckCircle2;
  return Shield;
}

function getItemTypeColor(type: string): string {
  if (type === 'insurance') return 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400';
  if (type === 'qualifier') return 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400';
  return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400';
}

// --- Hero Section: Large Compliance Score Circle ---
function ComplianceHero({ score, trend, trendDelta }: { score: number; trend: string; trendDelta: number }) {
  const t = useTranslations('compliance');
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <motion.div variants={itemVariants}>
      <Card className={`relative overflow-hidden border-2 ${getScoreBorderColor(score)} bg-gradient-to-br ${getScoreBgGradient(score)} shadow-lg`}>
        {/* Decorative blurs */}
        <div className="absolute -top-20 -end-20 size-56 rounded-full bg-gradient-to-br from-emerald-200/30 to-teal-200/20 dark:from-emerald-800/20 dark:to-teal-800/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -start-16 size-44 rounded-full bg-gradient-to-br from-teal-200/30 to-emerald-200/20 dark:from-teal-800/10 dark:to-emerald-800/20 blur-3xl pointer-events-none" />

        <CardContent className="relative p-6 md:p-10 flex flex-col md:flex-row items-center gap-8">
          {/* Large SVG Circle */}
          <div className="relative shrink-0">
            <svg width="180" height="180" className="transform -rotate-90">
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={getScoreStrokeGradient(score)} />
                  <stop offset="100%" stopColor={score >= 80 ? '#14b8a6' : score >= 60 ? '#f97316' : '#f43f5e'} />
                </linearGradient>
              </defs>
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                strokeWidth="10"
                className={getScoreTrackColor(score)}
              />
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                stroke="url(#scoreGradient)"
                className="transition-all duration-1000 ease-out"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5, type: 'spring' as const }}
                className={`text-5xl font-extrabold ${getScoreColor(score)}`}
              >
                {score}%
              </motion.span>
              <span className="text-xs font-medium text-muted-foreground mt-1">{t('overallScore')}</span>
            </div>
          </div>

          {/* Score info */}
          <div className="flex-1 min-w-0 text-center md:text-start">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-emerald-600 dark:to-emerald-400 bg-clip-text text-transparent">
              {t('scoreTitle')}
            </h1>
            <p className="text-muted-foreground/80 mt-1.5 text-sm md:text-base">{t('scoreSubtitle')}</p>

            {/* Status badge + trend */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
              <Badge className={`px-3 py-1 text-sm font-semibold ${getScoreColor(score)} bg-opacity-10 border-0`}
                style={{
                  backgroundColor: score >= 80 ? 'rgba(16,185,129,0.1)' : score >= 60 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                }}>
                {score >= 80 ? <ShieldCheck className="size-4 me-1" /> : <ShieldAlert className="size-4 me-1" />}
                {getScoreLabel(score, t)}
              </Badge>
              {trendDelta > 0 && (
                <Badge variant="outline" className="gap-1 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
                  {trend === 'up' ? <TrendingUp className="size-3" /> : trend === 'down' ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
                  {trend === 'up' ? t('trendUp') : trend === 'down' ? t('trendDown') : t('trendSame')} ({trendDelta > 0 ? '+' : ''}{trendDelta}%)
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- Score Breakdown Cards ---
function ScoreBreakdown({ breakdown }: { breakdown: ComplianceData['breakdown'] }) {
  const t = useTranslations('compliance');

  const cards = [
    {
      key: 'license',
      label: t('licenseCompliance'),
      desc: t('licenseComplianceDesc'),
      score: breakdown.license.score,
      icon: Shield,
      detail: `${breakdown.license.active}/${breakdown.license.total}`,
      color: 'emerald',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      progressColor: '[&>div]:bg-emerald-500',
      borderAccent: 'border-s-emerald-400 dark:border-s-emerald-600',
    },
    {
      key: 'insurance',
      label: t('insuranceCoverage'),
      desc: t('insuranceCoverageDesc'),
      score: breakdown.insurance.score,
      icon: ShieldAlert,
      detail: `${breakdown.insurance.active}/${breakdown.insurance.total}`,
      color: 'teal',
      bgColor: 'bg-teal-50 dark:bg-teal-950/30',
      iconColor: 'text-teal-600 dark:text-teal-400',
      progressColor: '[&>div]:bg-teal-500',
      borderAccent: 'border-s-teal-400 dark:border-s-teal-600',
    },
    {
      key: 'ce',
      label: t('ceRequirements'),
      desc: t('ceRequirementsDesc'),
      score: breakdown.ce.score,
      icon: GraduationCap,
      detail: `${breakdown.ce.completed || 0}/${breakdown.ce.total}h`,
      color: 'amber',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      progressColor: '[&>div]:bg-amber-500',
      borderAccent: 'border-s-amber-400 dark:border-s-amber-600',
    },
    {
      key: 'documents',
      label: t('documentCompleteness'),
      desc: t('documentCompletenessDesc'),
      score: breakdown.documents.score,
      icon: FileText,
      detail: `${breakdown.documents.uploaded || 0}/${breakdown.documents.total}`,
      color: 'emerald',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      progressColor: '[&>div]:bg-emerald-500',
      borderAccent: 'border-s-emerald-400 dark:border-s-emerald-600',
    },
  ];

  return (
    <motion.div variants={itemVariants}>
      <h2 className="text-lg font-bold text-foreground mb-4">{t('breakdownTitle')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.key} whileHover={cardHover}>
              <Card className={`relative overflow-hidden border-s-4 ${card.borderAccent} shadow-sm hover:shadow-md transition-all duration-300`}>
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 rounded-xl p-2.5 ${card.bgColor}`}>
                      <Icon className={`size-5 ${card.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{card.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
                      <div className="flex items-end justify-between mt-3">
                        <div>
                          <span className={`text-2xl font-extrabold ${getScoreColor(card.score)}`}>{card.score}%</span>
                          <span className="text-xs text-muted-foreground ms-2">{card.detail}</span>
                        </div>
                      </div>
                      <Progress value={card.score} className={`mt-2 h-2 ${card.progressColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// --- At-Risk Items ---
function AtRiskItems({ items }: { items: AtRiskItem[] }) {
  const t = useTranslations('compliance');

  return (
    <motion.div variants={itemVariants}>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold text-foreground">{t('atRiskTitle')}</h2>
        {items.length > 0 && (
          <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
            {items.length}
          </Badge>
        )}
      </div>
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/20 p-5 mb-4">
                <CheckCircle2 className="size-10 text-emerald-500" />
              </div>
              <p className="font-medium text-foreground">{t('atRiskEmpty')}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">{t('atRiskEmptyDesc')}</p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="divide-y divide-border/50">
                {items.map((item, idx) => {
                  const Icon = getItemTypeIcon(item.type);
                  const isExpired = item.daysUntil < 0;
                  return (
                    <motion.div
                      key={`${item.id}-${idx}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-3 p-3 md:p-4 hover:bg-muted/30 transition-colors duration-150"
                    >
                      <div className={`shrink-0 rounded-lg p-2 ${getItemTypeColor(item.type)}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.type === 'license' ? t('licenseName') : item.type === 'insurance' ? t('insurance') : t('qualifier')}
                        </p>
                      </div>
                      <div className="shrink-0 text-end">
                        <Badge
                          className={`text-xs ${
                            isExpired
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                              : item.daysUntil <= 30
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          } border-0`}
                        >
                          {isExpired ? t('expiredDaysAgo', { days: Math.abs(item.daysUntil) }) : t('daysLeft', { days: item.daysUntil })}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- Recommendations ---
function Recommendations({ recommendations }: { recommendations: Recommendation[] }) {
  const t = useTranslations('compliance');
  const router = useRouter();

  const getActionHref = (actionType: string) => {
    switch (actionType) {
      case 'renew': return '/licenses';
      case 'insurance': return '/insurance';
      case 'ce': return '/ce-tracking';
      case 'documents': return '/licenses';
      case 'auto-renew': return '/licenses';
      default: return '/licenses';
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'renew': return RefreshCw;
      case 'insurance': return ShieldAlert;
      case 'ce': return GraduationCap;
      case 'documents': return Upload;
      case 'auto-renew': return CheckCircle2;
      default: return Lightbulb;
    }
  };

  return (
    <motion.div variants={itemVariants}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="size-5 text-emerald-500" />
        <h2 className="text-lg font-bold text-foreground">{t('recommendationsTitle')}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{t('recommendationsSubtitle')}</p>
      <div className="space-y-3">
        {recommendations.map((rec, idx) => {
          const ActionIcon = getActionIcon(rec.actionType);
          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              whileHover={{ scale: 1.01, y: -1 }}
            >
              <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 rounded-xl p-2.5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/20">
                      <ActionIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{t(rec.titleKey)}</p>
                        <Badge className={`text-[10px] px-1.5 py-0 ${getPriorityColor(rec.priority)} border-0`}>
                          {getPriorityLabel(rec.priority)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t(rec.descKey)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs gap-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        asChild
                      >
                        <Link href={getActionHref(rec.actionType)}>
                          {t('viewAll')}
                          <ChevronRight className="size-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {recommendations.length === 0 && (
          <Card className="shadow-sm">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="size-10 text-emerald-500 mx-auto mb-3" />
              <p className="font-medium text-foreground">All clear!</p>
              <p className="text-sm text-muted-foreground mt-1">No recommendations at this time. Your compliance is in great shape.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}

// --- Compliance History Chart ---
function ComplianceHistory({ history }: { history: Array<{ month: string; score: number }> }) {
  const t = useTranslations('compliance');

  return (
    <motion.div variants={itemVariants}>
      <h2 className="text-lg font-bold text-foreground mb-4">{t('historyTitle')}</h2>
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="pb-2">
          <p className="text-sm text-muted-foreground">{t('historySubtitle')}</p>
        </CardHeader>
        <CardContent className="pt-0">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="size-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">{t('scoreNoData')}</p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      color: 'hsl(var(--popover-foreground))',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${value}%`, t('historyScore')]}
                    labelFormatter={(label: string) => label}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#scoreAreaGradient)"
                    dot={{ fill: '#10b981', r: 3, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- Quick Actions ---
function QuickActions() {
  const t = useTranslations('compliance');
  const router = useRouter();

  const actions = [
    {
      key: 'renew',
      label: t('renewLicenses'),
      icon: RefreshCw,
      href: '/licenses',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      key: 'upload',
      label: t('uploadDocuments'),
      icon: Upload,
      href: '/licenses',
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-950/30',
      borderColor: 'border-teal-200 dark:border-teal-800',
    },
    {
      key: 'ce',
      label: t('updateCeHours'),
      icon: GraduationCap,
      href: '/ce-tracking',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
    {
      key: 'report',
      label: t('sendReport'),
      icon: Send,
      href: '#',
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/30',
      borderColor: 'border-rose-200 dark:border-rose-800',
    },
  ];

  const handleSendReport = () => {
    toast.success(t('reportSent'));
  };

  return (
    <motion.div variants={itemVariants}>
      <h2 className="text-lg font-bold text-foreground mb-4">{t('quickActionsTitle')}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const isReport = action.key === 'report';
          return (
            <motion.div key={action.key} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}>
              {isReport ? (
                <button
                  onClick={handleSendReport}
                  className="group flex flex-col items-center gap-2 rounded-xl border py-5 px-4 transition-all duration-200 hover:shadow-lg bg-card shadow-sm w-full"
                >
                  <div className={`rounded-full p-2.5 ${action.bgColor} ${action.borderColor} border transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className={`size-5 ${action.color} transition-transform duration-200 group-hover:-rotate-3`} />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                    {action.label}
                  </span>
                </button>
              ) : (
                <Link
                  href={action.href}
                  className="group flex flex-col items-center gap-2 rounded-xl border py-5 px-4 transition-all duration-200 hover:shadow-lg bg-card shadow-sm"
                >
                  <div className={`rounded-full p-2.5 ${action.bgColor} ${action.borderColor} border transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className={`size-5 ${action.color} transition-transform duration-200 group-hover:-rotate-3`} />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                    {action.label}
                  </span>
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// --- Loading Skeleton ---
function CompliancePageSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-64" />
      <Card>
        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
          <Skeleton className="size-44 rounded-full" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-6 w-32" />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main Page ---
export default function CompliancePage() {
  const t = useTranslations('compliance');
  const tc = useTranslations('common');
  const tPt = useTranslations('pageTitles');
  usePageTitle(tPt('compliance'));

  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchCompliance = useCallback(async () => {
    try {
      const res = await fetch('/api/compliance?type=score');
      if (!res.ok) throw new Error('Failed to fetch compliance data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCompliance();
  }, [fetchCompliance]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCompliance();
  };

  if (loading) {
    return <CompliancePageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full border-destructive/20 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex items-center justify-center size-16 rounded-full bg-destructive/10">
              <ShieldAlert className="size-8 text-destructive" />
            </div>
            <p className="text-lg font-semibold text-foreground">{t('loadError')}</p>
            <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">{error}</p>
            <p className="text-xs text-muted-foreground/70 mt-2">{t('loadErrorHint')}</p>
            <Button onClick={handleRefresh} variant="outline" className="mt-6 gap-2 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-colors duration-200">
              <RefreshCw className="size-4" />
              {tc('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        {/* Decorative gradient */}
        <div className="absolute -top-8 -start-8 size-52 rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/30 dark:from-emerald-900/30 dark:to-teal-900/20 blur-3xl pointer-events-none" />
        <div className="absolute -top-4 start-12 size-20 rounded-full bg-emerald-300/20 dark:bg-emerald-700/10 blur-2xl pointer-events-none" />
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-emerald-600 dark:to-emerald-400 bg-clip-text text-transparent">
            {t('scoreTitle')}
          </h1>
          <p className="text-muted-foreground/80 mt-1.5 text-sm md:text-base">{t('scoreSubtitle')}</p>
        </div>
        <div className="relative flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <Shield className="size-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="multi-state" className="gap-1.5 text-xs sm:text-sm">
            <Globe2 className="size-4" />
            <span className="hidden sm:inline">Multi-State</span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="gap-1.5 text-xs sm:text-sm">
            <Zap className="size-4" />
            <span className="hidden sm:inline">Forecast</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <AnimatePresence>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              {/* Hero: Large compliance score circle */}
              <ComplianceHero
                score={data.overallScore}
                trend={data.trend}
                trendDelta={data.trendDelta}
              />

              {/* Score Breakdown Cards */}
              <ScoreBreakdown breakdown={data.breakdown} />

              {/* Quick Actions */}
              <QuickActions />

              {/* At-Risk Items + Recommendations side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AtRiskItems items={data.atRiskItems} />
                <Recommendations recommendations={data.recommendations} />
              </div>

              {/* Compliance History Chart */}
              <ComplianceHistory history={data.history} />
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* Multi-State Tab */}
        <TabsContent value="multi-state">
          <AnimatePresence>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              <MultiStateSection />
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast">
          <AnimatePresence>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              <ForecastSection />
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}
