'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle2, XCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { WorkflowInstanceData } from './types';

interface InstancesTabProps {
  instances: WorkflowInstanceData[];
  onCancel: (id: string) => void;
  onGoToDefinitions: () => void;
}

function getStatusDisplay(status: string) {
  switch (status) {
    case 'completed':
      return { Icon: CheckCircle2, color: 'text-emerald-500' };
    case 'failed':
      return { Icon: XCircle, color: 'text-red-500' };
    case 'cancelled':
      return { Icon: AlertCircle, color: 'text-amber-500' };
    default:
      return { Icon: Clock, color: 'text-teal-500' };
  }
}

export function InstancesTab({ instances, onCancel, onGoToDefinitions }: InstancesTabProps) {
  const t = useTranslations('workflows');

  if (instances.length === 0) {
    return (
      <Card className="border-dashed border-border/60">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="size-12 rounded-full bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center mb-3">
            <Play className="size-6 text-teal-500" />
          </div>
          <p className="text-sm font-medium mb-1">{t('noActiveWorkflows')}</p>
          <p className="text-xs text-muted-foreground mb-4">{t('noActiveWorkflowsDesc')}</p>
          <Button size="sm" variant="outline" onClick={onGoToDefinitions}>
            {t('definitions')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {instances.map((inst, idx) => {
          const progress = inst.definition.totalSteps > 0
            ? Math.round((inst.currentStep / inst.definition.totalSteps) * 100)
            : 0;
          const { Icon: StatusIcon, color: statusColor } = getStatusDisplay(inst.status);

          return (
            <motion.div
              key={inst.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 flex items-center justify-center shrink-0">
                        <StatusIcon className={cn('size-5', statusColor)} />
                      </div>
                      <div className="min-w-0">
                        <Link href={`/workflows/${inst.id}`} className="text-sm font-semibold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate block">
                          {inst.definition.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] py-0">
                            {inst.entityType}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {t('stepProgress')}: {inst.currentStep}/{inst.definition.totalSteps}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-24 sm:w-32">
                        <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' as const }}
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 text-center">{progress}%</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Link href={`/workflows/${inst.id}`}>
                          <Button variant="ghost" size="icon" className="size-8 hover:text-emerald-600">
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                        {inst.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 hover:text-destructive"
                            onClick={() => onCancel(inst.id)}
                          >
                            <XCircle className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
