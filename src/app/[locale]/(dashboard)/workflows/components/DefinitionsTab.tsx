'use client';

import { AnimatePresence } from 'framer-motion';
import { Workflow, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';
import type { WorkflowDefinitionData } from './types';
import { WorkflowCard } from './WorkflowCard';

interface DefinitionsTabProps {
  definitions: WorkflowDefinitionData[];
  onCreate: () => void;
  onCreateFromTemplate: (template: string) => void;
  onEdit: (def: WorkflowDefinitionData) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onStart: (id: string) => void;
}

const templates = [
  { key: 'license_renewal', emoji: '🔄' },
  { key: 'onboarding', emoji: '📋' },
  { key: 'audit', emoji: '🔍' },
];

export function DefinitionsTab({
  definitions, onCreate, onCreateFromTemplate, onEdit, onToggleActive, onDelete, onStart,
}: DefinitionsTabProps) {
  const t = useTranslations('workflows');

  if (definitions.length === 0) {
    return (
      <Card className="border-dashed border-border/60">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="size-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-3">
            <Workflow className="size-6 text-emerald-500" />
          </div>
          <p className="text-sm font-medium mb-1">{t('noWorkflows')}</p>
          <p className="text-xs text-muted-foreground mb-4">{t('noWorkflowsDesc')}</p>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={onCreate} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <Plus className="size-4 me-2" />
              {t('createWorkflow')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onCreateFromTemplate('license_renewal')}>
              {t('fromTemplate')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {definitions.map((def, idx) => (
            <WorkflowCard
              key={def.id}
              def={def}
              index={idx}
              onEdit={onEdit}
              onToggleActive={onToggleActive}
              onDelete={onDelete}
              onStart={onStart}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Template Quick-Create */}
      <div className="mt-6">
        <Separator className="mb-4 opacity-50" />
        <p className="text-xs text-muted-foreground font-medium mb-3">{t('fromTemplate')}</p>
        <div className="flex flex-wrap gap-2">
          {templates.map((tpl) => (
            <Button
              key={tpl.key}
              variant="outline"
              size="sm"
              onClick={() => onCreateFromTemplate(tpl.key)}
              className="text-xs"
            >
              <span className="me-1.5">{tpl.emoji}</span>
              {t(`${tpl.key}Workflow`)}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}
