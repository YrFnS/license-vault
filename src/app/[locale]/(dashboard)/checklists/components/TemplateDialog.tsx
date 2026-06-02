import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Separator } from '@/components/ui/separator';
import { ChecklistEditor } from '@/components/checklists/ChecklistEditor';
import type { TemplateItem, ChecklistTemplate } from './types';

export function TemplateDialog({
  open, onOpenChange, editingTemplate, templateForm, setTemplateForm,
  templateItems, setTemplateItems, savingTemplate, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingTemplate: ChecklistTemplate | null;
  templateForm: { name: string; description: string; category: string };
  setTemplateForm: (f: { name: string; description: string; category: string } | ((prev: { name: string; description: string; category: string }) => { name: string; description: string; category: string })) => void;
  templateItems: TemplateItem[];
  setTemplateItems: (items: TemplateItem[]) => void;
  savingTemplate: boolean;
  onSave: () => void;
}) {
  const t = useTranslations('checklists');
  const tc = useTranslations('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc('cancel')}</Button>
          <Button onClick={onSave} disabled={savingTemplate} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white gap-2">
            {savingTemplate && <Loader2 className="size-4 animate-spin" />}
            {tc('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
