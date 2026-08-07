"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import { Globe, LogOut, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { clearClientSessionData } from "@/lib/client-session-cleanup";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationDrawer } from "./NotificationDrawer";
import { GlobalSearchDialog } from "./GlobalSearchDialog";
import { MobileSidebar } from "./Sidebar";

const routeLabels: Record<string, string> = {
  dashboard: "dashboard",
  licenses: "licenses",
  calendar: "calendar",
  projects: "projects",
  insurance: "insurance",
  subcontractors: "subcontractors",
  qualifiers: "qualifiers",
  "ce-tracking": "ceTracking",
  exams: "exams",
  checklists: "checklists",
  compliance: "compliance",
  team: "team",
  approvals: "approvals",
  workflows: "workflows",
  documents: "documents",
  signatures: "signatures",
  reports: "reports",
  "audit-log": "auditLog",
  "ai-chat": "aiChat",
  analytics: "analytics",
  alerts: "alerts",
  "regulatory-alerts": "regulatoryAlerts",
  "state-requirements": "stateRequirements",
  reciprocity: "reciprocity",
  settings: "settings",
  integrations: "integrations",
  admin: "admin",
};

function humanizeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  } catch {
    return segment;
  }
}

export function TopNav() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = async () => {
    await clearClientSessionData();
    await signOut({ redirect: false });
    router.push("/");
  };

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || "U";
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => ({
    segment,
    href: `/${segments.slice(0, index + 1).join("/")}`,
    isLast: index === segments.length - 1,
    labelKey: routeLabels[segment],
  }));

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    const handleOpenSearch = () => setSearchOpen(true);

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-search", handleOpenSearch);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-search", handleOpenSearch);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-slate-200 bg-white px-3 md:gap-4 md:px-6 dark:border-slate-800 dark:bg-slate-950">
        <MobileSidebar />

        <div className="hidden min-w-0 flex-1 items-center gap-1.5 text-sm text-slate-500 md:flex">
          {breadcrumbs.map((crumb, index) => {
            const label = crumb.labelKey
              ? t(crumb.labelKey as Parameters<typeof t>[0])
              : humanizeSegment(crumb.segment);
            return (
              <span key={crumb.href} className="flex min-w-0 items-center gap-1.5">
                {index > 0 && <span className="text-slate-300 dark:text-slate-700">/</span>}
                {crumb.isLast ? (
                  <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                    {label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="truncate hover:text-slate-900 dark:hover:text-slate-100"
                  >
                    {label}
                  </Link>
                )}
              </span>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 w-48 items-center justify-start gap-2 border-slate-200 px-3 font-normal text-slate-600 sm:flex dark:border-slate-700"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="size-3.5" />
          <span className="text-xs">{tc("search")}</span>
          <kbd className="ms-auto hidden rounded border px-1 text-[10px] lg:inline">⌘K</kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 sm:hidden"
          onClick={() => setSearchOpen(true)}
          aria-label={tc("search")}
        >
          <Search className="size-4" />
        </Button>

        <div className="flex items-center gap-1">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <NotificationDrawer />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                aria-label={session?.user?.name || "Account"}
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-slate-100 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium">{session?.user?.name || "User"}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{session?.user?.email || ""}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer gap-2">
                <Link href="/settings">
                  <Settings className="size-4" />
                  <span>{t("settings")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 md:hidden"
                onClick={() => switchLocale(locale === "en" ? "ar" : "en")}
              >
                <Globe className="size-4" />
                <span>{locale === "en" ? tc("arabic") : tc("english")}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                <span>{t("logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
