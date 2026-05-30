'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  ChevronRight,
  RotateCcw,
  Send,
  Ban,
  GitBranch,
  UserCheck,
  Eye,
  Bell,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  assignee: string;
  actions: string[];
  conditions: string[];
  order: number;
}

interface StepHistoryEntry {
  stepId: string;
  stepName: string;
  action: string;
  userId: string;
  timestamp: string;
  notes: string | null;
}

interface InstanceData {
  id: string;
  definitionId: string;
  entityType: string;
  entityId: string | null;
  currentStep: number;
  status: string;
  stepHistory: StepHistoryEntry[];
  variables: Record<string, unknown>;
  startedAt: string;
  completedAt: string | null;
  definition: {
    name: string;
    category: string;
    steps: WorkflowStep[];
    totalSteps: number;
    triggerType: string;
  };
}

const stepTypeEmoji: Record<string, string> = {
  approval: '👤',
  review: '👁',
  notification: '🔔',
  condition: '🔀',
  action: '⚡',
  delay: '⏱',
};

const stepTypeColor: Record<string, string> = {
  approval: 'from-emerald-500 to-emerald-600',
  review: 'from-teal-500 to-teal-600',
  notification: 'from-amber-500 to-amber-600',
  condition: 'from-violet-500 to-violet-600',
  action: 'from-orange-500 to-orange-600',
  delay: 'from-slate-400 to-slate-500',
};

const actionConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  approve: { label: 'Approve', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800' },
  reject: { label: 'Reject', icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 border-red-200 dark:border-red-800' },
  request_changes: { label: 'Request Changes', icon: RotateCcw, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 border-amber-200 dark:border-amber-800' },
  delegate: { label: 'Delegate', icon: Send, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30 hover:bg-teal-100 dark:hover:bg-teal-950/50 border-teal-200 dark:border-teal-800' },
};

export default function WorkflowInstancePage() {
  const t = useTranslations('workflows');
  const params = useParams();
  const instanceId = params.id as string;

  const [instance, setInstance] = useState<InstanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState('');
  const [advancing, setAdvancing] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const fetchInstance = useCallback(async () => {
    try {
      const res = await fetch(`/api/workflows/instances/${instanceId}`);
      if (res.ok) {
        const data = await res.json();
        setInstance(data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [instanceId]);

  useEffect(() => { fetchInstance(); }, [fetchInstance]);

  const advanceStep = async (action: string) => {
    setAdvancing(true);
    try {
      const res = await fetch(`/api/workflows/instances/${instanceId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: actionNotes || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.status === 'completed' ? t('workflowCompleted') : t('stepAdvanced'));
        setActionNotes('');
        fetchInstance();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to advance');
      }
    } catch {
      toast.error('Failed to advance step');
    } finally {
      setAdvancing(false);
    }
  };

  const cancelInstance = async () => {
    try {
      const res = await fetch(`/api/workflows/instances/${instanceId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('workflowCancelled'));
        fetchInstance();
      }
    } catch {
      toast.error('Failed to cancel');
    }
    setCancelOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        <AlertCircle className="size-8 mb-2" />
        <p className="text-sm">Workflow instance not found</p>
        <Link href="/workflows" className="mt-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-4 me-2" />
            Back to Workflows
          </Button>
        </Link>
      </div>
    );
  }

  const steps = instance.definition.steps;
  const currentStep = steps[instance.currentStep];
  const progress = instance.definition.totalSteps > 0
    ? Math.round((instance.currentStep / instance.definition.totalSteps) * 100)
    : 0;

  const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    active: { icon: Clock, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30', label: t('running') },
    completed: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', label: t('completed') },
    cancelled: { icon: Ban, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', label: t('cancel') },
    failed: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', label: t('failed') },
  };
  const status = statusConfig[instance.status] || statusConfig.active;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/workflows">
            <Button variant="ghost" size="icon" className="size-9">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{instance.definition.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px]">{t(instance.definition.category)}</Badge>
              <Badge className={cn('text-[10px]', status.bg, status.color, 'border-0')}>{status.label}</Badge>
            </div>
          </div>
        </div>
        {instance.status === 'active' && (
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={() => setCancelOpen(true)}
          >
            <Ban className="size-4 me-2" />
            {t('cancelWorkflow')}
          </Button>
        )}
      </div>

      {/* Progress */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">{t('stepProgress')}</p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{progress}%</p>
          </div>
          <div className="h-3 rounded-full bg-muted/60 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {t('currentStep')}: {instance.currentStep + 1} / {instance.definition.totalSteps}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step Timeline */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{t('steps')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative">
                {steps.map((step, idx) => {
                  const isCompleted = idx < instance.currentStep;
                  const isCurrent = idx === instance.currentStep && instance.status === 'active';
                  const isPending = idx > instance.currentStep || (idx === instance.currentStep && instance.status !== 'active');
                  const emoji = stepTypeEmoji[step.type] || '⚡';

                  return (
                    <div key={step.id} className="flex gap-3 relative pb-6 last:pb-0">
                      {/* Timeline line */}
                      {idx < steps.length - 1 && (
                        <div className={cn(
                          'absolute start-5 top-10 w-0.5 h-[calc(100%-20px)]',
                          isCompleted ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-border/50'
                        )} />
                      )}

                      {/* Step dot */}
                      <div className={cn(
                        'size-10 rounded-xl flex items-center justify-center shrink-0 z-10 border-2',
                        isCompleted ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700' :
                        isCurrent ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-400 dark:border-emerald-600 shadow-md shadow-emerald-500/10' :
                        'bg-muted/50 border-border/50'
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 className="size-5 text-emerald-500" />
                        ) : isCurrent ? (
                          <span className="text-base">{emoji}</span>
                        ) : (
                          <span className="text-sm opacity-40">{emoji}</span>
                        )}
                      </div>

                      {/* Step content */}
                      <div className={cn(
                        'flex-1 rounded-lg p-3 border transition-all',
                        isCurrent
                          ? 'bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800'
                          : isCompleted
                          ? 'bg-muted/20 border-border/30'
                          : 'bg-card border-border/30'
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <p className={cn(
                            'text-sm font-semibold',
                            isCurrent ? 'text-emerald-700 dark:text-emerald-300' : isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/60'
                          )}>
                            {step.name}
                          </p>
                          <Badge variant="outline" className="text-[9px] capitalize py-0">{step.type}</Badge>
                          {isCurrent && (
                            <Badge className="text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-0 py-0 animate-pulse">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Assignee: <span className="capitalize font-medium">{step.assignee}</span>
                          {step.actions.length > 0 && (
                            <span className="ms-2">
                              · Actions: {step.actions.join(', ')}
                            </span>
                          )}
                        </p>

                        {/* History entry for this step */}
                        {instance.stepHistory
                          .filter(h => h.stepId === step.id)
                          .map((history, hIdx) => (
                            <div key={hIdx} className="mt-2 pt-2 border-t border-border/30">
                              <div className="flex items-center gap-2">
                                {history.action === 'approve' && <CheckCircle2 className="size-3.5 text-emerald-500" />}
                                {history.action === 'reject' && <XCircle className="size-3.5 text-red-500" />}
                                {history.action === 'request_changes' && <RotateCcw className="size-3.5 text-amber-500" />}
                                {history.action === 'delegate' && <Send className="size-3.5 text-teal-500" />}
                                {history.action === 'start' && <Zap className="size-3.5 text-emerald-500" />}
                                <span className="text-[11px] font-medium capitalize">{history.action.replace('_', ' ')}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(history.timestamp).toLocaleString()}
                                </span>
                              </div>
                              {history.notes && (
                                <p className="text-[11px] text-muted-foreground mt-1 ps-5">{history.notes}</p>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Actions & Info */}
        <div className="space-y-4">
          {/* Current Step Actions */}
          {instance.status === 'active' && currentStep && (
            <Card className="border-emerald-200 dark:border-emerald-800 shadow-sm bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="text-base">{stepTypeEmoji[currentStep.type]}</span>
                  {t('quickActions')}
                </CardTitle>
                <CardDescription className="text-xs">{currentStep.name}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <Textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                  className="text-xs min-h-[60px] resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(actionConfig).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        className={cn('text-xs h-9', cfg.bg, cfg.color)}
                        onClick={() => advanceStep(key)}
                        disabled={advancing}
                      >
                        {advancing ? <Loader2 className="size-3.5 me-1.5 animate-spin" /> : <Icon className="size-3.5 me-1.5" />}
                        {cfg.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instance Info */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2.5">
              {[
                { label: t('entityType'), value: instance.entityType },
                { label: t('entityId'), value: instance.entityId || 'N/A' },
                { label: t('startedAt'), value: new Date(instance.startedAt).toLocaleString() },
                { label: t('version'), value: `v1` },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-xs font-medium capitalize">{item.value}</span>
                </div>
              ))}
              {instance.completedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Completed</span>
                  <span className="text-xs font-medium">{new Date(instance.completedAt).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step History */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{t('stepHistory')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="max-h-60">
                {instance.stepHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No history yet</p>
                ) : (
                  <div className="space-y-2">
                    {[...instance.stepHistory].reverse().map((entry, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <div className={cn(
                          'size-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                          entry.action === 'approve' ? 'bg-emerald-100 dark:bg-emerald-950/50' :
                          entry.action === 'reject' ? 'bg-red-100 dark:bg-red-950/50' :
                          entry.action === 'start' ? 'bg-teal-100 dark:bg-teal-950/50' :
                          'bg-amber-100 dark:bg-amber-950/50'
                        )}>
                          {entry.action === 'approve' && <CheckCircle2 className="size-3 text-emerald-500" />}
                          {entry.action === 'reject' && <XCircle className="size-3 text-red-500" />}
                          {entry.action === 'start' && <Zap className="size-3 text-teal-500" />}
                          {entry.action === 'request_changes' && <RotateCcw className="size-3 text-amber-500" />}
                          {entry.action === 'delegate' && <Send className="size-3 text-teal-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium capitalize">{entry.stepName} — {entry.action.replace('_', ' ')}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</p>
                          {entry.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{entry.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Confirmation */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cancelWorkflow')}</AlertDialogTitle>
            <AlertDialogDescription>{t('cancelConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={cancelInstance}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('cancelWorkflow')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
