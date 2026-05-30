'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  Shield,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  FileText,
  CircleDot,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';

interface ProjectData {
  id: string;
  name: string;
  description?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  complianceScore: number;
  insuranceRequired: number;
  bondRequired: boolean;
  bondAmount: number;
  notes?: string | null;
  createdAt: string;
}

interface ProjectLicense {
  id: string;
  projectId: string;
  licenseId: string;
  required: boolean;
  status: string;
  notes?: string | null;
  license: {
    id: string;
    name: string;
    type: string;
    licenseNumber: string;
    expirationDate: string;
    computedStatus: string;
  };
}

interface ProjectSub {
  id: string;
  projectId: string;
  subcontractorId: string;
  role?: string | null;
  complianceStatus: string;
  notes?: string | null;
  subcontractor: {
    id: string;
    name: string;
    company?: string | null;
    email: string;
    complianceStatus: string;
  };
}

interface ComplianceData {
  score: number;
  riskLevel: string;
  riskColor: string;
  licenses: {
    total: number;
    active: number;
    expiring: number;
    expired: number;
    required: number;
    requiredMet: number;
    score: number;
  };
  subcontractors: {
    total: number;
    compliant: number;
    pending: number;
    nonCompliant: number;
    score: number;
  };
  gaps: string[];
}

interface LicenseOption {
  id: string;
  name: string;
  licenseNumber: string;
}

interface SubOption {
  id: string;
  name: string;
  company?: string | null;
}

