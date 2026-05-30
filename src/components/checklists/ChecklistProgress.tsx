'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  completedAt?: string | null;
  completedBy?: string | null;
  required: boolean;
  category: string;
  order: number;
}

interface ChecklistProgressProps {
  items: ChecklistItem[];
  onToggle: (itemId: string) => void;
  dueDate?: string | null;
  completedCount: number;
  totalCount: number;
}

export function ChecklistProgress({
  items,
  onToggle,
  dueDate,
  completedCount,
  totalCount,
}: ChecklistProgressProps) {
  const t = useTranslations('checklists');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isOverdue = dueDate && new Date(dueDate) < new Date();
  const isDueSoon = dueDate && !isOverdue && (new Date(dueDate).getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000;

  // Group items by category
  const categories = items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    const cat = item.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t('progress')}</span>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{totalCount} {t('completed')}
          </span>
        </div>
        <Progress value={progress} className={cn(
          "h-2",
          progress === 100 && "[&>div]:bg-emerald-500",
          progress >= 50 && progress < 100 && "[&>div]:bg-teal-500",
          progress < 50 && "[&>div]:bg-amber-500",
        )} />
      </div>

      {/* Due date warning */}
      {(isOverdue || isDueSoon) && (
        <div className={cn(
          "flex items-center gap-2 p-2.5 rounded-lg text-sm",
          isOverdue ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" :
          "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
        )}>
          {isOverdue ? <AlertTriangle className="size-4" /> : <Clock className="size-4" />}
          <span>{isOverdue ? 'Overdue' : 'Due soon'}</span>
          {dueDate && <span className="text-xs opacity-75 ms-auto">{new Date(dueDate).toLocaleDateString()}</span>}
        </div>
      )}

      {/* Category sections */}
      {Object.entries(categories).map(([category, catItems]) => {
        const catCompleted = catItems.filter(i => i.completed).length;
        const isCollapsed = collapsedCategories.has(category);

        return (
          <div key={category} className="space-y-1">
            <button
              onClick={() => toggleCategory(category)}
              className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-muted/50 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium capitalize">{category}</span>
              <Badge variant="outline" className="text-[10px] ms-auto">
                {catCompleted}/{catItems.length}
              </Badge>
            </button>

            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {catItems.map(item => (
                    <motion.button
                      key={item.id}
                      onClick={() => onToggle(item.id)}
                      className={cn(
                        "flex items-center gap-3 w-full p-2 rounded-lg transition-all hover:bg-muted/30",
                        item.completed && "opacity-70"
                      )}
                      whileTap={{ scale: 0.99 }}
                      layout
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {item.completed ? (
                          <CheckCircle2 className="size-5 text-emerald-500" />
                        ) : (
                          <Circle className="size-5 text-muted-foreground/50" />
                        )}
                      </motion.div>
                      <span className={cn(
                        "text-sm flex-1 text-start",
                        item.completed && "line-through text-muted-foreground"
                      )}>
                        {item.label}
                      </span>
                      {item.required && !item.completed && (
                        <Badge variant="outline" className="text-[9px] bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800">
                          {t('required')}
                        </Badge>
                      )}
                      {item.required && item.completed && (
                        <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                          {t('required')}
                        </Badge>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
