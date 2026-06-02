'use client';

import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WorkflowDefinitionData } from './types';

interface StartWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  definitions: WorkflowDefinitionData[];
  defId: string;
  onDefIdChange: (v: string) => void;
  entityType: string;
  onEntityTypeChange: (v: string) => void;
  entityId: string;
  onEntityIdChange: (v: string) => void;
  onStart: () => void;
}

export function StartWorkflowDialog({
  open, onOpenChange, definitions, defId, onDefIdChange,
  entityType, onEntityTypeChange, entityId, onEntityIdChange, onStart,
}: StartWorkflowDialogProps) {
  const t = useTranslations('workflows');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('startWorkflow')}</DialogTitle>
          <DialogDescription>Start a new workflow instance from a definition</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">{t('selectDefinition')}</Label>
            <Select value={defId} onValueChange={onDefIdChange}>
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
            <Select value={entityType} onValueChange={onEntityTypeChange}>
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
              value={entityId}
              onChange={(e) => onEntityIdChange(e.target.value)}
              placeholder="Entity ID..."
              className="h-9 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button
            onClick={onStart}
            disabled={!defId}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
          >
            <Play className="size-4 me-2" />
            {t('startWorkflow')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
