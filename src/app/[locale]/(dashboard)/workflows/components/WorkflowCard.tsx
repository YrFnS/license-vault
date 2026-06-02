'use client';

import { motion } from 'framer-motion';
import { MoreHorizontal, Edit3, Power, Trash2, Play, GitBranch, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { WorkflowDefinitionData } from './types';
import { categoryColors } from './constants';

interface WorkflowCardProps {
  def: WorkflowDefinitionData;
  index: number;
  onEdit: (def: WorkflowDefinitionData) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onStart: (id: string) => void;
}

export function WorkflowCard({ def, index, onEdit, onToggleActive, onDelete, onStart }: WorkflowCardProps) {
  const t = useTranslations('workflows');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={cn(
        'border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden',
        !def.isActive && 'opacity-60'
      )}>
        <div className="absolute top-0 start-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold truncate">{def.name}</CardTitle>
              {def.description && (
                <CardDescription className="text-xs mt-1 line-clamp-2">{def.description}</CardDescription>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 shrink-0">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(def)}>
                  <Edit3 className="size-4 me-2" />
                  {t('editWorkflow')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleActive(def.id, def.isActive)}>
                  <Power className="size-4 me-2" />
                  {def.isActive ? t('deleteWorkflow') : t('activateWorkflow')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(def.id)}
                >
                  <Trash2 className="size-4 me-2" />
                  {t('deleteWorkflow')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn('text-[10px] border', categoryColors[def.category] || categoryColors.custom)}>
              {t(def.category)}
            </Badge>
            <Badge variant="outline" className="text-[10px] border-border/50">
              {t(def.triggerType)}
            </Badge>
            {!def.isActive && (
              <Badge variant="outline" className="text-[10px] border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                {t('inactive')}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <GitBranch className="size-3" />
              {def.steps.length} {t('steps')}
            </span>
            <span>v{def.version}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Play className="size-3 text-emerald-500" />
              {def._count?.activeInstances || 0} {t('running')}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3 text-teal-500" />
              {def._count?.completedInstances || 0} {t('completed')}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            onClick={() => onStart(def.id)}
            disabled={!def.isActive}
          >
            <Play className="size-3.5 me-2" />
            {t('startWorkflow')}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
