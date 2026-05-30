'use client';

import { useTranslations, useLocale } from 'next-intl';
import { signOut } from 'next-auth/react';
import { Settings, LogOut, Search, Command, Globe, Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileSidebar } from './Sidebar';
import { NotificationDrawer } from './NotificationDrawer';
import { GlobalSearchDialog } from './GlobalSearchDialog';
import { Link, useRouter, usePathname } from '@/i18n/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { useState, useEffect } from 'react';

const routeLabels: Record<string, string> = {
  dashboard: 'nav.dashboard',
  licenses: 'nav.licenses',
  'ai-chat': 'nav.aiChat',
  team: 'nav.team',
  alerts: 'nav.alerts',
  settings: 'nav.settings',
  admin: 'nav.admin',
  import: 'nav.import',
  locations: 'nav.locations',
};

export function TopNav() {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const tn = useTranslations('topNav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || 'U';

  // Build breadcrumb from pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  // Remove locale segment
  const segmentsWithoutLocale = pathSegments.filter(
    (seg) => seg !== 'en' && seg !== 'ar'
  );

  const breadcrumbs = segmentsWithoutLocale.map((segment, idx) => {
    const href = '/' + pathSegments.slice(0, pathSegments.indexOf(segment) + 1).join('/');
    const isLast = idx === segmentsWithoutLocale.length - 1;
    const labelKey = routeLabels[segment];
    return { segment, href, isLast, labelKey };
  });

  // Language switching
  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    // Listen for custom event from KeyboardShortcutsProvider
    const handleOpenSearch = () => {
      setSearchOpen(true);
    };
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-search', handleOpenSearch);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-search', handleOpenSearch);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/50 bg-gradient-to-r from-background/95 via-background/90 to-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 px-4 md:px-6">
        {/* Mobile menu */}
        <MobileSidebar />

        {/* Breadcrumbs */}
        <div className="hidden md:flex items-center gap-1.5 flex-1 min-w-0">
          <Breadcrumb>
            <BreadcrumbList className="text-sm">
              {breadcrumbs.map((crumb, idx) => {
                const label = crumb.labelKey ? t(crumb.labelKey.replace('nav.', '') as Parameters<typeof t>[0]) : crumb.segment;
                return (
                  <span key={crumb.segment} className="contents">
                    {idx > 0 && (
                      <BreadcrumbSeparator className="text-muted-foreground/40" />
                    )}
                    <BreadcrumbItem>
                      {crumb.isLast ? (
                        <BreadcrumbPage className="font-semibold text-foreground/90">
                          {label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild className="text-muted-foreground/70 hover:text-foreground transition-colors">
                          <Link href={crumb.href}>{label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Mobile: just show page title */}
        <div className="flex md:hidden flex-1 min-w-0">
          {breadcrumbs.length > 0 && (
            <span className="text-sm font-medium truncate">
              {breadcrumbs[breadcrumbs.length - 1].labelKey
                ? t(breadcrumbs[breadcrumbs.length - 1].labelKey!.replace('nav.', '') as Parameters<typeof t>[0])
                : breadcrumbs[breadcrumbs.length - 1].segment}
            </span>
          )}
        </div>

        {/* Search trigger - desktop only */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 text-muted-foreground/70 h-9 w-56 lg:w-64 justify-start px-3 font-normal bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-border transition-all duration-200"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="size-3.5 text-muted-foreground/50" />
          <span className="text-xs">{tc('search')}</span>
          <kbd className="pointer-events-none ms-auto inline-flex h-5 select-none items-center gap-1 rounded-md border bg-background/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/60 shadow-sm">
            <Command className="size-2.5" />K
          </kbd>
        </Button>

        {/* Mobile search button */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden size-8 hover:bg-muted/80 transition-all duration-200"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="size-4" />
          <span className="sr-only">{tc('search')}</span>
        </Button>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5">
          {/* Language Switcher - Desktop only */}
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>

          {/* Theme Toggle - Desktop only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden md:inline-flex size-8 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200">
                <Sun className="size-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute size-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
                <span className="sr-only">{tn('themeToggle')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                className="gap-2 cursor-pointer rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/30 focus:bg-emerald-50 dark:focus:bg-emerald-950/30"
                onClick={() => setTheme('light')}
              >
                <Sun className="size-4 text-amber-500" />
                <span>{tn('themeLight')}</span>
                {theme === 'light' && <span className="ms-auto text-emerald-500">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/30 focus:bg-emerald-50 dark:focus:bg-emerald-950/30"
                onClick={() => setTheme('dark')}
              >
                <Moon className="size-4 text-teal-600 dark:text-teal-400" />
                <span>{tn('themeDark')}</span>
                {theme === 'dark' && <span className="ms-auto text-emerald-500">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/30 focus:bg-emerald-50 dark:focus:bg-emerald-950/30"
                onClick={() => setTheme('system')}
              >
                <Monitor className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>{tn('themeSystem')}</span>
                {theme === 'system' && <span className="ms-auto text-emerald-500">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notification bell with drawer */}
          <NotificationDrawer />

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full size-9 hover:bg-muted/80 transition-all duration-200">
                <Avatar className="size-9 ring-2 ring-emerald-500/20 hover:ring-emerald-500/40 transition-all duration-200">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-emerald-700 dark:text-emerald-400 font-bold">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold">{session?.user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{session?.user?.email || ''}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="gap-2 cursor-pointer rounded-md">
                <Link href="/settings">
                  <Settings className="size-4" />
                  <span>{t('settings')}</span>
                </Link>
              </DropdownMenuItem>
              {/* Language switcher - inside dropdown (visible on mobile) */}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 cursor-pointer rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/30 md:hidden"
                onClick={() => switchLocale(locale === 'en' ? 'ar' : 'en')}
              >
                <Globe className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>{locale === 'en' ? tc('arabic') : tc('english')}</span>
              </DropdownMenuItem>
              {/* Theme toggle - inside dropdown (visible on mobile) */}
              <DropdownMenuItem
                className="gap-2 cursor-pointer rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/30 md:hidden"
                onClick={() => setTheme('light')}
              >
                <Sun className="size-4 text-amber-500" />
                <span>{tn('themeLight')}</span>
                {theme === 'light' && <span className="ms-auto text-emerald-500">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/30 md:hidden"
                onClick={() => setTheme('dark')}
              >
                <Moon className="size-4 text-teal-600 dark:text-teal-400" />
                <span>{tn('themeDark')}</span>
                {theme === 'dark' && <span className="ms-auto text-emerald-500">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/30 md:hidden"
                onClick={() => setTheme('system')}
              >
                <Monitor className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>{tn('themeSystem')}</span>
                {theme === 'system' && <span className="ms-auto text-emerald-500">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="md:hidden" />
              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-md"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                <span>{t('logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
