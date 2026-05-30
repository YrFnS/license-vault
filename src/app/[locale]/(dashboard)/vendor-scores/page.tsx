'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Plus, AlertTriangle, Flag, RefreshCw, Trash2,
  Eye, ChevronDown, Shield, FileCheck, Award, Clock, TrendingUp,
  CheckCircle2, XCircle, AlertCircle, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface VendorScoreData {
  id: string;
  vendorName: string;
  vendorEmail: string | null;
  subcontractorId: string | null;
  overallScore: number;
  riskLevel: string;
  licenseScore: number;
  insuranceScore: number;
  documentScore: number;
  complianceScore: number;
  experienceScore: number;
  responsivenessScore: number;
  licenseVerified: boolean;
  licenseExpiry: string | null;
  licenseState: string | null;
  licenseType: string | null;
  insuranceVerified: boolean;
  insuranceExpiry: string | null;
  coiOnFile: boolean;
  endorsementStatus: string;
  requiredDocs: number;
  submittedDocs: number;
  expiredDocs: number;
  totalProjects: number;
  completedProjects: number;
  onTimeRate: number;
  avgRating: number;
  avgResponseDays: number;
  docRequestCount: number;
  docResponseCount: number;
  isFlagged: boolean;
  flagReason: string | null;
  lastAssessment: string | null;
  nextAssessment: string | null;
  assessmentHistory: string | null;
  notes: string | null;
  createdAt: string;
}

interface AssessmentResult {
  vendor: VendorScoreData;
  findings: { status: string; message: string }[];
  recommendations: string[];
  history: { date: string; score: number; changes: string }[];
}

const RISK_COLORS = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#14b8a6',
  low: '#10b981',
};

const SCORE_RANGES = [
  { name: '0-25', color: '#ef4444' },
  { name: '25-50', color: '#f59e0b' },
  { name: '50-75', color: '#14b8a6' },
  { name: '75-100', color: '#10b981' },
];

