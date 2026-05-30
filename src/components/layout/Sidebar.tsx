'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import {
  LayoutDashboard,
  Shield,
  Bot,
  Users,
  Bell,
  Settings,
  ShieldCheck,
  Upload,
  MapPin,
  ClipboardList,
  CalendarDays,
  HelpCircle,
  LogOut,
  GraduationCap,
  ShieldHalf,
  FileText,
  ArrowLeftRight,
  UserCheck,
  FolderKanban,
  CheckSquare,
  Workflow,
  Key,
  HardHat,
  ShieldAlert,
  BarChart3,
  Zap,
  Building2,
  ScanSearch,
  FileCheck2,
  ListChecks,
  FilePenLine,
  Puzzle,
  PenTool,
  Palette,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';
import { useRole } from '@/hooks/useRole';

interface SidebarProps {
  className?: string;
}

const navSections = [
  {
    key: 'main',
    items: [
      { key: 'dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { key: 'licenses', icon: Shield, href: '/licenses' },
      { key: 'calendar', icon: CalendarDays, href: '/licenses/calendar' },
      { key: 'projects', icon: FolderKanban, href: '/projects' },
      { key: 'licenseApplications', icon: FileCheck2, href: '/license-applications' },
      { key: 'exams', icon: GraduationCap, href: '/exams' },
      { key: 'import', icon: Upload, href: '/import' },
    ],
  },
  {
    key: 'tools',
    items: [
      { key: 'aiChat', icon: Bot, href: '/ai-chat' },
      { key: 'documentScanner', icon: ScanSearch, href: '/documents/scan' },
      { key: 'documentGenerator', icon: FilePenLine, href: '/documents/generate' },
      { key: 'regulatoryAlerts', icon: ShieldAlert, href: '/regulatory-alerts' },
      { key: 'boardSubmissions', icon: Send, href: '/board-submissions' },
      { key: 'analytics', icon: BarChart3, href: '/analytics' },
      { key: 'stateRequirements', icon: MapPin, href: '/state-requirements' },
      { key: 'reciprocity', icon: ArrowLeftRight, href: '/reciprocity' },
      { key: 'insurance', icon: ShieldHalf, href: '/insurance' },
      { key: 'ceTracking', icon: GraduationCap, href: '/ce-tracking' },
      { key: 'checklists', icon: ListChecks, href: '/checklists' },
      { key: 'alerts', icon: Bell, href: '/alerts' },
      { key: 'notifications', icon: Bell, href: '/notifications' },
    ],
  },
  {
    key: 'management',
    items: [
      { key: 'team', icon: Users, href: '/team' },
      { key: 'qualifiers', icon: UserCheck, href: '/qualifiers' },
      { key: 'businessEntities', icon: Building2, href: '/business-entities' },
      { key: 'signatures', icon: PenTool, href: '/signatures' },
      { key: 'integrations', icon: Puzzle, href: '/integrations' },
      { key: 'approvals', icon: CheckSquare, href: '/approvals' },
      { key: 'workflows', icon: Workflow, href: '/workflows' },
      { key: 'subcontractors', icon: HardHat, href: '/subcontractors' },
      { key: 'vendorScores', icon: ShieldCheck, href: '/vendor-scores' },
      { key: 'contractorNetwork', icon: Users, href: '/contractor-network' },
      { key: 'apiAccess', icon: Key, href: '/settings/api' },
      { key: 'locations', icon: MapPin, href: '/settings/locations' },
      { key: 'settings', icon: Settings, href: '/settings' },
      { key: 'branding', icon: Palette, href: '/settings/branding' },
      { key: 'organization', icon: Building2, href: '/settings/organization' },
      { key: 'compliance', icon: Shield, href: '/compliance' },
      { key: 'reports', icon: FileText, href: '/reports' },
      { key: 'auditLog', icon: ClipboardList, href: '/audit-log' },
      { key: 'automation', icon: Zap, href: '/admin/automation' },
      { key: 'admin', icon: ShieldCheck, href: '/admin' },
      { key: 'security', icon: ShieldAlert, href: '/admin/security' },
    ],
  },
] as const;

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const ts = useTranslations('sidebar');
  const pathname = usePathname();
  const locale = useLocale();
  const { data: session } = useSession();
  const router = useRouter();
  const { canManage, canAccessAdmin } = useRole();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || 'U';
  const userName = session?.user?.name || 'User';
  const userEmail = session?.user?.email || '';

  return (
    <div className="flex flex-col h-full">
      {/* Top shimmer gradient line */}
      <div className="h-[2px] shrink-0 bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 shrink-0">
        <div className="flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
          <Shield className="size-4.5" />
        </div>
        <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">{tc('appName')}</span>
        <Badge className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-400/20 text-[10px] px-2 py-0.5 ms-auto hover:from-emerald-500/30 hover:to-teal-500/30 transition-all duration-200 font-bold">
          ✦ Pro
        </Badge>
      </div>
      <Separator className="opacity-50" />

      {/* Nav Links with sections */}
      <ScrollArea className="flex-1 py-3">
        <nav className="flex flex-col gap-1 px-2">
          {navSections.map((section, sectionIdx) => {
            // Filter items based on role
            const filteredItems = section.items.filter((item) => {
              if (item.key === 'admin' && !canAccessAdmin) return false;
              if (item.key === 'import' && !canManage) return false;
              if (item.key === 'team' && !canManage) return false;
              if (item.key === 'auditLog' && !canManage) return false;
              if (item.key === 'apiAccess' && !canManage) return false;
              if (item.key === 'organization' && !canManage) return false;
              if (item.key === 'automation' && !canAccessAdmin) return false;
              if (item.key === 'security' && !canAccessAdmin) return false;
              return true;
            });

            if (filteredItems.length === 0) return null;

            return (
            <div key={section.key}>
              {/* Section label */}
              <p className={cn(
                "px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50",
                sectionIdx > 0 && "mt-4"
              )}>
                {ts(section.key)}
              </p>
              {/* Section items */}
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={onLinkClick}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm shadow-emerald-500/5'
                        : 'text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground'
                    )}
                  >
                    {/* Active indicator bar on start side */}
                    {isActive && (
                      <div className="absolute start-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-e-full bg-gradient-to-b from-emerald-500 to-teal-500 border-e border-emerald-400/30" />
                    )}
                    {/* Hover indicator bar */}
                    {!isActive && (
                      <div className="absolute start-0 top-1/2 -translate-y-1/2 w-[3px] h-0 rounded-e-full bg-emerald-500/30 group-hover:h-4 transition-all duration-200" />
                    )}
                    <Icon className={cn(
                      'size-4 shrink-0 transition-all duration-200',
                      isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/70 group-hover:text-foreground group-hover:scale-105'
                    )} />
                    <span className="transition-all duration-200">{t(item.key)}</span>
                  </Link>
                );
              })}
              {sectionIdx < navSections.length - 1 && (
                <Separator className="mt-3 mx-3 opacity-40" />
              )}
            </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom section: Help + User */}
      <div className="shrink-0 border-t border-border/50">
        {/* Help link */}
        <div className="px-2 pt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              {/* Configure NEXT_PUBLIC_HELP_URL env var for production help docs URL */}
              <a
                href={process.env.NEXT_PUBLIC_HELP_URL || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground transition-all duration-200"
              >
                <HelpCircle className="size-4 shrink-0" />
                <span>{ts('helpSupport')}</span>
              </a>
            </TooltipTrigger>
            <TooltipContent side={locale === 'ar' ? 'left' : 'right'}>
              {ts('helpSupportTooltip')}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* User info with gradient card */}
        <div className="px-2 pb-2">
          <div className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 bg-gradient-to-r from-muted/60 to-muted/30 border border-border/30 overflow-hidden">
            {/* Subtle gradient accent */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5" />
            <div className="relative flex items-center gap-3 w-full">
              <Avatar className="size-8 shrink-0 ring-2 ring-emerald-500/20">
                <AvatarFallback className="text-xs bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-400 font-bold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-[11px] text-muted-foreground/80 truncate">{userEmail}</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                    onClick={handleLogout}
                  >
                    <LogOut className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={locale === 'ar' ? 'left' : 'right'}>
                  {t('logout')}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-e bg-gradient-to-b from-sidebar via-sidebar to-sidebar/98 h-screen w-64 shrink-0 relative',
          className
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

export function MobileSidebar() {
  const tc = useTranslations('common');
  const locale = useLocale();

  // For RTL, Sheet comes from the end (right in LTR = left in RTL)
  const sheetSide = locale === 'ar' ? 'left' : 'right';

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <LayoutDashboard className="size-5" />
          <span className="sr-only">{tc('appName')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side={sheetSide} className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{tc('appName')}</SheetTitle>
        </SheetHeader>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
}
