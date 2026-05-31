"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";
import { Loader2 } from "lucide-react";

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
		if (status === "unauthenticated") {
			router.replace("/login");
		}
	}, [status, router]);

	useEffect(() => {
		const handleToggleSidebar = () => {
			setSidebarHidden((prev) => !prev);
		};
		window.addEventListener("toggle-sidebar", handleToggleSidebar);
		return () =>
			window.removeEventListener("toggle-sidebar", handleToggleSidebar);
	}, []);

	if (status === "loading") {
		return (
			<div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950">
				<Loader2 className="size-6 animate-spin text-emerald-600" />
			</div>
		);
	}

	if (status === "unauthenticated") {
		return null;
	}

	return (
		<KeyboardShortcutsProvider>
			<div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950">
				{!sidebarHidden && <Sidebar />}
				<div className="flex flex-1 flex-col overflow-hidden min-w-0">
					<TopNav />
					<main className="flex-1 overflow-y-auto">
						<div className="mx-auto max-w-6xl px-4 md:px-6 py-6">
							{children}
						</div>
					</main>
				</div>
			</div>
		</KeyboardShortcutsProvider>
	);
}
