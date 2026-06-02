'use client';

import { useTranslations } from 'next-intl';
import { Loader2, ListChecks, LayoutTemplate, ClipboardList } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChecklists } from './components/useChecklists';
import { StatsCards } from './components/StatsCards';
import { TemplatesTab } from './components/TemplatesTab';
import { InstancesTab } from './components/InstancesTab';
import { TemplateDialog } from './components/TemplateDialog';
import { InstanceDialog } from './components/InstanceDialog';
import { ViewInstanceDialog } from './components/ViewInstanceDialog';
import { DeleteDialog } from './components/DeleteDialog';

export default function ChecklistsPage() {
  const t = useTranslations('checklists');
  const hook = useChecklists();

  if (hook.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const handleNewInstanceFromTemplate = (templateId: string) => {
    hook.setInstanceForm({ templateId, title: '', entityType: 'license', dueDate: '' });
    hook.setInstanceDialogOpen(true);
  };

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
      <StatsCards instanceCounts={hook.instanceCounts} templatesCount={hook.templates.length} />

      {/* Tabs */}
      <Tabs value={hook.activeTab} onValueChange={hook.setActiveTab}>
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

        <TabsContent value="templates" className="space-y-4">
          <TemplatesTab
            templates={hook.templates}
            onCreate={hook.openNewTemplate}
            onEdit={hook.openEditTemplate}
            onNewInstance={handleNewInstanceFromTemplate}
            onDelete={(id) => hook.setDeleteTarget({ type: 'template', id })}
          />
        </TabsContent>

        <TabsContent value="instances" className="space-y-4">
          <InstancesTab
            instances={hook.instances}
            onCreate={() => hook.openCreateInstance('')}
            onView={hook.openViewInstance}
          />
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <TemplateDialog
        open={hook.templateDialogOpen}
        onOpenChange={hook.setTemplateDialogOpen}
        editingTemplate={hook.editingTemplate}
        templateForm={hook.templateForm}
        setTemplateForm={hook.setTemplateForm}
        templateItems={hook.templateItems}
        setTemplateItems={hook.setTemplateItems}
        savingTemplate={hook.savingTemplate}
        onSave={hook.handleSaveTemplate}
      />

      {/* Instance Dialog */}
      <InstanceDialog
        open={hook.instanceDialogOpen}
        onOpenChange={hook.setInstanceDialogOpen}
        templates={hook.templates}
        instanceForm={hook.instanceForm}
        setInstanceForm={hook.setInstanceForm}
        creatingInstance={hook.creatingInstance}
        onCreate={hook.handleCreateInstance}
      />

      {/* View Instance Dialog */}
      <ViewInstanceDialog
        open={hook.viewDialogOpen}
        onOpenChange={hook.setViewDialogOpen}
        viewInstance={hook.viewInstance}
        onToggle={(itemId) => hook.viewInstance && hook.handleToggleItem(hook.viewInstance.id, itemId)}
        onDelete={hook.handleDeleteFromDialog}
      />

      {/* Delete Alert Dialog */}
      <DeleteDialog
        deleteTarget={hook.deleteTarget}
        onOpenChange={() => hook.setDeleteTarget(null)}
        onConfirm={() => {
          if (hook.deleteTarget?.type === 'template') hook.handleDeleteTemplate(hook.deleteTarget.id);
          else if (hook.deleteTarget?.type === 'instance') hook.handleDeleteInstance(hook.deleteTarget.id);
          hook.setDeleteTarget(null);
        }}
      />
    </div>
  );
}
