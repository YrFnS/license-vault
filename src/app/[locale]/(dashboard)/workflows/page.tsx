'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Workflow,
  Play,
  Trash2,
  Edit3,
  ToggleLeft,
  MoreHorizontal,
  GitBranch,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Eye,
  Power,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Textarea } from '@/components/ui/textarea';
import { WorkflowBuilder, WorkflowStep } from '@/components/workflows/WorkflowBuilder';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface WorkflowDefinitionData {
  id: string;
  name: string;
  description: string | null;
  category: string;
  triggerType: string;
  triggerConfig: string | null;
  steps: WorkflowStep[];
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  _count: { instances: number; activeInstances: number; completedInstances: number };
}

interface WorkflowInstanceData {
  id: string;
  definitionId: string;
  entityType: string;
  entityId: string | null;
  currentStep: number;
  status: string;
  stepHistory: Array<{ stepId: string; stepName: string; action: string; userId: string; timestamp: string; notes: string | null }>;
  startedAt: string;
  completedAt: string | null;
  definition: { name: string; category: string; steps: WorkflowStep[]; totalSteps: number };
}

interface Stats {
  total: number;
  active: number;
  runningInstances: number;
  completed: number;
}

const categoryColors: Record<string, string> = {
  license_renewal: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  onboarding: 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border-teal-200 dark:border-teal-800',
  audit: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  document_review: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  custom: 'bg-slate-50 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400 border-slate-200 dark:border-slate-800',
};

