'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Plus, Upload, Bot, Bell } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { cn } from '@/lib/utils';

const ACTIONS = [
  { key: 'addLicense', icon: Plus, href: '/licenses/new', color: 'text-emerald-600 dark:text-emerald-400', requireManage: true },
  { key: 'importCsv', icon: Upload, href: '/import', color: 'text-sky-600 dark:text-sky-400', requireManage: true },
  { key: 'aiChat', icon: Bot, href: '/ai-chat', color: 'text-violet-600 dark:text-violet-400', requireManage: false },
  { key: 'viewAlerts', icon: Bell, href: '/alerts', color: 'text-amber-600 dark:text-amber-400', requireManage: false },
] as const;

export function QuickActions() {
  const t = useTranslations('dashboard');
  const { canManage } = useRole();

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {ACTIONS.filter(a => !a.requireManage || canManage).map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.key}
            href={action.href}
            className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Icon className={cn('size-4 shrink-0', action.color)} />
            <span className="truncate">{t(action.key)}</span>
          </Link>
        );
      })}
    </div>
  );
}
