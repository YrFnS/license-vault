'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { KeyboardShortcutsProvider } from '@/components/KeyboardShortcutsProvider';
import { RegisterSW } from '@/components/pwa/RegisterSW';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { PushNotificationPrompt } from '@/components/pwa/PushNotificationPrompt';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const { status } = useSession();
  const router = useRouter();
  const [sidebarHidden, setSidebarHidden] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  // Listen for sidebar toggle custom event (from keyboard shortcut)
  useEffect(() => {
    const handleToggleSidebar = () => {
      setSidebarHidden((prev) => !prev);
    };
    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    return () => window.removeEventListener('toggle-sidebar', handleToggleSidebar);
  }, []);

  // Show loading while checking auth status
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/40">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 -m-4 rounded-full bg-emerald-200/30 dark:bg-emerald-800/20 blur-xl" />
            <Loader2 className="relative size-8 animate-spin text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <KeyboardShortcutsProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar - on the start side (left for LTR, right for RTL) */}
        {!sidebarHidden && <Sidebar />}

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <TopNav />
          <main className="relative flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-muted/40 scroll-smooth">
            {/* Subtle dot pattern overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
              style={{
                backgroundImage: 'radial-gradient(circle, currentColor 0.8px, transparent 0.8px)',
                backgroundSize: '20px 20px',
              }}
            />
            {/* Top decorative gradient glow */}
            <div className="pointer-events-none absolute top-0 start-0 end-0 h-64 bg-gradient-to-b from-emerald-100/20 via-emerald-50/10 to-transparent dark:from-emerald-900/10 dark:via-emerald-950/5 dark:to-transparent" />
            <div className="relative p-3 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
      <RegisterSW />
      <OfflineIndicator />
      <PushNotificationPrompt />
    </KeyboardShortcutsProvider>
  );
}
