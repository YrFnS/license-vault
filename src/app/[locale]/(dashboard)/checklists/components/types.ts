export interface TemplateItem {
  id: string;
  label: string;
  required: boolean;
  category: string;
  order: number;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isDefault: boolean;
  isActive: boolean;
  items: string; // JSON
  createdAt: string;
  _count?: { instances: number };
}

export interface ChecklistInstance {
  id: string;
  templateId: string;
  entityType: string;
  entityId: string | null;
  title: string;
  status: string;
  items: string; // JSON
  completedCount: number;
  totalCount: number;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  template?: { name: string; category: string };
}

export interface InstanceCounts {
  total: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  completedThisMonth: number;
}

export const categoryColors: Record<string, string> = {
  general: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  onboarding: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  renewal: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  audit: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  custom: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
};
