import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { ChecklistTemplate } from './types';

export function InstanceDialog({
  open, onOpenChange, templates, instanceForm, setInstanceForm,
  creatingInstance, onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  templates: ChecklistTemplate[];
  instanceForm: { templateId: string; title: string; entityType: string; dueDate: string };
  setInstanceForm: (f: { templateId: string; title: string; entityType: string; dueDate: string } | ((prev: { templateId: string; title: string; entityType: string; dueDate: string }) => { templateId: string; title: string; entityType: string; dueDate: string })) => void;
  creatingInstance: boolean;
  onCreate: () => void;
}) {
  const t = useTranslations('checklists');
  const tc = useTranslations('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{t('newFromTemplate')}</DialogTitle>
          <DialogDescription>Create a checklist from an existing template</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Template *</Label>
            <Select value={instanceForm.templateId} onValueChange={v => {
              const tmpl = templates.find(tmpl => tmpl.id === v);
              setInstanceForm(f => ({ ...f, templateId: v, title: tmpl?.name || f.title }));
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(tmpl => (
                  <SelectItem key={tmpl.id} value={tmpl.id}>{tmpl.name}</SelectItem>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc('cancel')}</Button>
          <Button onClick={onCreate} disabled={creatingInstance} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white gap-2">
            {creatingInstance && <Loader2 className="size-4 animate-spin" />}
            {tc('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
