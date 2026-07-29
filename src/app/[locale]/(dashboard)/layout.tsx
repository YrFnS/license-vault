"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { BrandingProvider } from "@/components/branding/BrandingProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [sidebarHidden, setSidebarHidden] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const handleToggleSidebar = () => {
      setSidebarHidden((previous) => !previous);
    };
    window.addEventListener("toggle-sidebar", handleToggleSidebar);
    return () => window.removeEventListener("toggle-sidebar", handleToggleSidebar);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <BrandingProvider>
      <KeyboardShortcutsProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          {!sidebarHidden && <Sidebar />}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <TopNav />
            <main className="flex-1 overflow-y-auto bg-slate-50/60 dark:bg-slate-950">
              <div className="mx-auto w-full max-w-[1600px] px-4 py-5 md:px-6 md:py-6 xl:px-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </KeyboardShortcutsProvider>
    </BrandingProvider>
  );
}
