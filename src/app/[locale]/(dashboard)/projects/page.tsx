'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban,
  Plus,
  Search,
  MapPin,
  Calendar,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Link2,
  Unlink,
  Building2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

// Types
interface Project {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  clientName: string | null;
  clientEmail: string | null;
  location: string | null;
  state: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  requiredLicenses: string | null;
  requiredInsurance: string | null;
  complianceScore: number;
  createdAt: string;
  updatedAt: string;
  licenseCount: number;
  subcontractorCount: number;
}

interface ProjectLicense {
  id: string;
  licenseId: string;
  required: boolean;
  verified: boolean;
  verifiedAt: string | null;
  notes: string | null;
  license: {
    id: string;
    name: string;
    type: string;
    licenseNumber: string;
    expirationDate: string;
    state: string | null;
  };
}

interface ProjectSub {
  id: string;
  subcontractorId: string;
  role: string | null;
  complianceStatus: string;
  lastChecked: string | null;
  subcontractor: {
    id: string;
    companyName: string;
    contactName: string | null;
    email: string | null;
    complianceStatus: string;
    licenseExpiry: string | null;
    insuranceExpiry: string | null;
  };
}

interface OrgLicense {
  id: string;
  name: string;
  type: string;
  licenseNumber: string;
  expirationDate: string;
}

interface OrgSubcontractor {
  id: string;
  companyName: string;
  contactName: string | null;
  complianceStatus: string;
}

