"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Bot,
  CheckSquare,
  ClipboardList,
  FileCheck2,
  FilePenLine,
  FileText,
  FolderKanban,
  GraduationCap,
  HardHat,
  Key,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MapPin,
  Menu,
  PenTool,
  Puzzle,
  Receipt,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldHalf,
  UserCheck,
  Users,
  Workflow,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { clearClientSessionData } from "@/lib/client-session-cleanup";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useRole } from "@/hooks/useRole";
import { OrganizationSwitcher } from "./OrganizationSwitcher";

interface SidebarProps {
  className?: string;
}

const navSections = [
  {
    labelKey: "dashboard",
    items: [
      { key: "dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { key: "licenses", icon: Shield, href: "/licenses" },
      { key: "calendar", icon: FileText, href: "/licenses/calendar" },
      { key: "projects", icon: FolderKanban, href: "/projects" },
    ],
  },
  {
    labelKey: "compliance",
    items: [
      { key: "insurance", icon: ShieldHalf, href: "/insurance" },
      { key: "subcontractors", icon: HardHat, href: "/subcontractors" },
      { key: "qualifiers", icon: UserCheck, href: "/qualifiers" },
      { key: "ceTracking", icon: GraduationCap, href: "/ce-tracking" },
      { key: "exams", icon: FileCheck2, href: "/exams" },
      { key: "checklists", icon: ListChecks, href: "/checklists" },
      { key: "compliance", icon: Shield, href: "/compliance" },
    ],
  },
  {
    labelKey: "approvals",
    items: [
      { key: "team", icon: Users, href: "/team", requireManage: true },
      { key: "approvals", icon: CheckSquare, href: "/approvals" },
      { key: "workflows", icon: Workflow, href: "/workflows" },
      { key: "documents", icon: FilePenLine, href: "/documents/generate" },
      { key: "signatures", icon: PenTool, href: "/signatures" },
      { key: "reports", icon: Receipt, href: "/reports" },
      {
        key: "auditLog",
        icon: ClipboardList,
        href: "/audit-log",
        requireManage: true,
      },
    ],
  },
  {
    labelKey: "analytics",
    items: [
      { key: "aiChat", icon: Bot, href: "/ai-chat" },
      { key: "analytics", icon: BarChart3, href: "/analytics" },
      { key: "alerts", icon: Bell, href: "/alerts" },
      {
        key: "regulatoryAlerts",
        icon: ShieldAlert,
        href: "/regulatory-alerts",
      },
      { key: "stateRequirements", icon: MapPin, href: "/state-requirements" },
      { key: "reciprocity", icon: ArrowLeftRight, href: "/reciprocity" },
    ],
  },
  {
    labelKey: "settings",
    items: [
      { key: "settings", icon: Settings, href: "/settings" },
      { key: "integrations", icon: Puzzle, href: "/integrations" },
      {
        key: "apiAccess",
        icon: Key,
        href: "/settings/api",
        requireManage: true,
      },
      { key: "admin", icon: ShieldCheck, href: "/admin", requireAdmin: true },
    ],
  },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const { canManage, canAccessAdmin } = useRole();

  const visibleSections = useMemo(
    () =>
      navSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => {
            if ("requireAdmin" in item && item.requireAdmin && !canAccessAdmin) return false;
            if ("requireManage" in item && item.requireManage && !canManage) return false;
            return true;
          }),
        }))
        .filter((section) => section.items.length > 0),
    [canAccessAdmin, canManage],
  );

  const activeHref = useMemo(() => {
    return visibleSections
      .flatMap((section) => section.items)
      .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  }, [pathname, visibleSections]);

  const handleLogout = async () => {
    await clearClientSessionData();
    await signOut({ redirect: false });
    router.push("/");
  };

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || "U";
  const userName = session?.user?.name || "User";

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-950">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-200 px-4 dark:border-slate-800">
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600">
          <Shield className="size-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          LicenseVault
        </span>
      </div>

      <div className="border-b border-slate-200 p-3 dark:border-slate-800">
        <OrganizationSwitcher className="w-full" />
      </div>

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-4 px-2 py-3" aria-label="Primary navigation">
          {visibleSections.map((section) => (
            <div key={section.labelKey}>
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600">
                {t(section.labelKey)}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeHref === item.href;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors",
                      isActive
                        ? "bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{t(item.key)}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="shrink-0 border-t border-slate-200 px-3 py-2 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-7 shrink-0">
            <AvatarFallback className="bg-slate-100 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
              {userName}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            onClick={handleLogout}
            aria-label={t("logout")}
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
    <aside
      className={cn(
        "hidden h-screen w-[232px] shrink-0 flex-col border-r border-slate-200 lg:flex dark:border-slate-800",
        className,
      )}
    >
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar() {
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={locale === "ar" ? "right" : "left"}
        className="w-[280px] p-0"
      >
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
