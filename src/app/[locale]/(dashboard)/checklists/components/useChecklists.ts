import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { ChecklistTemplate, ChecklistInstance, InstanceCounts, TemplateItem } from './types';

export function useChecklists() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [instances, setInstances] = useState<ChecklistInstance[]>([]);
  const [instanceCounts, setInstanceCounts] = useState<InstanceCounts>({
    total: 0, in_progress: 0, completed: 0, cancelled: 0, completedThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('templates');

  // Template dialog state
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: '', description: '', category: 'general' });
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([
    { id: '1', label: '', required: false, category: 'general', order: 0 },
  ]);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Instance dialog state
  const [instanceDialogOpen, setInstanceDialogOpen] = useState(false);
  const [instanceForm, setInstanceForm] = useState({ templateId: '', title: '', entityType: 'license', dueDate: '' });
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
    setTemplateForm({ name: template.name, description: template.description || '', category: template.category });
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
      const payload = { ...templateForm, items: JSON.stringify(validItems) };
      const url = editingTemplate ? `/api/checklists/templates/${editingTemplate.id}` : '/api/checklists/templates';
      const method = editingTemplate ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
  const openCreateInstance = (preselectedTemplateId = '') => {
    setInstanceForm({ templateId: preselectedTemplateId, title: '', entityType: 'license', dueDate: '' });
    setInstanceDialogOpen(true);
  };

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

  const handleDeleteFromDialog = () => {
    if (viewInstance) handleDeleteInstance(viewInstance.id);
  };

  return {
    templates, instances, instanceCounts, loading, activeTab, setActiveTab,
    templateDialogOpen, setTemplateDialogOpen, editingTemplate, templateForm, setTemplateForm,
    templateItems, setTemplateItems, savingTemplate,
    instanceDialogOpen, setInstanceDialogOpen, instanceForm, setInstanceForm, creatingInstance,
    viewInstance, viewDialogOpen, setViewDialogOpen,
    deleteTarget, setDeleteTarget,
    openNewTemplate, openEditTemplate, handleSaveTemplate, handleDeleteTemplate,
    openCreateInstance, handleCreateInstance, handleToggleItem, handleDeleteInstance,
    openViewInstance, handleDeleteFromDialog,
    templatesMutator: fetchTemplates,
    instancesMutator: fetchInstances,
  };
}