export default function VendorScoresPage() {
  const t = useTranslations('vendorScores');
  const { toast } = useToast();
  const [vendors, setVendors] = useState<VendorScoreData[]>([]);
  const [stats, setStats] = useState({ totalVendors: 0, avgScore: 0, highRiskCount: 0, flaggedCount: 0 });
  const [riskDistribution, setRiskDistribution] = useState({ critical: 0, high: 0, medium: 0, low: 0 });
  const [scoreDistribution, setScoreDistribution] = useState({ '0-25': 0, '25-50': 0, '50-75': 0, '75-100': 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [assessOpen, setAssessOpen] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorScoreData | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [bulkAssessing, setBulkAssessing] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [search, setSearch] = useState('');
  const [subcontractors, setSubcontractors] = useState<{ id: string; companyName: string }[]>([]);

  // Form state
  const [form, setForm] = useState({
    vendorName: '',
    vendorEmail: '',
    subcontractorId: '',
    licenseVerified: false,
    licenseExpiry: '',
    licenseState: '',
    licenseType: '',
    insuranceVerified: false,
    insuranceExpiry: '',
    coiOnFile: false,
    endorsementStatus: 'unknown',
    requiredDocs: 0,
    submittedDocs: 0,
    expiredDocs: 0,
    totalProjects: 0,
    completedProjects: 0,
    onTimeRate: 0,
    avgRating: 0,
    avgResponseDays: 0,
    docRequestCount: 0,
    docResponseCount: 0,
    notes: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vendor-scores');
      const data = await res.json();
      setVendors(data.vendors || []);
      setStats(data.stats || { totalVendors: 0, avgScore: 0, highRiskCount: 0, flaggedCount: 0 });
      setRiskDistribution(data.riskDistribution || { critical: 0, high: 0, medium: 0, low: 0 });
      setScoreDistribution(data.scoreDistribution || { '0-25': 0, '25-50': 0, '50-75': 0, '75-100': 0 });
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch vendor scores', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchSubcontractors = useCallback(async () => {
    try {
      const res = await fetch('/api/subcontractors');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSubcontractors(data.map((s: { id: string; companyName: string }) => ({ id: s.id, companyName: s.companyName })));
      } else if (data.subcontractors) {
        setSubcontractors(data.subcontractors.map((s: { id: string; companyName: string }) => ({ id: s.id, companyName: s.companyName })));
      }
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchSubcontractors();
  }, [fetchData, fetchSubcontractors]);

  // Filtered vendors
  const filteredVendors = vendors.filter(v => {
    if (activeTab === 'low') return v.riskLevel === 'low';
    if (activeTab === 'medium') return v.riskLevel === 'medium';
    if (activeTab === 'high') return v.riskLevel === 'high';
    if (activeTab === 'critical') return v.riskLevel === 'critical';
    if (activeTab === 'flagged') return v.isFlagged;
    return true;
  }).filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.vendorName.toLowerCase().includes(q) || (v.vendorEmail?.toLowerCase().includes(q) ?? false);
  });

  // Tab counts
  const tabCounts = {
    all: vendors.length,
    low: vendors.filter(v => v.riskLevel === 'low').length,
    medium: vendors.filter(v => v.riskLevel === 'medium').length,
    high: vendors.filter(v => v.riskLevel === 'high').length,
    critical: vendors.filter(v => v.riskLevel === 'critical').length,
    flagged: vendors.filter(v => v.isFlagged).length,
  };

  // Create vendor
  const handleCreate = async () => {
    try {
      const res = await fetch('/api/vendor-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, autoAssess: true }),
      });
      if (!res.ok) throw new Error();
      toast({ title: t('createSuccess') });
      setCreateOpen(false);
      setForm({
        vendorName: '', vendorEmail: '', subcontractorId: '',
        licenseVerified: false, licenseExpiry: '', licenseState: '', licenseType: '',
        insuranceVerified: false, insuranceExpiry: '', coiOnFile: false, endorsementStatus: 'unknown',
        requiredDocs: 0, submittedDocs: 0, expiredDocs: 0,
        totalProjects: 0, completedProjects: 0, onTimeRate: 0, avgRating: 0,
        avgResponseDays: 0, docRequestCount: 0, docResponseCount: 0, notes: '',
      });
      fetchData();
    } catch {
      toast({ title: t('createError'), variant: 'destructive' });
    }
  };

  // Run assessment
  const handleAssess = async (vendorId: string) => {
    try {
      setAssessing(true);
      const res = await fetch(`/api/vendor-scores/${vendorId}/assess`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAssessmentResult(data);
      setAssessOpen(true);
      fetchData();
    } catch {
      toast({ title: 'Failed to run assessment', variant: 'destructive' });
    } finally {
      setAssessing(false);
    }
  };

  // Bulk assess
  const handleBulkAssess = async () => {
    try {
      setBulkAssessing(true);
      const res = await fetch('/api/vendor-scores/bulk-assess', { method: 'POST' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast({ title: t('bulkAssessComplete'), description: `${data.assessed} vendors assessed` });
      fetchData();
    } catch {
      toast({ title: 'Bulk assessment failed', variant: 'destructive' });
    } finally {
      setBulkAssessing(false);
    }
  };

  // Flag/unflag
  const handleFlag = async () => {
    if (!selectedVendor) return;
    try {
      await fetch(`/api/vendor-scores/${selectedVendor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isFlagged: !selectedVendor.isFlagged,
          flagReason: !selectedVendor.isFlagged ? flagReason : null,
        }),
      });
      toast({ title: selectedVendor.isFlagged ? t('unflag') : t('flag') });
      setFlagOpen(false);
      setFlagReason('');
      fetchData();
    } catch {
      toast({ title: 'Failed to update flag', variant: 'destructive' });
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/vendor-scores/${id}`, { method: 'DELETE' });
      toast({ title: t('deleteSuccess') });
      fetchData();
    } catch {
      toast({ title: t('deleteError'), variant: 'destructive' });
    }
  };

  const getRiskBadge = (level: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      critical: { bg: 'bg-red-100 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400' },
      high: { bg: 'bg-amber-100 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
      medium: { bg: 'bg-teal-100 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-400' },
      low: { bg: 'bg-emerald-100 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
    };
    const c = config[level] || config.medium;
    return <Badge className={`${c.bg} ${c.text} border-0 font-semibold`}>{t(level as 'critical' | 'high' | 'medium' | 'low')}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#14b8a6';
    if (score >= 25) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return t('excellent');
    if (score >= 75) return t('good');
    if (score >= 50) return t('needsImprovement');
    return t('poor');
  };

  // Chart data
  const riskChartData = [
    { name: t('critical'), value: riskDistribution.critical, fill: RISK_COLORS.critical },
    { name: t('high'), value: riskDistribution.high, fill: RISK_COLORS.high },
    { name: t('medium'), value: riskDistribution.medium, fill: RISK_COLORS.medium },
    { name: t('low'), value: riskDistribution.low, fill: RISK_COLORS.low },
  ].filter(d => d.value > 0);

  const scoreChartData = SCORE_RANGES.map(r => ({
    name: r.name,
    value: (scoreDistribution as Record<string, number>)[r.name] || 0,
    fill: r.color,
  })).filter(d => d.value > 0);

  // Circular progress component
  const CircularScore = ({ score, size = 56 }: { score: number; size?: number }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const color = getScoreColor(score);

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={4} className="text-muted/30" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - progress} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>{Math.round(score)}</span>
      </div>
    );
  };

  // Score bar component
  const ScoreBar = ({ label, score, icon: Icon, weight }: { label: string; score: number; icon: React.ElementType; weight: string }) => {
    const color = getScoreColor(score);
    return (
      <div className="flex items-center gap-3 py-1.5">
        <Icon className="size-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground truncate">{label}</span>
            <span className="text-xs font-medium" style={{ color }}>{Math.round(score)}%</span>
          </div>
          <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground/60 shrink-0">{weight}</span>
      </div>
    );
  };

  // Category scores config
  const categoryScores = (v: VendorScoreData) => [
    { key: 'licenseScore', label: t('licenseScore'), icon: Shield, weight: '25%' },
    { key: 'insuranceScore', label: t('insuranceScore'), icon: ShieldCheck, weight: '25%' },
    { key: 'documentScore', label: t('documentScore'), icon: FileCheck, weight: '15%' },
    { key: 'complianceScore', label: t('complianceScore'), icon: Award, weight: '15%' },
    { key: 'experienceScore', label: t('experienceScore'), icon: TrendingUp, weight: '10%' },
    { key: 'responsivenessScore', label: t('responsivenessScore'), icon: Clock, weight: '10%' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-emerald-600 bg-clip-text text-transparent">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleBulkAssess} disabled={bulkAssessing || vendors.length === 0} className="gap-2">
            {bulkAssessing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            {t('bulkAssess')}
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
            <Plus className="size-4" />
            {t('addVendor')}
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('totalVendors'), value: stats.totalVendors, icon: ShieldCheck, color: 'teal' },
          { label: t('avgScore'), value: Math.round(stats.avgScore), icon: TrendingUp, color: 'emerald' },
          { label: t('highRisk'), value: stats.highRiskCount, icon: AlertTriangle, color: 'amber' },
          { label: t('flagged'), value: stats.flaggedCount, icon: Flag, color: 'red' },
        ].map((stat) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-s-4 shadow-sm hover:shadow-md transition-shadow" style={{ borderInlineStartColor: stat.color === 'teal' ? '#14b8a6' : stat.color === 'emerald' ? '#10b981' : stat.color === 'amber' ? '#f59e0b' : '#ef4444' }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-extrabold tabular-nums mt-1">{stat.value}</p>
                  </div>
                  <div className={`size-10 rounded-xl flex items-center justify-center bg-${stat.color}-100 dark:bg-${stat.color}-950/30`}>
                    <stat.icon className={`size-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      {vendors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t('riskDistribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={riskChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {riskChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t('scoreDistribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={scoreChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {scoreChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 mt-2">
                {scoreChartData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                    <span className="text-[10px] text-muted-foreground">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <Input placeholder={t('vendorName') + '...'} value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {[
            { key: 'all', label: t('all') },
            { key: 'low', label: t('low') },
            { key: 'medium', label: t('medium') },
            { key: 'high', label: t('high') },
            { key: 'critical', label: t('critical') },
            { key: 'flagged', label: t('flaggedTab') },
          ].map(tab => (
            <TabsTrigger key={tab.key} value={tab.key} className="text-xs gap-1.5 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400">
              {tab.label}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{(tabCounts as Record<string, number>)[tab.key] ?? 0}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Vendor Cards */}
      {filteredVendors.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShieldCheck className="size-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">{t('noVendors')}</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">{t('noVendorsDesc')}</p>
            <Button className="mt-4 gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> {t('addVendor')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredVendors.map((vendor, idx) => (
              <motion.div key={vendor.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Score circle */}
                      <CircularScore score={vendor.overallScore} size={64} />

                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm truncate">{vendor.vendorName}</h3>
                          {getRiskBadge(vendor.riskLevel)}
                          {vendor.isFlagged && (
                            <Badge className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-0 gap-1">
                              <Flag className="size-3" /> {t('flagged')}
                            </Badge>
                          )}
                        </div>
                        {vendor.vendorEmail && <p className="text-xs text-muted-foreground mt-0.5">{vendor.vendorEmail}</p>}

                        {/* Category scores */}
                        <div className="mt-3 space-y-0.5">
                          {categoryScores(vendor).map(cat => (
                            <ScoreBar
                              key={cat.key}
                              label={cat.label}
                              score={vendor[cat.key as keyof VendorScoreData] as number}
                              icon={cat.icon}
                              weight={cat.weight}
                            />
                          ))}
                        </div>

                        {/* Meta info */}
                        <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground/70">
                          {vendor.lastAssessment && (
                            <span>{t('lastAssessment')}: {new Date(vendor.lastAssessment).toLocaleDateString()}</span>
                          )}
                          {vendor.flagReason && (
                            <span className="text-red-500/80 truncate">⚠ {vendor.flagReason}</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { setSelectedVendor(vendor); handleAssess(vendor.id); }}>
                            {assessing && selectedVendor?.id === vendor.id ? <Loader2 className="size-3 animate-spin" /> : <Eye className="size-3" />}
                            {t('viewDetails')}
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleAssess(vendor.id)} disabled={assessing}>
                            <RefreshCw className="size-3" /> {t('assess')}
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { setSelectedVendor(vendor); setFlagReason(''); setFlagOpen(true); }}>
                            <Flag className="size-3" /> {vendor.isFlagged ? t('unflag') : t('flag')}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => handleDelete(vendor.id)}>
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-emerald-500" /> {t('addVendor')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('vendorName')} *</Label>
                <Input value={form.vendorName} onChange={e => setForm(p => ({ ...p, vendorName: e.target.value }))} placeholder="Acme Construction" />
              </div>
              <div className="space-y-2">
                <Label>{t('vendorEmail')}</Label>
                <Input type="email" value={form.vendorEmail} onChange={e => setForm(p => ({ ...p, vendorEmail: e.target.value }))} placeholder="vendor@example.com" />
              </div>
              <div className="space-y-2">
                <Label>{t('selectSubcontractor')}</Label>
                <Select value={form.subcontractorId || 'none'} onValueChange={v => setForm(p => ({ ...p, subcontractorId: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('none')}</SelectItem>
                    {subcontractors.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />
            <h4 className="text-sm font-semibold">{t('licenseScore')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.licenseVerified} onChange={e => setForm(p => ({ ...p, licenseVerified: e.target.checked }))} className="rounded" />
                <Label className="text-xs">{t('licenseVerified')}</Label>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">License Expiry</Label>
                <Input type="date" value={form.licenseExpiry} onChange={e => setForm(p => ({ ...p, licenseExpiry: e.target.value }))} />
              </div>
            </div>

            <Separator />
            <h4 className="text-sm font-semibold">{t('insuranceScore')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.insuranceVerified} onChange={e => setForm(p => ({ ...p, insuranceVerified: e.target.checked }))} className="rounded" />
                <Label className="text-xs">{t('insuranceVerified')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.coiOnFile} onChange={e => setForm(p => ({ ...p, coiOnFile: e.target.checked }))} className="rounded" />
                <Label className="text-xs">{t('coiOnFile')}</Label>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Endorsement Status</Label>
                <Select value={form.endorsementStatus} onValueChange={v => setForm(p => ({ ...p, endorsementStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Unknown</SelectItem>
                    <SelectItem value="compliant">Compliant</SelectItem>
                    <SelectItem value="deficient">Deficient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />
            <h4 className="text-sm font-semibold">{t('documentScore')}</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">{t('docsRequired')}</Label>
                <Input type="number" min={0} value={form.requiredDocs} onChange={e => setForm(p => ({ ...p, requiredDocs: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('docsSubmitted')}</Label>
                <Input type="number" min={0} value={form.submittedDocs} onChange={e => setForm(p => ({ ...p, submittedDocs: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Expired Docs</Label>
                <Input type="number" min={0} value={form.expiredDocs} onChange={e => setForm(p => ({ ...p, expiredDocs: Number(e.target.value) }))} />
              </div>
            </div>

            <Separator />
            <h4 className="text-sm font-semibold">{t('experienceScore')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Total Projects</Label>
                <Input type="number" min={0} value={form.totalProjects} onChange={e => setForm(p => ({ ...p, totalProjects: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('projectsCompleted')}</Label>
                <Input type="number" min={0} value={form.completedProjects} onChange={e => setForm(p => ({ ...p, completedProjects: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('onTimeRate')} %</Label>
                <Input type="number" min={0} max={100} value={form.onTimeRate} onChange={e => setForm(p => ({ ...p, onTimeRate: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Avg Rating (0-5)</Label>
                <Input type="number" min={0} max={5} step={0.1} value={form.avgRating} onChange={e => setForm(p => ({ ...p, avgRating: Number(e.target.value) }))} />
              </div>
            </div>

            <Separator />
            <h4 className="text-sm font-semibold">{t('responsivenessScore')}</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">{t('avgResponseDays')}</Label>
                <Input type="number" min={0} step={0.1} value={form.avgResponseDays} onChange={e => setForm(p => ({ ...p, avgResponseDays: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Doc Requests</Label>
                <Input type="number" min={0} value={form.docRequestCount} onChange={e => setForm(p => ({ ...p, docRequestCount: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Doc Responses</Label>
                <Input type="number" min={0} value={form.docResponseCount} onChange={e => setForm(p => ({ ...p, docResponseCount: Number(e.target.value) }))} />
              </div>
            </div>

            <Separator />
            <div className="space-y-1">
              <Label className="text-xs">{t('notes')}</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder={t('notesPlaceholder')} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{'Cancel'}</Button>
            <Button onClick={handleCreate} disabled={!form.vendorName} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">{t('addVendor')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assessment Dialog */}
      <Dialog open={assessOpen} onOpenChange={setAssessOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-emerald-500" /> {t('assessment')}</DialogTitle>
          </DialogHeader>
          {assessmentResult && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 pr-4">
                {/* Overall score */}
                <div className="flex flex-col items-center gap-2 py-4">
                  <CircularScore score={assessmentResult.vendor.overallScore} size={96} />
                  <div className="text-center">
                    <p className="text-sm font-semibold">{assessmentResult.vendor.vendorName}</p>
                    <p className="text-xs text-muted-foreground">{getScoreLabel(assessmentResult.vendor.overallScore)}</p>
                    {getRiskBadge(assessmentResult.vendor.riskLevel)}
                  </div>
                </div>

                {/* Score breakdown */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">{t('scoreBreakdown')}</h4>
                  <div className="space-y-1">
                    {categoryScores(assessmentResult.vendor).map(cat => (
                      <ScoreBar
                        key={cat.key}
                        label={cat.label}
                        score={assessmentResult.vendor[cat.key as keyof VendorScoreData] as number}
                        icon={cat.icon}
                        weight={cat.weight}
                      />
                    ))}
                  </div>
                </div>

                {/* Findings */}
                {assessmentResult.findings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">{t('findings')}</h4>
                    <div className="space-y-1.5">
                      {assessmentResult.findings.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          {f.status === 'passed' && <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />}
                          {f.status === 'failed' && <XCircle className="size-4 text-red-500 shrink-0 mt-0.5" />}
                          {f.status === 'needsAttention' && <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />}
                          <span>{f.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {assessmentResult.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">{t('recommendations')}</h4>
                    <div className="space-y-1.5">
                      {assessmentResult.recommendations.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <ChevronDown className="size-4 text-teal-500 shrink-0 mt-0.5 rotate-[-90deg]" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Historical trend */}
                {assessmentResult.history.length > 1 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">{t('historical')}</h4>
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={assessmentResult.history.map(h => ({ date: new Date(h.date).toLocaleDateString(), score: h.score }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                        <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Flag Dialog */}
      <Dialog open={flagOpen} onOpenChange={setFlagOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Flag className="size-5 text-red-500" /> {t('flagVendor')}</DialogTitle>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selectedVendor.isFlagged ? t('unflag') : t('flag')}: <span className="font-semibold text-foreground">{selectedVendor.vendorName}</span>
              </p>
              {!selectedVendor.isFlagged && (
                <div className="space-y-2">
                  <Label>{t('flagReason')}</Label>
                  <Textarea value={flagReason} onChange={e => setFlagReason(e.target.value)} placeholder={t('flagReasonPlaceholder')} rows={3} />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagOpen(false)}>Cancel</Button>
            <Button onClick={handleFlag} variant={selectedVendor?.isFlagged ? 'outline' : 'destructive'}>
              {selectedVendor?.isFlagged ? t('unflag') : t('flag')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
