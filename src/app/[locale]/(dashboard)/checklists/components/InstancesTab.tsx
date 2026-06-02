import { useTranslations } from 'next-intl';
import { Plus, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ChecklistInstance } from './types';
import { InstanceCard } from './InstanceCard';

export function InstancesTab({ instances, onCreate, onView }: {
  instances: ChecklistInstance[];
  onCreate: () => void;
  onView: (inst: ChecklistInstance) => void;
}) {
  const t = useTranslations('checklists');

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onCreate} className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          <Plus className="size-4" />
          {t('newFromTemplate')}
        </Button>
      </div>

      {instances.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12">
            <ClipboardList className="size-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">{t('noInstances')}</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">{t('noInstancesDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {instances.map((inst, idx) => (
            <InstanceCard key={inst.id} inst={inst} index={idx} onView={onView} />
          ))}
        </div>
      )}
    </div>
  );
}
