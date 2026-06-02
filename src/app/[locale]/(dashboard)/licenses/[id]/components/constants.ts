import {
  Plus,
  Pencil,
  Trash2,
  Download,
  Activity,
} from 'lucide-react';
import type { ActivityConfig } from './types';

export const ACTIVITY_CONFIG: Record<string, ActivityConfig> = {
  LICENSE_CREATED: {
    icon: Plus,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  LICENSE_UPDATED: {
    icon: Pencil,
    iconColor: 'text-teal-600 dark:text-teal-400',
    dotColor: 'bg-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
  },
  LICENSE_DELETED: {
    icon: Trash2,
    iconColor: 'text-red-600 dark:text-red-400',
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  LICENSE_EXPORTED: {
    icon: Download,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    dotColor: 'bg-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
  },
};

export const DEFAULT_ACTIVITY_CONFIG: ActivityConfig = {
  icon: Activity,
  iconColor: 'text-muted-foreground',
  dotColor: 'bg-muted-foreground',
  bgColor: 'bg-muted/50',
};
