"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  BarChart3,
  Bell,
  Bot,
  CheckSquare,
  ChevronDown,
  ClipboardList,
  FilePenLine,
  FolderKanban,
  GraduationCap,
  HardHat,
  Key,
  LayoutDashboard,
  LogOut,
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
import { useBrandingContext } from "@/components/branding/BrandingProvider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useRole } from "@/hooks/useRole";
import { OrganizationSwitcher } from "./OrganizationSwitcher";

interface SidebarProps {
  className?: string;
}

const navSections = [
  {
    labelKey: "workspace",
    items: [
      { key: "dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { key: "licenses", icon: Shield, href: "/licenses" },
      { key: "projects", icon: FolderKanban, href: "/projects" },
    ],
  },
  {
    labelKey: "complianceCenter",
    items: [
      { key: "compliance", icon: ShieldCheck, href: "/compliance" },
      { key: "insurance", icon: ShieldHalf, href: "/insurance" },
      { key: "subcontractors", icon: HardHat, href: "/subcontractors" },
      { key: "qualifiers", icon: UserCheck, href: "/qualifiers" },
      { key: "ceTracking", icon: GraduationCap, href: "/ce-tracking" },
    ],
  },
  {
    labelKey: "operations",
    items: [
      { key: "approvals", icon: CheckSquare, href: "/approvals" },
      { key: "workflows", icon: Workflow, href: "/workflows" },
      { key: "documents", icon: FilePenLine, href: "/documents/generate" },
      { key: "signatures", icon: PenTool, href: "/signatures" },
    ],
  },
  {
    labelKey: "insights",
    items: [
      { key: "alerts", icon: Bell, href: "/alerts" },
      {
        key: "regulatoryAlerts",
        icon: ShieldAlert,
        href: "/regulatory-alerts",
      },
      { key: "analytics", icon: BarChart3, href: "/analytics" },
      { key: "reports", icon: Receipt, href: "/reports" },
      { key: "aiChat", icon: Bot, href: "/ai-chat" },
    ],
  },
  {
    labelKey: "administration",
    items: [
      { key: "team", icon: Users, href: "/team", requireManage: true },
      { key: "integrations", icon: Puzzle, href: "/integrations" },
      { key: "settings", icon: Settings, href: "/settings" },
      {
        key: "apiAccess",
        icon: Key,
        href: "/settings/api",
        requireManage: true,
      },
      {
        key: "auditLog",
        icon: ClipboardList,
        href: "/audit-log",
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
  const branding = useBrandingContext();

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

  const activeHref = useMemo(
    () =>
      visibleSections
        .flatMap((section) => section.items)
        .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
        .sort((a, b) => b.href.length - a.href.length)[0]?.href,
    [pathname, visibleSections],
  );

  const activeSectionKey = useMemo(
    () =>
      visibleSections.find((section) =>
        section.items.some((item) => item.href === activeHref),
      )?.labelKey,
    [activeHref, visibleSections],
  );

  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(["workspace", "complianceCenter"]),
  );

  useEffect(() => {
    if (!activeSectionKey) return;
    setOpenSections((previous) => {
      if (previous.has(activeSectionKey)) return previous;
      const next = new Set(previous);
      next.add(activeSectionKey);
      return next;
    });
  }, [activeSectionKey]);

  const handleLogout = async () => {
    await clearClientSessionData();
    await signOut({ redirect: false });
    router.push("/");
  };

  const toggleSection = (key: string) => {
    setOpenSections((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || "U";
  const userName = session?.user?.name || "User";

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-950">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-800">
        <Avatar className="size-9 rounded-xl">
          <AvatarImage src={branding.logoUrl} alt={branding.displayName} className="object-cover" />
          <AvatarFallback
            className="rounded-xl text-white"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            <Shield className="size-4" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {branding.displayName}
          </p>
          {branding.tagline && (
            <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
              {branding.tagline}
            </p>
          )}
        </div>
      </div>

      <div className="border-b border-slate-200 p-3 dark:border-slate-800">
        <OrganizationSwitcher className="w-full" />
      </div>

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 px-2 py-3" aria-label="Primary navigation">
          {visibleSections.map((section) => {
            const sectionName = t(section.labelKey);
            const expanded = openSections.has(section.labelKey);

            return (
              <div key={section.labelKey} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggleSection(section.labelKey)}
                  aria-expanded={expanded}
                  aria-label={
                    expanded
                      ? t("collapseSection", { section: sectionName })
                      : t("expandSection", { section: sectionName })
                  }
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-900 dark:hover:text-slate-300"
                >
                  <span>{sectionName}</span>
                  <ChevronDown
                    className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
                  />
                </button>

                {expanded && (
                  <div className="space-y-0.5 pb-1">
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
                            "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors",
                            isActive
                              ? "bg-primary/10 font-medium text-primary"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                          )}
                        >
                          {isActive && (
                            <span
                              aria-hidden="true"
                              className="absolute inset-y-2 start-0 w-0.5 rounded-full"
                              style={{ backgroundColor: "var(--brand-primary)" }}
                            />
                          )}
                          <Icon className="size-4 shrink-0" />
                          <span>{t(item.key)}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="shrink-0 border-t border-slate-200 px-3 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-slate-100 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
              {userName}
            </p>
            <p className="truncate text-[10px] capitalize text-slate-400">
              {(session?.user as { role?: string } | undefined)?.role || "member"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
        "hidden h-screen w-[250px] shrink-0 flex-col border-r border-slate-200 lg:flex dark:border-slate-800",
        className,
      )}
    >
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 lg:hidden"
          aria-label={t("openNavigation")}
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={locale === "ar" ? "right" : "left"}
        className="w-[300px] p-0"
      >
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
