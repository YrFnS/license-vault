'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import {
  LayoutDashboard, Shield, Bot, Users, Bell, Settings,
  ShieldCheck, Upload, MapPin, ClipboardList, LogOut,
  GraduationCap, ShieldHalf, FileText, ArrowLeftRight,
  UserCheck, FolderKanban, CheckSquare, Workflow, Key,
  HardHat, ShieldAlert, BarChart3, Zap, Building2,
  ScanSearch, FileCheck2, ListChecks, FilePenLine,
  Puzzle, PenTool, Palette, Send, FileX2, Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';
import { useSession } from 'next-auth/react';
import { useRole } from '@/hooks/useRole';

interface SidebarProps {
  className?: string;
}

const navSections = [
  {
    label: 'Overview',
    items: [
      { key: 'dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { key: 'licenses', icon: Shield, href: '/licenses' },
      { key: 'calendar', icon: FileText, href: '/licenses/calendar' },
      { key: 'projects', icon: FolderKanban, href: '/projects' },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { key: 'insurance', icon: ShieldHalf, href: '/insurance' },
      { key: 'subcontractors', icon: HardHat, href: '/subcontractors' },
      { key: 'qualifiers', icon: UserCheck, href: '/qualifiers' },
      { key: 'ceTracking', icon: GraduationCap, href: '/ce-tracking' },
      { key: 'exams', icon: FileCheck2, href: '/exams' },
      { key: 'checklists', icon: ListChecks, href: '/checklists' },
      { key: 'compliance', icon: Shield, href: '/compliance' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { key: 'team', icon: Users, href: '/team', requireManage: true },
      { key: 'approvals', icon: CheckSquare, href: '/approvals' },
      { key: 'workflows', icon: Workflow, href: '/workflows' },
      { key: 'documents', icon: FilePenLine, href: '/documents/generate' },
      { key: 'signatures', icon: PenTool, href: '/signatures' },
      { key: 'reports', icon: Receipt, href: '/reports' },
      { key: 'auditLog', icon: ClipboardList, href: '/audit-log', requireManage: true },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { key: 'aiChat', icon: Bot, href: '/ai-chat' },
      { key: 'analytics', icon: BarChart3, href: '/analytics' },
      { key: 'alerts', icon: Bell, href: '/alerts' },
      { key: 'regulatoryAlerts', icon: ShieldAlert, href: '/regulatory-alerts' },
      { key: 'stateRequirements', icon: MapPin, href: '/state-requirements' },
      { key: 'reciprocity', icon: ArrowLeftRight, href: '/reciprocity' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { key: 'settings', icon: Settings, href: '/settings' },
      { key: 'integrations', icon: Puzzle, href: '/integrations' },
      { key: 'apiAccess', icon: Key, href: '/settings/api', requireManage: true },
      { key: 'admin', icon: ShieldCheck, href: '/admin', requireAdmin: true },
    ],
  },
] as const;

function SidebarContent() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const { canManage, canAccessAdmin } = useRole();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || 'U';
  const userName = session?.user?.name || 'User';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="size-8 rounded-lg bg-emerald-600 flex items-center justify-center">
          <Shield className="size-4 text-white" />
        </div>
        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">LicenseVault</span>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-4 px-2 py-3">
          {navSections.map((section) => {
            const items = section.items.filter((item) => {
              if ('requireAdmin' in item && item.requireAdmin && !canAccessAdmin) return false;
              if ('requireManage' in item && item.requireManage && !canManage) return false;
              return true;
            });
            if (items.length === 0) return null;

            return (
              <div key={section.label}>
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600">
                  {section.label}
                </p>
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded px-3 py-1.5 text-[13px] transition-colors',
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium border-l-2 border-emerald-500'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{t(item.key)}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User */}
      <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 px-3 py-2">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-7 shrink-0">
            <AvatarFallback className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{userName}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            onClick={handleLogout}
            title={t('logout')}
          >
            <LogOut className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside className={cn('hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-800 h-screen w-[220px] shrink-0', className)}>
      <SidebarContent />
    </aside>
  );
}
