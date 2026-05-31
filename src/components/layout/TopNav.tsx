'use client';

import { useTranslations, useLocale } from 'next-intl';
import { signOut } from 'next-auth/react';
import { Search, Settings, LogOut, Globe, Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationDrawer } from './NotificationDrawer';
import { GlobalSearchDialog } from './GlobalSearchDialog';
import { Link, useRouter, usePathname } from '@/i18n/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

const routeLabels: Record<string, string> = {
  dashboard: 'nav.dashboard',
  licenses: 'nav.licenses',
  'ai-chat': 'nav.aiChat',
  team: 'nav.team',
  alerts: 'nav.alerts',
  settings: 'nav.settings',
  subcontractors: 'nav.subcontractors',
  projects: 'nav.projects',
  insurance: 'nav.insurance',
  compliance: 'nav.compliance',
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

  const pathSegments = pathname.split('/').filter(Boolean);
  const segmentsWithoutLocale = pathSegments.filter((seg) => seg !== 'en' && seg !== 'ar');
  const breadcrumbs = segmentsWithoutLocale.map((segment, idx) => {
    const href = '/' + pathSegments.slice(0, pathSegments.indexOf(segment) + 1).join('/');
    const isLast = idx === segmentsWithoutLocale.length - 1;
    const labelKey = routeLabels[segment];
    return { segment, href, isLast, labelKey };
  });

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    const handleOpenSearch = () => setSearchOpen(true);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-search', handleOpenSearch);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-search', handleOpenSearch);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 md:px-6">
        {/* Breadcrumbs */}
        <div className="hidden md:flex items-center gap-1.5 flex-1 min-w-0 text-sm text-slate-500">
          {breadcrumbs.map((crumb, idx) => {
            const label = crumb.labelKey ? t(crumb.labelKey.replace('nav.', '') as Parameters<typeof t>[0]) : crumb.segment;
            return (
              <span key={crumb.segment} className="flex items-center gap-1.5">
                {idx > 0 && <span className="text-slate-300 dark:text-slate-700">/</span>}
                {crumb.isLast ? (
                  <span className="font-medium text-slate-900 dark:text-slate-100">{label}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-slate-900 dark:hover:text-slate-100">{label}</Link>
                )}
              </span>
            );
          })}
        </div>

        {/* Search */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 text-slate-400 h-8 w-56 justify-start px-3 font-normal border-slate-200 dark:border-slate-700"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="size-3.5" />
          <span className="text-xs">{tc('search')}</span>
        </Button>
        <Button variant="ghost" size="icon" className="sm:hidden size-8" onClick={() => setSearchOpen(true)}>
          <Search className="size-4" />
        </Button>

        <div className="flex items-center gap-1">
          <div className="hidden md:block"><LanguageSwitcher /></div>

          <NotificationDrawer />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full size-8">
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{session?.user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{session?.user?.email || ''}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                <Link href="/settings"><Settings className="size-4" /><span>{t('settings')}</span></Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 md:hidden" onClick={() => switchLocale(locale === 'en' ? 'ar' : 'en')}>
                <Globe className="size-4" /><span>{locale === 'en' ? tc('arabic') : tc('english')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600 cursor-pointer" onClick={handleLogout}>
                <LogOut className="size-4" /><span>{t('logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
