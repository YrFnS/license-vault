'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListChecks,
  Plus,
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Trash2,
  Edit3,
  Eye,
  Calendar,
  MoreHorizontal,
  FileText,
  LayoutTemplate,
  FolderKanban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ChecklistEditor } from '@/components/checklists/ChecklistEditor';
import { ChecklistProgress } from '@/components/checklists/ChecklistProgress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Types
interface TemplateItem {
  id: string;
  label: string;
  required: boolean;
  category: string;
  order: number;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isDefault: boolean;
  isActive: boolean;
  items: string; // JSON
  createdAt: string;
  _count?: { instances: number };
}

interface ChecklistInstance {
  id: string;
  templateId: string;
  entityType: string;
  entityId: string | null;
  title: string;
  status: string;
  items: string; // JSON
  completedCount: number;
  totalCount: number;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  template?: { name: string; category: string };
}

interface InstanceCounts {
  total: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  completedThisMonth: number;
}

const categoryColors: Record<string, string> = {
  general: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  onboarding: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  renewal: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  audit: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  custom: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
};

export default function ChecklistsPage() {
  const t = useTranslations('checklists');
  const tc = useTranslations('common');

  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [instances, setInstances] = useState<ChecklistInstance[]>([]);
  const [instanceCounts, setInstanceCounts] = useState<InstanceCounts>({ total: 0, in_progress: 0, completed: 0, cancelled: 0, completedThisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('templates');

  // Template dialog state
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'general' as string,
  });
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([
    { id: '1', label: '', required: false, category: 'general', order: 0 },
  ]);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Instance dialog state
  const [instanceDialogOpen, setInstanceDialogOpen] = useState(false);
  const [instanceForm, setInstanceForm] = useState({
    templateId: '',
    title: '',
    entityType: 'license' as string,
    dueDate: '',
  });
  const [creatingInstance, setCreatingInstance] = useState(false);

  // View instance dialog
  const [viewInstance, setViewInstance] = useState<ChecklistInstance | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'template' | 'instance'; id: string } | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/checklists/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch {}
  }, []);

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch('/api/checklists/instances');
      if (res.ok) {
        const data = await res.json();
        setInstances(data.instances || []);
        setInstanceCounts(data.counts || { total: 0, in_progress: 0, completed: 0, cancelled: 0, completedThisMonth: 0 });
      }
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchTemplates(), fetchInstances()]).finally(() => setLoading(false));
  }, [fetchTemplates, fetchInstances]);

  // Template CRUD
  const openNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: '', description: '', category: 'general' });
    setTemplateItems([{ id: '1', label: '', required: false, category: 'general', order: 0 }]);
    setTemplateDialogOpen(true);
  };

  const openEditTemplate = (template: ChecklistTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      category: template.category,
    });
    try {
      const items = JSON.parse(template.items);
      setTemplateItems(items);
    } catch {
      setTemplateItems([{ id: '1', label: '', required: false, category: 'general', order: 0 }]);
    }
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    const validItems = templateItems.filter(i => i.label.trim());
    if (validItems.length === 0) {
      toast.error('At least one item is required');
      return;
    }

    setSavingTemplate(true);
    try {
      const payload = {
        ...templateForm,
        items: JSON.stringify(validItems),
      };

      const url = editingTemplate
        ? `/api/checklists/templates/${editingTemplate.id}`
        : '/api/checklists/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingTemplate ? 'Template updated' : 'Template created');
        setTemplateDialogOpen(false);
        fetchTemplates();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save template');
      }
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/checklists/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Template deleted');
        fetchTemplates();
      }
    } catch {
      toast.error('Failed to delete template');
    }
  };

  // Instance CRUD
  const handleCreateInstance = async () => {
    if (!instanceForm.templateId || !instanceForm.title.trim()) {
      toast.error('Template and title are required');
      return;
    }

    setCreatingInstance(true);
    try {
      const res = await fetch('/api/checklists/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instanceForm),
      });

      if (res.ok) {
        toast.success('Checklist created');
        setInstanceDialogOpen(false);
        fetchInstances();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create checklist');
      }
    } catch {
      toast.error('Failed to create checklist');
    } finally {
      setCreatingInstance(false);
    }
  };

  const handleToggleItem = async (instanceId: string, itemId: string) => {
    try {
      const res = await fetch(`/api/checklists/instances/${instanceId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      if (res.ok) {
        fetchInstances();
        // Update view dialog if open
        if (viewInstance?.id === instanceId) {
          const instRes = await fetch(`/api/checklists/instances/${instanceId}`);
          if (instRes.ok) {
            const data = await instRes.json();
            setViewInstance(data.instance);
          }
        }
      }
    } catch {
      toast.error('Failed to toggle item');
    }
  };

  const handleDeleteInstance = async (id: string) => {
    try {
      const res = await fetch(`/api/checklists/instances/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Checklist cancelled');
        fetchInstances();
        setViewDialogOpen(false);
      }
    } catch {
      toast.error('Failed to cancel checklist');
    }
  };

  const openViewInstance = async (inst: ChecklistInstance) => {
    try {
      const res = await fetch(`/api/checklists/instances/${inst.id}`);
      if (res.ok) {
        const data = await res.json();
        setViewInstance(data.instance);
        setViewDialogOpen(true);
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ListChecks className="size-6 text-emerald-600" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('description')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('templates'), value: templates.length, icon: LayoutTemplate, color: 'from-teal-50 to-teal-100/40 dark:from-teal-950/40', accent: 'border-teal-400' },
          { label: t('inProgress'), value: instanceCounts.in_progress, icon: Clock, color: 'from-amber-50 to-amber-100/40 dark:from-amber-950/40', accent: 'border-amber-400' },
          { label: t('completed'), value: instanceCounts.completed, icon: CheckCircle2, color: 'from-emerald-50 to-emerald-100/40 dark:from-emerald-950/40', accent: 'border-emerald-400' },
          { label: t('completedThisMonth'), value: instanceCounts.completedThisMonth, icon: Calendar, color: 'from-purple-50 to-purple-100/40 dark:from-purple-950/40', accent: 'border-purple-400' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className={`bg-gradient-to-br ${stat.color} border-s-4 ${stat.accent}`}>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                  <Icon className="size-4 text-muted-foreground/50" />
                </div>
                <p className="text-2xl font-extrabold tabular-nums">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates" className="gap-1.5">
            <LayoutTemplate className="size-3.5" />
            {t('templates')}
          </TabsTrigger>
          <TabsTrigger value="instances" className="gap-1.5">
            <ClipboardList className="size-3.5" />
            {t('activeChecklists')}
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNewTemplate} className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <Plus className="size-4" />
              {t('createTemplate')}
            </Button>
          </div>

          {templates.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-12">
                <LayoutTemplate className="size-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">{t('noTemplates')}</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">{t('noTemplatesDesc')}</p>
                <Button variant="outline" onClick={openNewTemplate} className="mt-4 gap-2">
                  <Plus className="size-4" />
                  {t('createTemplate')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template, idx) => {
                let itemCount = 0;
                try { itemCount = JSON.parse(template.items).length; } catch {}
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow group">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            {template.description && (
                              <CardDescription className="text-xs mt-1">{template.description}</CardDescription>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditTemplate(template)}>
                                <Edit3 className="size-3.5 me-2" />
                                {t('editTemplate')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => { setInstanceForm({ templateId: template.id, title: '', entityType: 'license', dueDate: '' }); setInstanceDialogOpen(true); }}
                              >
                                <ClipboardList className="size-3.5 me-2" />
                                {t('newFromTemplate')}
                              </DropdownMenuItem>
                              {!template.isDefault && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteTarget({ type: 'template', id: template.id })}
                                >
                                  <Trash2 className="size-3.5 me-2" />
                                  {t('deleteTemplate')}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={cn("text-[10px]", categoryColors[template.category] || categoryColors.general)}>
                            {t(template.category as any) || template.category}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {itemCount} {t('items')}
                          </Badge>
                          {template.isDefault && (
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200">
                              {t('defaultTemplates')}
                            </Badge>
                          )}
                          {template._count && template._count.instances > 0 && (
                            <Badge variant="outline" className="text-[10px]">
                              {template._count.instances} used
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Active Checklists Tab */}
        <TabsContent value="instances" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => { setInstanceForm({ templateId: '', title: '', entityType: 'license', dueDate: '' }); setInstanceDialogOpen(true); }}
              className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              <Plus className="size-4" />
              {t('newFromTemplate')}
            </Button>
          </div>

          {instances.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-12">
                <ClipboardList className="size-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">{t('noInstances')}</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">{t('noInstancesDesc')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {instances.map((inst, idx) => {
                const progress = inst.totalCount > 0 ? (inst.completedCount / inst.totalCount) * 100 : 0;
                const isOverdue = inst.dueDate && new Date(inst.dueDate) < new Date() && inst.status === 'in_progress';
                const isCompleted = inst.status === 'completed';

                return (
                  <motion.div
                    key={inst.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => openViewInstance(inst)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "flex items-center justify-center size-10 rounded-xl shrink-0",
                            isCompleted ? "bg-emerald-100 dark:bg-emerald-900/30" :
                            isOverdue ? "bg-red-100 dark:bg-red-900/30" :
                            "bg-amber-100 dark:bg-amber-900/30"
                          )}>
                            {isCompleted ? (
                              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                            ) : isOverdue ? (
                              <XCircle className="size-5 text-red-600 dark:text-red-400" />
                            ) : (
                              <Clock className="size-5 text-amber-600 dark:text-amber-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm">{inst.title}</h3>
                              <Badge variant="outline" className="text-[10px] capitalize">{inst.entityType}</Badge>
                              {inst.template && (
                                <Badge className={cn("text-[10px]", categoryColors[inst.template.category] || categoryColors.general)}>
                                  {inst.template.name}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <Progress value={progress} className="flex-1 h-1.5" />
                              <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                                {inst.completedCount}/{inst.totalCount}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                              {inst.dueDate && (
                                <span className={cn(isOverdue && "text-red-500 font-medium")}>
                                  <Calendar className="size-3 inline me-1" />
                                  {isOverdue ? 'Overdue' : new Date(inst.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="size-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? t('editTemplate') : t('createTemplate')}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? 'Edit the checklist template below' : 'Create a new checklist template'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name *</Label>
              <Input
                value={templateForm.name}
                onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., New Hire Onboarding"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={templateForm.description}
                onChange={e => setTemplateForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What is this checklist for..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={templateForm.category} onValueChange={v => setTemplateForm(f => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{t('general')}</SelectItem>
                  <SelectItem value="onboarding">{t('onboarding')}</SelectItem>
                  <SelectItem value="renewal">{t('renewal')}</SelectItem>
                  <SelectItem value="audit">{t('audit')}</SelectItem>
                  <SelectItem value="custom">{t('custom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-base font-semibold">Checklist Items</Label>
              <ChecklistEditor items={templateItems} onChange={setTemplateItems} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>{tc('cancel')}</Button>
            <Button onClick={handleSaveTemplate} disabled={savingTemplate} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white gap-2">
              {savingTemplate && <Loader2 className="size-4 animate-spin" />}
              {tc('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instance Dialog */}
      <Dialog open={instanceDialogOpen} onOpenChange={setInstanceDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{t('newFromTemplate')}</DialogTitle>
            <DialogDescription>Create a checklist from an existing template</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template *</Label>
              <Select value={instanceForm.templateId} onValueChange={v => {
                const tmpl = templates.find(t => t.id === v);
                setInstanceForm(f => ({ ...f, templateId: v, title: tmpl?.name || f.title }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={instanceForm.title}
                onChange={e => setInstanceForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Checklist title..."
              />
            </div>
            <div className="space-y-2">
              <Label>Entity Type</Label>
              <Select value={instanceForm.entityType} onValueChange={v => setInstanceForm(f => ({ ...f, entityType: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="license">License</SelectItem>
                  <SelectItem value="application">Application</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="subcontractor">Subcontractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={instanceForm.dueDate}
                onChange={e => setInstanceForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstanceDialogOpen(false)}>{tc('cancel')}</Button>
            <Button onClick={handleCreateInstance} disabled={creatingInstance} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white gap-2">
              {creatingInstance && <Loader2 className="size-4 animate-spin" />}
              {tc('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Instance Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewInstance?.title || 'Checklist'}
              {viewInstance && (
                <Badge variant="outline" className="text-[10px] capitalize">{viewInstance.status.replace('_', ' ')}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewInstance && (() => {
            let items: any[] = [];
            try { items = JSON.parse(viewInstance.items); } catch {}
            return (
              <ChecklistProgress
                items={items}
                onToggle={(itemId) => handleToggleItem(viewInstance.id, itemId)}
                completedCount={viewInstance.completedCount}
                totalCount={viewInstance.totalCount}
                dueDate={viewInstance.dueDate}
              />
            );
          })()}
          <DialogFooter className="gap-2">
            {viewInstance?.status === 'in_progress' && (
              <Button variant="destructive" size="sm" onClick={() => { if (viewInstance) handleDeleteInstance(viewInstance.id); }} className="gap-1">
                <Trash2 className="size-3.5" />
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. {deleteTarget?.type === 'template' ? 'This template will be deactivated.' : 'This checklist will be cancelled.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget?.type === 'template') handleDeleteTemplate(deleteTarget.id);
                else if (deleteTarget?.type === 'instance') handleDeleteInstance(deleteTarget.id);
                setDeleteTarget(null);
              }}
              className="bg-destructive text-destructive-foreground"
            >
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
