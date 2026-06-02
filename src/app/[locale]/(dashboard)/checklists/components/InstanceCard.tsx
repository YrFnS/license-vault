import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, Eye, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { categoryColors } from './types';
import type { ChecklistInstance } from './types';

export function InstanceCard({ inst, index, onView }: {
  inst: ChecklistInstance;
  index: number;
  onView: (inst: ChecklistInstance) => void;
}) {
  const progress = inst.totalCount > 0 ? (inst.completedCount / inst.totalCount) * 100 : 0;
  const isOverdue = inst.dueDate && new Date(inst.dueDate) < new Date() && inst.status === 'in_progress';
  const isCompleted = inst.status === 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => onView(inst)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              "flex items-center justify-center size-10 rounded-xl shrink-0",
              isCompleted ? "bg-emerald-100 dark:bg-emerald-900/30" :
              isOverdue ? "bg-red-100 dark:bg-red-900/30" :
              "bg-amber-100 dark:bg-amber-900/30"
            )}>
              {isCompleted ? (
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
              ) : isOverdue ? (
                <XCircle className="size-5 text-red-600 dark:text-red-400" />
              ) : (
                <Clock className="size-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">{inst.title}</h3>
                <Badge variant="outline" className="text-[10px] capitalize">{inst.entityType}</Badge>
                {inst.template && (
                  <Badge className={cn("text-[10px]", categoryColors[inst.template.category] || categoryColors.general)}>
                    {inst.template.name}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Progress value={progress} className="flex-1 h-1.5" />
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {inst.completedCount}/{inst.totalCount}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                {inst.dueDate && (
                  <span className={cn(isOverdue && "text-red-500 font-medium")}>
                    <Calendar className="size-3 inline me-1" />
                    {isOverdue ? 'Overdue' : new Date(inst.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