export default function WorkflowsPage() {
  const t = useTranslations('workflows');
  const [definitions, setDefinitions] = useState<WorkflowDefinitionData[]>([]);
  const [instances, setInstances] = useState<WorkflowInstanceData[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, runningInstances: 0, completed: 0 });
  const [instanceCounts, setInstanceCounts] = useState({ active: 0, completed: 0, cancelled: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('definitions');

  // Builder state
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [builderName, setBuilderName] = useState('');
  const [builderDesc, setBuilderDesc] = useState('');
  const [builderCategory, setBuilderCategory] = useState('custom');
  const [builderTrigger, setBuilderTrigger] = useState('manual');
  const [builderSteps, setBuilderSteps] = useState<WorkflowStep[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // Start workflow dialog
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [startDefId, setStartDefId] = useState('');
  const [startEntityType, setStartEntityType] = useState('license');
  const [startEntityId, setStartEntityId] = useState('');

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [defRes, instRes] = await Promise.all([
        fetch('/api/workflows/definitions'),
        fetch('/api/workflows/instances'),
      ]);
      if (defRes.ok) {
        const defData = await defRes.json();
        setDefinitions(defData.definitions);
        setStats(defData.stats);
      }
      if (instRes.ok) {
        const instData = await instRes.json();
        setInstances(instData.instances);
        setInstanceCounts(instData.counts);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreateBuilder = (template?: string) => {
    setEditingId(null);
    setBuilderName('');
    setBuilderDesc('');
    setBuilderCategory(template || 'custom');
    setBuilderTrigger('manual');
    setSelectedStepId(null);
    setBuilderOpen(true);

    if (template) {
      // Create from template - the API will handle the steps
      setBuilderSteps([]);
    } else {
      setBuilderSteps([]);
    }
  };

  const openEditBuilder = async (def: WorkflowDefinitionData) => {
    setEditingId(def.id);
    setBuilderName(def.name);
    setBuilderDesc(def.description || '');
    setBuilderCategory(def.category);
    setBuilderTrigger(def.triggerType);
    setBuilderSteps(def.steps);
    setSelectedStepId(null);
    setBuilderOpen(true);
  };

  const saveWorkflow = async () => {
    try {
      const body: Record<string, unknown> = {
        name: builderName,
        description: builderDesc || undefined,
        category: builderCategory,
        triggerType: builderTrigger,
        steps: JSON.stringify(builderSteps),
      };

      if (!editingId && builderCategory !== 'custom' && builderSteps.length === 0) {
        body.template = builderCategory;
      }

      const res = editingId
        ? await fetch(`/api/workflows/definitions/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/workflows/definitions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

      if (res.ok) {
        toast.success(t('workflowSaved'));
        setBuilderOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save workflow');
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      const res = await fetch(`/api/workflows/definitions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('workflowDeleted'));
        fetchData();
      }
    } catch {
      toast.error('Failed to delete');
    }
    setDeleteId(null);
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/workflows/definitions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        toast.success(isActive ? t('workflowDeleted') : t('workflowActivated'));
        fetchData();
      }
    } catch {
      toast.error('Failed to update');
    }
  };

  const startWorkflow = async () => {
    try {
      const res = await fetch('/api/workflows/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          definitionId: startDefId,
          entityType: startEntityType,
          entityId: startEntityId || undefined,
        }),
      });
      if (res.ok) {
        toast.success(t('workflowStarted'));
        setStartDialogOpen(false);
        fetchData();
        setActiveTab('instances');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to start');
      }
    } catch {
      toast.error('Failed to start workflow');
    }
  };

  const cancelInstance = async (id: string) => {
    try {
      const res = await fetch(`/api/workflows/instances/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('workflowCancelled'));
        fetchData();
      }
    } catch {
      toast.error('Failed to cancel');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStartDialogOpen(true)}
            className="border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400"
          >
            <Play className="size-4 me-2" />
            {t('startWorkflow')}
          </Button>
          <Button
            size="sm"
            onClick={() => openCreateBuilder()}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm"
          >
            <Plus className="size-4 me-2" />
            {t('createWorkflow')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t('totalWorkflows'), value: stats.total, icon: Workflow, color: 'from-emerald-500/10 to-teal-500/10' },
          { label: t('definitions'), value: stats.active, icon: CheckCircle2, color: 'from-teal-500/10 to-cyan-500/10' },
          { label: t('activeInstances'), value: stats.runningInstances, icon: Play, color: 'from-amber-500/10 to-orange-500/10' },
          { label: t('completedInstances'), value: stats.completed, icon: CheckCircle2, color: 'from-emerald-500/10 to-green-500/10' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className={cn('border-border/50 shadow-sm relative overflow-hidden', `bg-gradient-to-br ${stat.color}`)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-2xl font-extrabold mt-1 tabular-nums">{stat.value}</p>
                  </div>
                  <stat.icon className="size-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="definitions">{t('definitions')}</TabsTrigger>
          <TabsTrigger value="instances">
            {t('activeWorkflows')}
            {instanceCounts.active > 0 && (
              <Badge className="ms-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0">
                {instanceCounts.active}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Definitions Tab */}
        <TabsContent value="definitions" className="mt-4">
          {definitions.length === 0 ? (
            <Card className="border-dashed border-border/60">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="size-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-3">
                  <Workflow className="size-6 text-emerald-500" />
                </div>
                <p className="text-sm font-medium mb-1">{t('noWorkflows')}</p>
                <p className="text-xs text-muted-foreground mb-4">{t('noWorkflowsDesc')}</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => openCreateBuilder()} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                    <Plus className="size-4 me-2" />
                    {t('createWorkflow')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openCreateBuilder('license_renewal')}>
                    {t('fromTemplate')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {definitions.map((def, idx) => (
                  <motion.div
                    key={def.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={cn(
                      'border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden',
                      !def.isActive && 'opacity-60'
                    )}>
                      <div className="absolute top-0 start-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-semibold truncate">{def.name}</CardTitle>
                            {def.description && (
                              <CardDescription className="text-xs mt-1 line-clamp-2">{def.description}</CardDescription>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8 shrink-0">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditBuilder(def)}>
                                <Edit3 className="size-4 me-2" />
                                {t('editWorkflow')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleActive(def.id, def.isActive)}>
                                <Power className="size-4 me-2" />
                                {def.isActive ? t('deleteWorkflow') : t('activateWorkflow')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteId(def.id)}
                              >
                                <Trash2 className="size-4 me-2" />
                                {t('deleteWorkflow')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={cn('text-[10px] border', categoryColors[def.category] || categoryColors.custom)}>
                            {t(def.category)}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] border-border/50">
                            {t(def.triggerType)}
                          </Badge>
                          {!def.isActive && (
                            <Badge variant="outline" className="text-[10px] border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                              {t('inactive')}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <GitBranch className="size-3" />
                            {def.steps.length} {t('steps')}
                          </span>
                          <span>v{def.version}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Play className="size-3 text-emerald-500" />
                            {def._count?.activeInstances || 0} {t('running')}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="size-3 text-teal-500" />
                            {def._count?.completedInstances || 0} {t('completed')}
                          </span>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          onClick={() => { setStartDefId(def.id); setStartDialogOpen(true); }}
                          disabled={!def.isActive}
                        >
                          <Play className="size-3.5 me-2" />
                          {t('startWorkflow')}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Template Quick-Create */}
          {definitions.length > 0 && (
            <div className="mt-6">
              <Separator className="mb-4 opacity-50" />
              <p className="text-xs text-muted-foreground font-medium mb-3">{t('fromTemplate')}</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'license_renewal', emoji: '🔄' },
                  { key: 'onboarding', emoji: '📋' },
                  { key: 'audit', emoji: '🔍' },
                ].map((tpl) => (
                  <Button
                    key={tpl.key}
                    variant="outline"
                    size="sm"
                    onClick={() => openCreateBuilder(tpl.key)}
                    className="text-xs"
                  >
                    <span className="me-1.5">{tpl.emoji}</span>
                    {t(`${tpl.key}Workflow`)}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Instances Tab */}
        <TabsContent value="instances" className="mt-4">
          {instances.length === 0 ? (
            <Card className="border-dashed border-border/60">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="size-12 rounded-full bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center mb-3">
                  <Play className="size-6 text-teal-500" />
                </div>
                <p className="text-sm font-medium mb-1">{t('noActiveWorkflows')}</p>
                <p className="text-xs text-muted-foreground mb-4">{t('noActiveWorkflowsDesc')}</p>
                <Button size="sm" variant="outline" onClick={() => setActiveTab('definitions')}>
                  {t('definitions')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {instances.map((inst, idx) => {
                  const progress = inst.definition.totalSteps > 0
                    ? Math.round((inst.currentStep / inst.definition.totalSteps) * 100)
                    : 0;
                  const statusIcon = inst.status === 'completed' ? CheckCircle2
                    : inst.status === 'failed' ? XCircle
                    : inst.status === 'cancelled' ? AlertCircle
                    : Clock;
                  const StatusIcon = statusIcon;
                  const statusColor = inst.status === 'completed' ? 'text-emerald-500'
                    : inst.status === 'failed' ? 'text-red-500'
                    : inst.status === 'cancelled' ? 'text-amber-500'
                    : 'text-teal-500';

                  return (
                    <motion.div
                      key={inst.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 flex items-center justify-center shrink-0">
                                <StatusIcon className={cn('size-5', statusColor)} />
                              </div>
                              <div className="min-w-0">
                                <Link href={`/workflows/${inst.id}`} className="text-sm font-semibold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate block">
                                  {inst.definition.name}
                                </Link>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-[10px] py-0">
                                    {inst.entityType}
                                  </Badge>
                                  <span className="text-[11px] text-muted-foreground">
                                    {t('stepProgress')}: {inst.currentStep}/{inst.definition.totalSteps}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="w-24 sm:w-32">
                                <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' as const }}
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                                  />
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1 text-center">{progress}%</p>
                              </div>

                              <div className="flex items-center gap-1">
                                <Link href={`/workflows/${inst.id}`}>
                                  <Button variant="ghost" size="icon" className="size-8 hover:text-emerald-600">
                                    <Eye className="size-4" />
                                  </Button>
                                </Link>
                                {inst.status === 'active' && (
                                  <Button
                                    variant="ghost" size="icon"
                                    className="size-8 hover:text-destructive"
                                    onClick={() => cancelInstance(inst.id)}
                                  >
                                    <XCircle className="size-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Workflow Dialog */}
      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{editingId ? t('editWorkflow') : t('createWorkflow')}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Modify your workflow steps and settings' : 'Design a multi-step workflow for compliance processes'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 pe-4">
              {/* Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t('workflowName')}</Label>
                  <Input
                    value={builderName}
                    onChange={(e) => setBuilderName(e.target.value)}
                    placeholder="e.g., License Renewal Process"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t('workflowDescription')}</Label>
                  <Input
                    value={builderDesc}
                    onChange={(e) => setBuilderDesc(e.target.value)}
                    placeholder="Describe the workflow purpose..."
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t('category')}</Label>
                  <Select value={builderCategory} onValueChange={setBuilderCategory}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="license_renewal">{t('licenseRenewal')}</SelectItem>
                      <SelectItem value="onboarding">{t('onboarding')}</SelectItem>
                      <SelectItem value="audit">{t('audit')}</SelectItem>
                      <SelectItem value="document_review">{t('documentReview')}</SelectItem>
                      <SelectItem value="custom">{t('custom')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t('triggerType')}</Label>
                  <Select value={builderTrigger} onValueChange={setBuilderTrigger}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">{t('manual')}</SelectItem>
                      <SelectItem value="automatic">{t('automatic')}</SelectItem>
                      <SelectItem value="scheduled">{t('scheduled')}</SelectItem>
                      <SelectItem value="event">{t('event')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="opacity-50" />

              {/* Workflow Builder */}
              <WorkflowBuilder
                steps={builderSteps}
                onChange={setBuilderSteps}
                selectedStepId={selectedStepId}
                onSelectStep={setSelectedStepId}
              />
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBuilderOpen(false)}>{t('cancel')}</Button>
            <Button
              onClick={saveWorkflow}
              disabled={!builderName.trim()}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              {t('saveWorkflow')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Workflow Dialog */}
      <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('startWorkflow')}</DialogTitle>
            <DialogDescription>Start a new workflow instance from a definition</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t('selectDefinition')}</Label>
              <Select value={startDefId} onValueChange={setStartDefId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={t('selectDefinition')} />
                </SelectTrigger>
                <SelectContent>
                  {definitions.filter(d => d.isActive).map((def) => (
                    <SelectItem key={def.id} value={def.id}>{def.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">{t('selectEntityType')}</Label>
              <Select value={startEntityType} onValueChange={setStartEntityType}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="license">{t('license')}</SelectItem>
                  <SelectItem value="application">{t('application')}</SelectItem>
                  <SelectItem value="document">{t('document')}</SelectItem>
                  <SelectItem value="subcontractor">{t('subcontractor')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">{t('entityId')} (optional)</Label>
              <Input
                value={startEntityId}
                onChange={(e) => setStartEntityId(e.target.value)}
                placeholder="Entity ID..."
                className="h-9 text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStartDialogOpen(false)}>{t('cancel')}</Button>
            <Button
              onClick={startWorkflow}
              disabled={!startDefId}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              <Play className="size-4 me-2" />
              {t('startWorkflow')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteWorkflow')}</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate this workflow definition. Existing instances will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteWorkflow(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('deleteWorkflow')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