// Compliance Score Circle Component
function ComplianceScoreCircle({ score, size = 56 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return { stroke: '#10b981', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' };
    if (s >= 60) return { stroke: '#f59e0b', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' };
    return { stroke: '#ef4444', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' };
  };

  const color = getColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          className="text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className={cn('absolute text-xs font-bold', color.text)}>
        {score}%
      </span>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: {
      label: t('active'),
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    },
    completed: {
      label: t('completed'),
      className: 'bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border-teal-200 dark:border-teal-800',
    },
    on_hold: {
      label: t('onHold'),
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    },
  };

  const c = config[status] || config.active;

  return (
    <Badge variant="outline" className={cn('text-[10px] font-semibold px-2 py-0.5', c.className)}>
      {c.label}
    </Badge>
  );
}

// Compliance Label
function ComplianceLabel({ score, t }: { score: number; t: (key: string) => string }) {
  if (score >= 80) return <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t('highCompliance')}</span>;
  if (score >= 60) return <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{t('mediumCompliance')}</span>;
  return <span className="text-xs font-medium text-red-600 dark:text-red-400">{t('lowCompliance')}</span>;
}

export default function ProjectsPage() {
  const t = useTranslations('projects');
  const tc = useTranslations('common');
  const { toast } = useToast();

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [counts, setCounts] = useState({ all: 0, active: 0, completed: 0, on_hold: 0 });
  const [stats, setStats] = useState({ avgCompliance: 0, atRiskCount: 0 });

  // Dialog states
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkLicenseDialogOpen, setLinkLicenseDialogOpen] = useState(false);
  const [linkSubDialogOpen, setLinkSubDialogOpen] = useState(false);

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientName: '',
    clientEmail: '',
    location: '',
    state: '',
    startDate: '',
    endDate: '',
    status: 'active' as string,
    requiredLicenses: '',
    requiredInsurance: '',
  });
  const [saving, setSaving] = useState(false);

  // Detail data
  const [projectLicenses, setProjectLicenses] = useState<ProjectLicense[]>([]);
  const [projectSubs, setProjectSubs] = useState<ProjectSub[]>([]);
  const [orgLicenses, setOrgLicenses] = useState<OrgLicense[]>([]);
  const [orgSubs, setOrgSubs] = useState<OrgSubcontractor[]>([]);
  const [selectedLicenseId, setSelectedLicenseId] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('');
  const [detailTab, setDetailTab] = useState('overview');

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/projects?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProjects(data.projects || []);
      setCounts(data.counts || { all: 0, active: 0, completed: 0, on_hold: 0 });
      setStats(data.stats || { avgCompliance: 0, atRiskCount: 0 });
    } catch (err) {
      console.error('Fetch projects error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Fetch org licenses & subcontractors for link dialogs
  const fetchOrgData = useCallback(async () => {
    try {
      const [licRes, subRes] = await Promise.all([
        fetch('/api/licenses?limit=100'),
        fetch('/api/subcontractors'),
      ]);
      if (licRes.ok) {
        const licData = await licRes.json();
        setOrgLicenses(licData.licenses || []);
      }
      if (subRes.ok) {
        const subData = await subRes.json();
        setOrgSubs(subData.subcontractors || []);
      }
    } catch (err) {
      console.error('Fetch org data error:', err);
    }
  }, []);

  // Fetch project detail
  const fetchProjectDetail = useCallback(async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSelectedProject(data.project);
      setProjectLicenses(data.project.projectLicenses || []);
      setProjectSubs(data.project.projectSubs || []);
    } catch (err) {
      console.error('Fetch project detail error:', err);
    }
  }, []);

  // Open project dialog
  const openNewProjectDialog = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      clientName: '',
      clientEmail: '',
      location: '',
      state: '',
      startDate: '',
      endDate: '',
      status: 'active',
      requiredLicenses: '',
      requiredInsurance: '',
    });
    setProjectDialogOpen(true);
  };

  const openEditProjectDialog = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      clientName: project.clientName || '',
      clientEmail: project.clientEmail || '',
      location: project.location || '',
      state: project.state || '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      status: project.status,
      requiredLicenses: project.requiredLicenses || '',
      requiredInsurance: project.requiredInsurance || '',
    });
    setProjectDialogOpen(true);
  };

  // Save project (create or update)
  const handleSaveProject = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Project name is required', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
      const method = editingProject ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save');
      }

      toast({
        title: editingProject ? t('updateSuccess') : t('createSuccess'),
      });

      setProjectDialogOpen(false);
      fetchProjects();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Delete project
  const handleDeleteProject = async () => {
    if (!deletingProject) return;

    try {
      const res = await fetch(`/api/projects/${deletingProject.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      toast({ title: t('deleteSuccess') });
      setDeleteDialogOpen(false);
      setDeletingProject(null);
      fetchProjects();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete project', variant: 'destructive' });
    }
  };

  // Open detail dialog
  const openDetailDialog = (project: Project) => {
    fetchProjectDetail(project.id);
    fetchOrgData();
    setDetailTab('overview');
    setDetailDialogOpen(true);
  };

  // Link license
  const handleLinkLicense = async () => {
    if (!selectedProject || !selectedLicenseId) return;

    try {
      const res = await fetch(`/api/projects/${selectedProject.id}/licenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId: selectedLicenseId, required: true }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }

      toast({ title: t('linkSuccess') });
      setLinkLicenseDialogOpen(false);
      setSelectedLicenseId('');
      fetchProjectDetail(selectedProject.id);
      fetchProjects();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // Unlink license
  const handleUnlinkLicense = async (licenseId: string) => {
    if (!selectedProject) return;

    try {
      const res = await fetch(`/api/projects/${selectedProject.id}/licenses/${licenseId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed');

      toast({ title: t('unlinkSuccess') });
      fetchProjectDetail(selectedProject.id);
      fetchProjects();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to unlink license', variant: 'destructive' });
    }
  };

  // Link subcontractor
  const handleLinkSubcontractor = async () => {
    if (!selectedProject || !selectedSubId) return;

    try {
      const res = await fetch(`/api/projects/${selectedProject.id}/subcontractors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subcontractorId: selectedSubId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }

      toast({ title: t('subLinkSuccess') });
      setLinkSubDialogOpen(false);
      setSelectedSubId('');
      fetchProjectDetail(selectedProject.id);
      fetchProjects();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // Unlink subcontractor
  const handleUnlinkSubcontractor = async (subcontractorId: string) => {
    if (!selectedProject) return;

    try {
      const res = await fetch(`/api/projects/${selectedProject.id}/subcontractors/${subcontractorId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed');

      toast({ title: t('subUnlinkSuccess') });
      fetchProjectDetail(selectedProject.id);
      fetchProjects();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to unlink subcontractor', variant: 'destructive' });
    }
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  // Compute license status
  const getLicenseStatus = (expirationDate: string) => {
    const now = new Date();
    const exp = new Date(expirationDate);
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    if (exp <= now) return 'expired';
    if (exp <= thirtyDays) return 'expiring_soon';
    return 'active';
  };

  // Stats cards data
  const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };
  const containerVariants = { animate: { transition: { staggerChildren: 0.05 } } };

  const statCards = [
    { label: t('totalProjects'), value: counts.all, icon: FolderKanban, color: '', border: 'border-l-slate-400', iconColor: 'text-slate-500' },
    { label: t('activeProjects'), value: counts.active, icon: TrendingUp, color: '', border: 'border-l-emerald-500', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { label: t('complianceRate'), value: `${stats.avgCompliance}%`, icon: Shield, color: '', border: 'border-l-emerald-500', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { label: t('atRisk'), value: stats.atRiskCount, icon: AlertTriangle, color: '', border: 'border-l-red-500', iconColor: 'text-red-600 dark:text-red-400' },
  ];

  

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeIn} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {t('title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('description')}</p>
        </div>
        <Button
          onClick={openNewProjectDialog}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300"
        >
          <Plus className="size-4 me-2" />
          {t('newProject')}
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
      >
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div key={idx} variants={fadeIn}>
              <Card className={cn('border-l-2', stat.border)}>
                <CardContent className="p-3 md:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground/70 font-bold">{stat.label}</p>
                      <p className="text-2xl lg:text-3xl font-extrabold tabular-nums mt-1">{stat.value}</p>
                    </div>
                    <div className={cn('rounded-xl p-2 lg:p-3 shadow-sm', 'bg-background/50')}>
                      <Icon className={cn('size-5 lg:size-6', stat.iconColor)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Search & Filters */}
      <motion.div {...fadeIn} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="ps-9 h-10 bg-muted/30 border-border/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 h-10 bg-muted/30 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatus')}</SelectItem>
            <SelectItem value="active">{t('active')}</SelectItem>
            <SelectItem value="completed">{t('completed')}</SelectItem>
            <SelectItem value="on_hold">{t('onHold')}</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-1/2 mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <motion.div {...fadeIn} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative mb-6">
            <div className="rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 p-6 ring-1 ring-border/20">
              <FolderKanban className="size-12 text-muted-foreground/60" />
            </div>
            <div className="absolute -bottom-1 -end-1 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 p-1.5 ring-2 ring-background">
              <Plus className="size-3 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground">{t('noProjects')}</h3>
          <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">{t('noProjectsDesc')}</p>
          <Button
            onClick={openNewProjectDialog}
            className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/20"
          >
            <Plus className="size-4 me-2" />
            {t('newProject')}
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                variants={fadeIn}
                layout
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-emerald-500/30 dark:hover:border-emerald-400/20 bg-gradient-to-br from-card to-card/50"
                  onClick={() => openDetailDialog(project)}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base truncate">{project.name}</h3>
                          <StatusBadge status={project.status} t={t} />
                        </div>
                        {project.clientName && (
                          <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                            <Building2 className="size-3.5 shrink-0" />
                            {project.clientName}
                          </p>
                        )}
                      </div>
                      <ComplianceScoreCircle score={project.complianceScore} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {project.location && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="truncate">{project.location}{project.state ? `, ${project.state}` : ''}</span>
                        </div>
                      )}
                      {(project.startDate || project.endDate) && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="size-3.5 shrink-0" />
                          <span>{formatDate(project.startDate)} — {formatDate(project.endDate)}</span>
                        </div>
                      )}
                    </div>

                    <Separator className="my-3 opacity-50" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Shield className="size-3.5" />
                          <span>{project.licenseCount} {t('licenseCount')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="size-3.5" />
                          <span>{project.subcontractorCount} {t('subCount')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ComplianceLabel score={project.complianceScore} t={t} />
                        <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all duration-200" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* New/Edit Project Dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProject ? t('editProject') : t('newProject')}</DialogTitle>
            <DialogDescription className="sr-only">
              {editingProject ? t('editProject') : t('newProject')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('name')} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Downtown Office Complex"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('description_field')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Project description..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('clientName')}</Label>
                <Input
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="Client name"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('clientEmail')}</Label>
                <Input
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="client@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('location')}</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., 123 Main St"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('state')}</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g., CA"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('startDate')}</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('endDate')}</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('status')}</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('active')}</SelectItem>
                  <SelectItem value="completed">{t('completed')}</SelectItem>
                  <SelectItem value="on_hold">{t('onHold')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('requiredLicenses')}</Label>
              <Textarea
                value={formData.requiredLicenses}
                onChange={(e) => setFormData({ ...formData, requiredLicenses: e.target.value })}
                placeholder="List required licenses (one per line)..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('requiredInsurance')}</Label>
              <Textarea
                value={formData.requiredInsurance}
                onChange={(e) => setFormData({ ...formData, requiredInsurance: e.target.value })}
                placeholder="List required insurance (one per line)..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleSaveProject}
              disabled={saving || !formData.name.trim()}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              {saving ? tc('loading') : (editingProject ? tc('save') : tc('create'))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedProject?.name}
              {selectedProject && <StatusBadge status={selectedProject.status} t={t} />}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t('projectDetails')}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={detailTab} onValueChange={setDetailTab} className="flex-1 overflow-hidden">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
              <TabsTrigger value="licenses">{t('licenses')} ({projectLicenses.length})</TabsTrigger>
              <TabsTrigger value="subcontractors">{t('subcontractors')} ({projectSubs.length})</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="overflow-y-auto max-h-[60vh] mt-4">
              {selectedProject && (
                <div className="space-y-4">
                  {/* Compliance Score */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <ComplianceScoreCircle score={selectedProject.complianceScore || 0} size={72} />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('complianceScore')}</p>
                      <ComplianceLabel score={selectedProject.complianceScore || 0} t={t} />
                      <p className="text-xs text-muted-foreground mt-1">
                        Based on {projectLicenses.length} linked license{projectLicenses.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="grid grid-cols-2 gap-3">
                    {selectedProject.clientName && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('clientName')}</p>
                        <p className="text-sm font-medium">{selectedProject.clientName}</p>
                      </div>
                    )}
                    {selectedProject.clientEmail && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('clientEmail')}</p>
                        <p className="text-sm font-medium">{selectedProject.clientEmail}</p>
                      </div>
                    )}
                    {selectedProject.location && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('location')}</p>
                        <p className="text-sm font-medium">{selectedProject.location}</p>
                      </div>
                    )}
                    {selectedProject.state && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('state')}</p>
                        <p className="text-sm font-medium">{selectedProject.state}</p>
                      </div>
                    )}
                    {selectedProject.startDate && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('startDate')}</p>
                        <p className="text-sm font-medium">{formatDate(selectedProject.startDate)}</p>
                      </div>
                    )}
                    {selectedProject.endDate && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('endDate')}</p>
                        <p className="text-sm font-medium">{formatDate(selectedProject.endDate)}</p>
                      </div>
                    )}
                  </div>

                  {selectedProject.description && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('description_field')}</p>
                      <p className="text-sm">{selectedProject.description}</p>
                    </div>
                  )}

                  {selectedProject.requiredLicenses && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('requiredLicenses')}</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedProject.requiredLicenses}</p>
                    </div>
                  )}

                  {selectedProject.requiredInsurance && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('requiredInsurance')}</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedProject.requiredInsurance}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailDialogOpen(false);
                        openEditProjectDialog(selectedProject);
                      }}
                    >
                      {t('editProject')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailDialogOpen(false);
                        setDeletingProject(selectedProject);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="size-3.5 me-1" />
                      {t('deleteProject')}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Licenses Tab */}
            <TabsContent value="licenses" className="overflow-y-auto max-h-[60vh] mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{t('linkedLicenses')}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLinkLicenseDialogOpen(true)}
                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                  >
                    <Link2 className="size-3.5 me-1" />
                    {t('linkLicense')}
                  </Button>
                </div>

                {projectLicenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No licenses linked yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projectLicenses.map((pl) => {
                      const licStatus = getLicenseStatus(pl.license.expirationDate);
                      return (
                        <div
                          key={pl.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              'size-8 rounded-lg flex items-center justify-center shrink-0',
                              licStatus === 'active' ? 'bg-emerald-100 dark:bg-emerald-950/30' :
                              licStatus === 'expiring_soon' ? 'bg-amber-100 dark:bg-amber-950/30' :
                              'bg-red-100 dark:bg-red-950/30'
                            )}>
                              {licStatus === 'active' ? <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" /> :
                               licStatus === 'expiring_soon' ? <Clock className="size-4 text-amber-600 dark:text-amber-400" /> :
                               <XCircle className="size-4 text-red-600 dark:text-red-400" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{pl.license.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {pl.license.licenseNumber} · Exp: {formatDate(pl.license.expirationDate)}
                                {pl.required && <span className="ms-2 text-amber-600 dark:text-amber-400">({t('required')})</span>}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleUnlinkLicense(pl.licenseId)}
                          >
                            <Unlink className="size-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Subcontractors Tab */}
            <TabsContent value="subcontractors" className="overflow-y-auto max-h-[60vh] mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{t('linkedSubcontractors')}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLinkSubDialogOpen(true)}
                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                  >
                    <Link2 className="size-3.5 me-1" />
                    {t('linkSubcontractor')}
                  </Button>
                </div>

                {projectSubs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No subcontractors linked yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projectSubs.map((ps) => (
                      <div
                        key={ps.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            'size-8 rounded-lg flex items-center justify-center shrink-0',
                            ps.complianceStatus === 'compliant' ? 'bg-emerald-100 dark:bg-emerald-950/30' :
                            ps.complianceStatus === 'pending' ? 'bg-amber-100 dark:bg-amber-950/30' :
                            'bg-red-100 dark:bg-red-950/30'
                          )}>
                            {ps.complianceStatus === 'compliant' ? <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" /> :
                             ps.complianceStatus === 'pending' ? <Clock className="size-4 text-amber-600 dark:text-amber-400" /> :
                             <XCircle className="size-4 text-red-600 dark:text-red-400" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{ps.subcontractor.companyName}</p>
                            <p className="text-xs text-muted-foreground">
                              {ps.role || 'Subcontractor'} · {ps.complianceStatus === 'compliant' ? t('compliant') : ps.complianceStatus === 'pending' ? t('pending') : t('nonCompliant')}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleUnlinkSubcontractor(ps.subcontractorId)}
                        >
                          <Unlink className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteProject')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm')} {t('deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Link License Dialog */}
      <Dialog open={linkLicenseDialogOpen} onOpenChange={setLinkLicenseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('linkLicense')}</DialogTitle>
            <DialogDescription className="sr-only">{t('linkLicense')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={selectedLicenseId} onValueChange={setSelectedLicenseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a license..." />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="max-h-60">
                  {orgLicenses
                    .filter((l) => !projectLicenses.some((pl) => pl.licenseId === l.id))
                    .map((license) => (
                      <SelectItem key={license.id} value={license.id}>
                        <span className="truncate">{license.name} ({license.licenseNumber})</span>
                      </SelectItem>
                    ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkLicenseDialogOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleLinkLicense}
              disabled={!selectedLicenseId}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              {t('linkLicense')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Subcontractor Dialog */}
      <Dialog open={linkSubDialogOpen} onOpenChange={setLinkSubDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('linkSubcontractor')}</DialogTitle>
            <DialogDescription className="sr-only">{t('linkSubcontractor')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={selectedSubId} onValueChange={setSelectedSubId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subcontractor..." />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="max-h-60">
                  {orgSubs
                    .filter((s) => !projectSubs.some((ps) => ps.subcontractorId === s.id))
                    .map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        <span className="truncate">{sub.companyName}{sub.contactName ? ` (${sub.contactName})` : ''}</span>
                      </SelectItem>
                    ))}
                  {orgSubs.filter((s) => !projectSubs.some((ps) => ps.subcontractorId === s.id)).length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                      No subcontractors available
                    </div>
                  )}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkSubDialogOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleLinkSubcontractor}
              disabled={!selectedSubId}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              {t('linkSubcontractor')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
