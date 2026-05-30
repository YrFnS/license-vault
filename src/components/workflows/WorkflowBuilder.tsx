'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck,
  Eye,
  Bell,
  GitBranch,
  Zap,
  Clock,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'approval' | 'review' | 'notification' | 'condition' | 'action' | 'delay';
  assignee: string;
  actions: string[];
  conditions: string[];
  order: number;
  autoAdvance?: boolean;
  slaHours?: number;
}

const stepTypeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; emoji: string }> = {
  approval: { icon: UserCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', emoji: '👤' },
  review: { icon: Eye, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30', emoji: '👁' },
  notification: { icon: Bell, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', emoji: '🔔' },
  condition: { icon: GitBranch, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30', emoji: '🔀' },
  action: { icon: Zap, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30', emoji: '⚡' },
  delay: { icon: Clock, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-950/30', emoji: '⏱' },
};

interface WorkflowBuilderProps {
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
  selectedStepId: string | null;
  onSelectStep: (id: string | null) => void;
}

export function WorkflowBuilder({ steps, onChange, selectedStepId, onSelectStep }: WorkflowBuilderProps) {
  const t = useTranslations('workflows');

  const addStep = useCallback(() => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      name: `${t('stepNumber', { number: steps.length + 1 })}`,
      type: 'approval',
      assignee: 'admin',
      actions: [],
      conditions: [],
      order: steps.length,
    };
    onChange([...steps, newStep]);
    onSelectStep(newStep.id);
  }, [steps, onChange, onSelectStep, t]);

  const deleteStep = useCallback((id: string) => {
    const filtered = steps.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i }));
    onChange(filtered);
    if (selectedStepId === id) onSelectStep(null);
  }, [steps, onChange, selectedStepId, onSelectStep]);

  const updateStep = useCallback((id: string, updates: Partial<WorkflowStep>) => {
    onChange(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  }, [steps, onChange]);

  const moveStep = useCallback((id: string, direction: 'up' | 'down') => {
    const idx = steps.findIndex(s => s.id === id);
    if ((direction === 'up' && idx <= 0) || (direction === 'down' && idx >= steps.length - 1)) return;
    const newSteps = [...steps];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newSteps[idx], newSteps[swapIdx]] = [newSteps[swapIdx], newSteps[idx]];
    onChange(newSteps.map((s, i) => ({ ...s, order: i })));
  }, [steps, onChange]);

  const selectedStep = steps.find(s => s.id === selectedStepId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left Panel: Step List */}
      <div className="lg:col-span-1">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">{t('steps')}</CardTitle>
              <Badge variant="secondary" className="text-xs">{steps.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-1">
                <AnimatePresence mode="popLayout">
                  {steps.map((step, idx) => {
                    const config = stepTypeConfig[step.type] || stepTypeConfig.action;
                    const Icon = config.icon;
                    const isSelected = selectedStepId === step.id;

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => onSelectStep(step.id)}
                        className={cn(
                          'group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all duration-200 border',
                          isSelected
                            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800 shadow-sm'
                            : 'hover:bg-muted/50 border-transparent'
                        )}
                      >
                        <div className="flex items-center gap-1.5 shrink-0">
                          <GripVertical className="size-3.5 text-muted-foreground/40" />
                          <span className="text-xs font-mono text-muted-foreground w-5 text-center">{idx + 1}</span>
                        </div>

                        <div className={cn('flex items-center justify-center size-7 rounded-lg shrink-0', config.bg)}>
                          <span className="text-sm">{config.emoji}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm truncate', isSelected ? 'font-semibold text-emerald-700 dark:text-emerald-300' : 'font-medium')}>
                            {step.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground capitalize">{step.type}</p>
                        </div>

                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="icon" className="size-6"
                            onClick={(e) => { e.stopPropagation(); moveStep(step.id, 'up'); }}
                            disabled={idx === 0}
                          >
                            <ChevronUp className="size-3" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="size-6"
                            onClick={(e) => { e.stopPropagation(); moveStep(step.id, 'down'); }}
                            disabled={idx === steps.length - 1}
                          >
                            <ChevronDown className="size-3" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="size-6 text-destructive hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); deleteStep(step.id); }}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Add step button */}
                <Button
                  variant="outline"
                  className="w-full border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 mt-2"
                  onClick={addStep}
                >
                  <Plus className="size-4 me-2" />
                  {t('addStep')}
                </Button>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Center Panel: Visual Canvas */}
      <div className="lg:col-span-1">
        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Flow</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-[400px]">
              <div className="flex flex-col items-center py-2">
                {steps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <GitBranch className="size-8 mb-2 opacity-30" />
                    <p className="text-sm">{t('noWorkflows')}</p>
                  </div>
                ) : (
                  steps.map((step, idx) => {
                    const config = stepTypeConfig[step.type] || stepTypeConfig.action;
                    const isSelected = selectedStepId === step.id;
                    return (
                      <div key={step.id} className="flex flex-col items-center">
                        <motion.div
                          whileHover={{ scale: 1.03 }}
                          onClick={() => onSelectStep(step.id)}
                          className={cn(
                            'px-4 py-2.5 rounded-xl border cursor-pointer transition-all duration-200 w-full max-w-[200px]',
                            isSelected
                              ? 'border-emerald-300 dark:border-emerald-700 shadow-md bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40'
                              : 'border-border/60 bg-card hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-sm'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{config.emoji}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">{step.name}</p>
                              <p className="text-[10px] text-muted-foreground capitalize">{step.type}</p>
                            </div>
                          </div>
                        </motion.div>
                        {idx < steps.length - 1 && (
                          <div className="flex flex-col items-center py-1">
                            <div className="w-[2px] h-5 bg-gradient-to-b from-emerald-300 to-teal-300 dark:from-emerald-700 dark:to-teal-700 rounded-full" />
                            <div className="size-2 rounded-full bg-teal-400 dark:bg-teal-600" />
                            <div className="w-[2px] h-5 bg-gradient-to-b from-teal-300 to-emerald-300 dark:from-teal-700 dark:to-emerald-700 rounded-full" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: Step Editor */}
      <div className="lg:col-span-1">
        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              {selectedStep ? selectedStep.name : t('selectDefinition')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {selectedStep ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t('stepName')}</Label>
                  <Input
                    value={selectedStep.name}
                    onChange={(e) => updateStep(selectedStep.id, { name: e.target.value })}
                    placeholder="Step name..."
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t('stepType')}</Label>
                  <Select
                    value={selectedStep.type}
                    onValueChange={(val) => updateStep(selectedStep.id, { type: val as WorkflowStep['type'] })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(stepTypeConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          <span className="me-2">{cfg.emoji}</span>
                          {t(key)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t('assignee')}</Label>
                  <Select
                    value={selectedStep.assignee}
                    onValueChange={(val) => updateStep(selectedStep.id, { assignee: val })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">{t('owner')}</SelectItem>
                      <SelectItem value="admin">{t('admin')}</SelectItem>
                      <SelectItem value="member">{t('member')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="opacity-50" />

                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t('stepActions')}</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStep.actions.map((action, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[11px] gap-1">
                        {action}
                        <button
                          onClick={() => {
                            const newActions = selectedStep.actions.filter((_, i) => i !== idx);
                            updateStep(selectedStep.id, { actions: newActions });
                          }}
                          className="hover:text-destructive transition-colors"
                        >
                          <Trash2 className="size-2.5" />
                        </button>
                      </Badge>
                    ))}
                    <Input
                      placeholder="Add action..."
                      className="h-7 text-xs w-28"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            updateStep(selectedStep.id, { actions: [...selectedStep.actions, val] });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t('stepConditions')}</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStep.conditions.map((cond, idx) => (
                      <Badge key={idx} variant="outline" className="text-[11px] gap-1 border-amber-200 dark:border-amber-800">
                        {cond}
                        <button
                          onClick={() => {
                            const newConds = selectedStep.conditions.filter((_, i) => i !== idx);
                            updateStep(selectedStep.id, { conditions: newConds });
                          }}
                          className="hover:text-destructive transition-colors"
                        >
                          <Trash2 className="size-2.5" />
                        </button>
                      </Badge>
                    ))}
                    <Input
                      placeholder="Add condition..."
                      className="h-7 text-xs w-28"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            updateStep(selectedStep.id, { conditions: [...selectedStep.conditions, val] });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <Separator className="opacity-50" />

                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">{t('autoAdvance')}</Label>
                  <button
                    role="switch"
                    aria-checked={selectedStep.autoAdvance || false}
                    onClick={() => updateStep(selectedStep.id, { autoAdvance: !selectedStep.autoAdvance })}
                    className={cn(
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                      selectedStep.autoAdvance ? 'bg-emerald-500' : 'bg-muted'
                    )}
                  >
                    <span className={cn(
                      'pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                      selectedStep.autoAdvance ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0'
                    )} />
                  </button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t('slaTimeLimit')} (hours)</Label>
                  <Input
                    type="number"
                    value={selectedStep.slaHours || ''}
                    onChange={(e) => updateStep(selectedStep.id, { slaHours: parseInt(e.target.value) || undefined })}
                    placeholder="e.g., 48"
                    className="h-9 text-sm"
                    min={1}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <GitBranch className="size-8 mb-2 opacity-30" />
                <p className="text-sm">Select a step to edit</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