export default function ProjectDetailPage() {
  const t = useTranslations('projects');
  const tc = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const projectId = (params.id as string) || '';

  const [project, setProject] = useState<ProjectData | null>(null);
  const [projectLicenses, setProjectLicenses] = useState<ProjectLicense[]>([]);
  const [projectSubs, setProjectSubs] = useState<ProjectSub[]>([]);
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showAddLicense, setShowAddLicense] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [licenseOptions, setLicenseOptions] = useState<LicenseOption[]>([]);
  const [subOptions, setSubOptions] = useState<SubOption[]>([]);
  const [selectedLicenseId, setSelectedLicenseId] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('');
  const [linkNotes, setLinkNotes] = useState('');
  const [linkRequired, setLinkRequired] = useState(true);
  const [linkRole, setLinkRole] = useState('');

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projRes, compRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/compliance`),
      ]);
      if (projRes.ok) {
        const data = await projRes.json();
        setProject(data.project);
        setProjectLicenses(data.project?.projectLicenses || []);
        setProjectSubs(data.project?.projectSubs || []);
      } else {
        const errorText = await projRes.text();
        console.error('Project API error:', projRes.status, errorText);
        if (projRes.status === 401) {
          // Session might have expired, redirect to login
          router.push('/login');
        }
      }
      if (compRes.ok) {
        const compData = await compRes.json();
        setCompliance(compData);
      }
    } catch (err) {
      console.error('Fetch project error:', err);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [projectId, t, router]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const fetchLicenseOptions = async () => {
    try {
      const res = await fetch('/api/licenses?limit=100');
      if (res.ok) {
        const data = await res.json();
        setLicenseOptions(data.licenses || []);
      }
    } catch { /* ignore */ }
  };

  const fetchSubOptions = async () => {
    try {
      const res = await fetch('/api/subcontractors');
      if (res.ok) {
        const data = await res.json();
        setSubOptions((data.subcontractors || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          company: s.company,
        })));
      }
    } catch { /* ignore */ }
  };

  const handleAddLicense = async () => {
    if (!selectedLicenseId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/licenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId: selectedLicenseId, required: linkRequired, notes: linkNotes }),
      });
      if (res.ok) {
        toast.success(t('licenseLinked'));
        setShowAddLicense(false);
        setSelectedLicenseId('');
        setLinkNotes('');
        setLinkRequired(true);
        fetchProject();
      } else {
        const data = await res.json();
        toast.error(data.error || t('linkError'));
      }
    } catch {
      toast.error(t('linkError'));
    }
  };

  const handleRemoveLicense = async (linkId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/licenses?linkId=${linkId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('licenseUnlinked'));
        fetchProject();
      }
    } catch {
      toast.error(t('unlinkError'));
    }
  };

  const handleAddSub = async () => {
    if (!selectedSubId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/subcontractors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subcontractorId: selectedSubId, role: linkRole, notes: linkNotes }),
      });
      if (res.ok) {
        toast.success(t('subLinked'));
        setShowAddSub(false);
        setSelectedSubId('');
        setLinkRole('');
        setLinkNotes('');
        fetchProject();
      } else {
        const data = await res.json();
        toast.error(data.error || t('linkError'));
      }
    } catch {
      toast.error(t('linkError'));
    }
  };

  const handleRemoveSub = async (linkId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/subcontractors?linkId=${linkId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('subUnlinked'));
        fetchProject();
      }
    } catch {
      toast.error(t('unlinkError'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">{t('statusActive')}</Badge>;
      case 'completed':
        return <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400">{t('statusCompleted')}</Badge>;
      case 'on_hold':
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">{t('statusOnHold')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getLicenseStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"><CheckCircle2 className="size-3 me-1" />{t('licenseActive')}</Badge>;
      case 'expiring_soon':
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"><AlertTriangle className="size-3 me-1" />{t('licenseExpiring')}</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"><XCircle className="size-3 me-1" />{t('licenseExpired')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSubStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"><CheckCircle2 className="size-3 me-1" />{t('subCompliant')}</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"><Clock className="size-3 me-1" />{t('subPending')}</Badge>;
      case 'non_compliant':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"><XCircle className="size-3 me-1" />{t('subNonCompliant')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="h-4 bg-muted rounded w-1/2 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <Shield className="size-12 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-semibold">{t('projectNotFound')}</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/projects')}>
          <ArrowLeft className="size-4 me-2" />
          {tc('back')}
        </Button>
      </div>
    );
  }

  const scoreColor = project.complianceScore >= 80 ? 'emerald' : project.complianceScore >= 60 ? 'amber' : 'red';
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (project.complianceScore / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="absolute -top-12 -end-12 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -start-8 size-32 rounded-full bg-white/5 blur-xl" />
        <div className="relative flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/20">
            <Link href="/projects">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight">{project.name}</h1>
              {getStatusBadge(project.status)}
            </div>
            {project.description && (
              <p className="text-white/75 text-sm mt-0.5">{project.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('tabOverview')}</TabsTrigger>
          <TabsTrigger value="licenses">{t('tabLicenses')} ({projectLicenses.length})</TabsTrigger>
          <TabsTrigger value="subcontractors">{t('tabSubcontractors')} ({projectSubs.length})</TabsTrigger>
          <TabsTrigger value="compliance">{t('tabCompliance')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Compliance Score Card */}
            <Card className="bg-gradient-to-br from-emerald-50/50 via-emerald-50/30 to-teal-50/20 dark:from-emerald-950/20 dark:via-emerald-950/10 dark:to-teal-950/5 border-emerald-200/50 dark:border-emerald-800/30">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="relative size-24 mb-3">
                  <svg className="size-24 -rotate-90" viewBox="0 0 88 88">
                    <circle cx="44" cy="44" r="40" fill="none" className="stroke-muted" strokeWidth="5" />
                    <circle
                      cx="44"
                      cy="44"
                      r="40"
                      fill="none"
                      className={`stroke-${scoreColor}-500`}
                      strokeWidth="5"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-2xl font-extrabold text-${scoreColor}-600 dark:text-${scoreColor}-400`}>
                    {project.complianceScore}%
                  </span>
                </div>
                <p className="text-sm font-medium">{t('complianceScore')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {project.complianceScore >= 80 ? t('scoreGood') : project.complianceScore >= 60 ? t('scoreFair') : t('scorePoor')}
                </p>
              </CardContent>
            </Card>

            {/* Project Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('projectInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.clientName && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="size-4 text-muted-foreground" />
                    <span>{project.clientName}</span>
                  </div>
                )}
                {project.clientEmail && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="ps-6">{project.clientEmail}</span>
                  </div>
                )}
                {project.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span>{project.location}</span>
                  </div>
                )}
                {/* Project Timeline */}
                {(project.startDate || project.endDate) && (
                  <div className="mt-3 p-3 rounded-lg bg-gradient-to-br from-muted/40 to-muted/20 border border-border/30">
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <Clock className="size-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium">{t('projectInfo')}</span>
                    </div>
                    <div className="relative h-3 rounded-full bg-muted overflow-hidden mt-2">
                      {project.startDate && project.endDate ? (
                        <div className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(0, ((new Date().getTime() - new Date(project.startDate).getTime()) / (new Date(project.endDate).getTime() - new Date(project.startDate).getTime())) * 100))}%`
                          }}
                        />
                      ) : (
                        <div className="absolute inset-y-0 start-0 w-full rounded-full bg-emerald-300/50" />
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                      <span>{project.startDate ? new Date(project.startDate).toLocaleDateString() : t('present')}</span>
                      <span>{project.endDate ? new Date(project.endDate).toLocaleDateString() : t('present')}</span>
                    </div>
                  </div>
                )}
                {!project.startDate && !project.endDate && project.startDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="size-4 text-muted-foreground" />
                    <span>{new Date(project.startDate).toLocaleDateString()} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : t('present')}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('keyMetrics')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><Shield className="size-4 text-muted-foreground" />{t('linkedLicenses')}</span>
                  <span className="font-bold">{projectLicenses.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><Users className="size-4 text-muted-foreground" />{t('linkedSubs')}</span>
                  <span className="font-bold">{projectSubs.length}</span>
                </div>
                {project.insuranceRequired > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-muted-foreground" />{t('insuranceRequired')}</span>
                    <span className="font-bold">${project.insuranceRequired.toLocaleString()}</span>
                  </div>
                )}
                {project.bondRequired && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><FileText className="size-4 text-muted-foreground" />{t('bondAmount')}</span>
                    <span className="font-bold">${project.bondAmount.toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {project.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{tc('notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{project.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Licenses Tab */}
        <TabsContent value="licenses" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('linkedLicenses')}</h2>
            <Button
              onClick={() => { fetchLicenseOptions(); setShowAddLicense(true); }}
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              <Plus className="size-4 me-1" />
              {t('addLicense')}
            </Button>
          </div>

          {projectLicenses.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Shield className="size-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">{t('noLicensesLinked')}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{t('noLicensesLinkedDesc')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {projectLicenses.map((pl, idx) => (
                <motion.div
                  key={pl.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={`/licenses/${pl.licenseId}`}
                              className="font-semibold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            >
                              {pl.license.name}
                            </Link>
                            {pl.required && <Badge variant="outline" className="text-xs">{t('required')}</Badge>}
                            {getLicenseStatusBadge(pl.license.computedStatus)}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span>{pl.license.type}</span>
                            <span>{pl.license.licenseNumber}</span>
                            <span>{t('expires')}: {new Date(pl.license.expirationDate).toLocaleDateString()}</span>
                          </div>
                          {pl.notes && <p className="text-xs text-muted-foreground/70 mt-1">{pl.notes}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveLicense(pl.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Subcontractors Tab */}
        <TabsContent value="subcontractors" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('linkedSubs')}</h2>
            <Button
              onClick={() => { fetchSubOptions(); setShowAddSub(true); }}
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              <Plus className="size-4 me-1" />
              {t('addSubcontractor')}
            </Button>
          </div>

          {projectSubs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Users className="size-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">{t('noSubsLinked')}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{t('noSubsLinkedDesc')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {projectSubs.map((ps, idx) => (
                <motion.div
                  key={ps.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{ps.subcontractor.name}</span>
                            {ps.role && <Badge variant="outline" className="text-xs">{ps.role}</Badge>}
                            {getSubStatusBadge(ps.complianceStatus)}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            {ps.subcontractor.company && <span>{ps.subcontractor.company}</span>}
                            <span>{ps.subcontractor.email}</span>
                          </div>
                          {ps.notes && <p className="text-xs text-muted-foreground/70 mt-1">{ps.notes}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveSub(ps.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          {compliance ? (
            <>
              {/* Score Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{t('licenseCompliance')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-extrabold">{compliance.licenses.score}%</span>
                      <span className="text-sm text-muted-foreground">{compliance.licenses.active}/{compliance.licenses.total} {t('activeLabel')}</span>
                    </div>
                    <Progress value={compliance.licenses.score} className="h-2" />
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">{compliance.licenses.active}</p>
                        <p className="text-muted-foreground">{t('licenseActive')}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                        <p className="font-bold text-amber-600 dark:text-amber-400">{compliance.licenses.expiring}</p>
                        <p className="text-muted-foreground">{t('licenseExpiring')}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                        <p className="font-bold text-red-600 dark:text-red-400">{compliance.licenses.expired}</p>
                        <p className="text-muted-foreground">{t('licenseExpired')}</p>
                      </div>
                    </div>
                    {compliance.licenses.required > 0 && (
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <span>{t('requiredMet')}</span>
                        <span className={compliance.licenses.requiredMet >= compliance.licenses.required ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                          {compliance.licenses.requiredMet}/{compliance.licenses.required}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{t('subCompliance')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-extrabold">{compliance.subcontractors.score}%</span>
                      <span className="text-sm text-muted-foreground">{compliance.subcontractors.compliant}/{compliance.subcontractors.total} {t('compliantLabel')}</span>
                    </div>
                    <Progress value={compliance.subcontractors.score} className="h-2" />
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">{compliance.subcontractors.compliant}</p>
                        <p className="text-muted-foreground">{t('subCompliant')}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                        <p className="font-bold text-amber-600 dark:text-amber-400">{compliance.subcontractors.pending}</p>
                        <p className="text-muted-foreground">{t('subPending')}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                        <p className="font-bold text-red-600 dark:text-red-400">{compliance.subcontractors.nonCompliant}</p>
                        <p className="text-muted-foreground">{t('subNonCompliant')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Risk & Gaps */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className={`size-4 text-${compliance.riskColor}-500`} />
                    {t('riskAnalysis')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className={`bg-${compliance.riskColor}-100 text-${compliance.riskColor}-700 dark:bg-${compliance.riskColor}-950/30 dark:text-${compliance.riskColor}-400`}>
                      {compliance.riskLevel === 'low' ? t('riskLow') : compliance.riskLevel === 'medium' ? t('riskMedium') : t('riskHigh')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{t('overallScore')}: {compliance.score}%</span>
                  </div>

                  {/* Compliance Heatmap */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">{t('complianceHeatmap')}</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
                      {/* Licenses first */}
                      {projectLicenses.map((pl) => (
                        <div
                          key={`lic-${pl.id}`}
                          className={`aspect-square rounded-md relative group cursor-default transition-transform hover:scale-110 ${
                            pl.license.computedStatus === 'active'
                              ? 'bg-emerald-500'
                              : pl.license.computedStatus === 'expiring_soon'
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          title={`${pl.license.name}: ${pl.license.computedStatus}`}
                        >
                          <div className="absolute bottom-full start-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[10px] font-medium text-white bg-slate-900 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {pl.license.name}
                          </div>
                        </div>
                      ))}
                      {/* Subcontractors */}
                      {projectSubs.map((ps) => (
                        <div
                          key={`sub-${ps.id}`}
                          className={`aspect-square rounded-md relative group cursor-default transition-transform hover:scale-110 ${
                            ps.complianceStatus === 'compliant'
                              ? 'bg-emerald-500'
                              : ps.complianceStatus === 'pending'
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          title={`${ps.subcontractor.name}: ${ps.complianceStatus}`}
                        >
                          <div className="absolute bottom-full start-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[10px] font-medium text-white bg-slate-900 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {ps.subcontractor.name}
                          </div>
                        </div>
                      ))}
                      {projectLicenses.length === 0 && projectSubs.length === 0 && (
                        <div className="col-span-full text-center text-sm text-muted-foreground py-4">
                          {t('noItemsLinked')}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-emerald-500" /> {t('compliantLabel')}</span>
                      <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-amber-500" /> {t('attentionNeeded')}</span>
                      <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-red-500" /> {t('nonCompliantLabel')}</span>
                    </div>
                  </div>

                  {/* Gap Analysis */}
                  {compliance.gaps.length > 0 && (
                    <div className="p-3 rounded-lg bg-gradient-to-r from-red-50/80 to-amber-50/60 dark:from-red-950/20 dark:to-amber-950/10 border border-red-200/50 dark:border-red-800/30">
                      <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="size-3.5" />
                        {t('gapsIdentified')}
                      </p>
                      <ul className="space-y-1.5">
                        {compliance.gaps.map((gap, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                            <span className="size-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">{t('noComplianceData')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add License Dialog */}
      <Dialog open={showAddLicense} onOpenChange={setShowAddLicense}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addLicenseToProject')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('selectLicense')}</Label>
              <Select value={selectedLicenseId} onValueChange={setSelectedLicenseId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectLicensePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {licenseOptions.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} ({l.licenseNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="licenseRequired"
                checked={linkRequired}
                onChange={(e) => setLinkRequired(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="licenseRequired">{t('requiredForProject')}</Label>
            </div>
            <div className="space-y-2">
              <Label>{tc('notes')}</Label>
              <Textarea
                value={linkNotes}
                onChange={(e) => setLinkNotes(e.target.value)}
                placeholder={t('linkNotesPlaceholder')}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLicense(false)}>{tc('cancel')}</Button>
            <Button onClick={handleAddLicense} disabled={!selectedLicenseId} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              {t('linkLicense')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Subcontractor Dialog */}
      <Dialog open={showAddSub} onOpenChange={setShowAddSub}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addSubToProject')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('selectSubcontractor')}</Label>
              {subOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noSubcontractorsAvailable')}</p>
              ) : (
                <Select value={selectedSubId} onValueChange={setSelectedSubId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectSubPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {subOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}{s.company ? ` (${s.company})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('roleOnProject')}</Label>
              <Input value={linkRole} onChange={(e) => setLinkRole(e.target.value)} placeholder={t('rolePlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label>{tc('notes')}</Label>
              <Textarea value={linkNotes} onChange={(e) => setLinkNotes(e.target.value)} placeholder={t('linkNotesPlaceholder')} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSub(false)}>{tc('cancel')}</Button>
            <Button onClick={handleAddSub} disabled={!selectedSubId} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              {t('linkSubcontractor')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
