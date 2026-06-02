import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ChecklistProgress } from '@/components/checklists/ChecklistProgress';
import type { ChecklistInstance } from './types';

export function ViewInstanceDialog({
  open, onOpenChange, viewInstance, onToggle, onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  viewInstance: ChecklistInstance | null;
  onToggle: (itemId: string) => void;
  onDelete: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {viewInstance?.title || 'Checklist'}
            {viewInstance && (
              <Badge variant="outline" className="text-[10px] capitalize">{viewInstance.status.replace('_', ' ')}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        {viewInstance && (() => {
          let items: any[] = [];
          try { items = JSON.parse(viewInstance.items); } catch {}
          return (
            <ChecklistProgress
              items={items}
              onToggle={onToggle}
              completedCount={viewInstance.completedCount}
              totalCount={viewInstance.totalCount}
              dueDate={viewInstance.dueDate}
            />
          );
        })()}
        <DialogFooter className="gap-2">
          {viewInstance?.status === 'in_progress' && (
            <Button variant="destructive" size="sm" onClick={onDelete} className="gap-1">
              <Trash2 className="size-3.5" />
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
