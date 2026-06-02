import { useTranslations } from 'next-intl';
import { Plus, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ChecklistTemplate } from './types';
import { TemplateCard } from './TemplateCard';

export function TemplatesTab({ templates, onCreate, onEdit, onNewInstance, onDelete }: {
  templates: ChecklistTemplate[];
  onCreate: () => void;
  onEdit: (t: ChecklistTemplate) => void;
  onNewInstance: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations('checklists');

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onCreate} className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          <Plus className="size-4" />
          {t('createTemplate')}
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12">
            <LayoutTemplate className="size-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">{t('noTemplates')}</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">{t('noTemplatesDesc')}</p>
            <Button variant="outline" onClick={onCreate} className="mt-4 gap-2">
              <Plus className="size-4" />
              {t('createTemplate')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template, idx) => (
            <TemplateCard
              key={template.id}
              template={template}
              index={idx}
              onEdit={onEdit}
              onNewInstance={onNewInstance}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
