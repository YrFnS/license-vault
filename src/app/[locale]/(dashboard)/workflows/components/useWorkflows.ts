'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { WorkflowStep } from '@/components/workflows/WorkflowBuilder';
import type { WorkflowDefinitionData, WorkflowInstanceData, Stats, InstanceCounts } from './types';

type TranslateFn = (key: string) => string;

export function useWorkflows(t: TranslateFn) {
  const [definitions, setDefinitions] = useState<WorkflowDefinitionData[]>([]);
  const [instances, setInstances] = useState<WorkflowInstanceData[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, runningInstances: 0, completed: 0 });
  const [instanceCounts, setInstanceCounts] = useState<InstanceCounts>({ active: 0, completed: 0, cancelled: 0, failed: 0 });
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
    setBuilderSteps([]);
    setBuilderOpen(true);
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

  return {
    // Data
    definitions, instances, stats, instanceCounts, loading, activeTab, setActiveTab,
    // Builder state
    builderOpen, setBuilderOpen, editingId, builderName, setBuilderName,
    builderDesc, setBuilderDesc, builderCategory, setBuilderCategory,
    builderTrigger, setBuilderTrigger, builderSteps, setBuilderSteps,
    selectedStepId, setSelectedStepId,
    // Start dialog state
    startDialogOpen, setStartDialogOpen, startDefId, setStartDefId,
    startEntityType, setStartEntityType, startEntityId, setStartEntityId,
    // Delete state
    deleteId, setDeleteId,
    // Actions
    fetchData, openCreateBuilder, openEditBuilder, saveWorkflow,
    deleteWorkflow, toggleActive, startWorkflow, cancelInstance,
  };
}

export type WorkflowsHook = ReturnType<typeof useWorkflows>;
