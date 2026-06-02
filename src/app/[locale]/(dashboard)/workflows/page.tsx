'use client';

import { useTranslations } from 'next-intl';
import { Plus, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useWorkflows } from './components/useWorkflows';
import { StatsCards } from './components/StatsCards';
import { DefinitionsTab } from './components/DefinitionsTab';
import { InstancesTab } from './components/InstancesTab';
import { BuilderDialog } from './components/BuilderDialog';
import { StartWorkflowDialog } from './components/StartWorkflowDialog';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';

export default function WorkflowsPage() {
  const t = useTranslations('workflows');
  const w = useWorkflows(t);

  if (w.loading) {
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
            onClick={() => w.setStartDialogOpen(true)}
            className="border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400"
          >
            <Play className="size-4 me-2" />
            {t('startWorkflow')}
          </Button>
          <Button
            size="sm"
            onClick={() => w.openCreateBuilder()}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm"
          >
            <Plus className="size-4 me-2" />
            {t('createWorkflow')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={w.stats} />

      {/* Tabs */}
      <Tabs value={w.activeTab} onValueChange={w.setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="definitions">{t('definitions')}</TabsTrigger>
          <TabsTrigger value="instances">
            {t('activeWorkflows')}
            {w.instanceCounts.active > 0 && (
              <Badge className="ms-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0">
                {w.instanceCounts.active}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="definitions" className="mt-4">
          <DefinitionsTab
            definitions={w.definitions}
            onCreate={() => w.openCreateBuilder()}
            onCreateFromTemplate={(tpl) => w.openCreateBuilder(tpl)}
            onEdit={(def) => w.openEditBuilder(def)}
            onToggleActive={(id, isActive) => w.toggleActive(id, isActive)}
            onDelete={(id) => w.setDeleteId(id)}
            onStart={(id) => { w.setStartDefId(id); w.setStartDialogOpen(true); }}
          />
        </TabsContent>

        <TabsContent value="instances" className="mt-4">
          <InstancesTab
            instances={w.instances}
            onCancel={(id) => w.cancelInstance(id)}
            onGoToDefinitions={() => w.setActiveTab('definitions')}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BuilderDialog
        open={w.builderOpen}
        onOpenChange={w.setBuilderOpen}
        editingId={w.editingId}
        name={w.builderName}
        onNameChange={w.setBuilderName}
        desc={w.builderDesc}
        onDescChange={w.setBuilderDesc}
        category={w.builderCategory}
        onCategoryChange={w.setBuilderCategory}
        trigger={w.builderTrigger}
        onTriggerChange={w.setBuilderTrigger}
        steps={w.builderSteps}
        onStepsChange={w.setBuilderSteps}
        selectedStepId={w.selectedStepId}
        onSelectStep={w.setSelectedStepId}
        onSave={w.saveWorkflow}
      />

      <StartWorkflowDialog
        open={w.startDialogOpen}
        onOpenChange={w.setStartDialogOpen}
        definitions={w.definitions}
        defId={w.startDefId}
        onDefIdChange={w.setStartDefId}
        entityType={w.startEntityType}
        onEntityTypeChange={w.setStartEntityType}
        entityId={w.startEntityId}
        onEntityIdChange={w.setStartEntityId}
        onStart={w.startWorkflow}
      />

      <DeleteConfirmDialog
        open={!!w.deleteId}
        onOpenChange={() => w.setDeleteId(null)}
        onConfirm={() => w.deleteId && w.deleteWorkflow(w.deleteId)}
      />
    </div>
  );
}
