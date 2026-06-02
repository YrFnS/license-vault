"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Puzzle, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCards } from "./components/StatsCards";
import { CategoryTabs } from "./components/CategoryTabs";
import { ConnectDialog } from "./components/ConnectDialog";
import { DisconnectDialog } from "./components/DisconnectDialog";
import { useIntegrations } from "./components/useIntegrations";

export default function IntegrationsPage() {
	const t = useTranslations("integrations");
	const h = useIntegrations();

	if (h.loading) {
		return (
			<div className="space-y-6 p-4 md:p-6">
				<div className="flex items-center justify-between">
					<div><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-4 w-72" /></div>
					<Skeleton className="h-10 w-36" />
				</div>
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-56 rounded-xl" />)}</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
							<Puzzle className="size-7 text-emerald-600 dark:text-emerald-400" />
							{t("title")}
						</h1>
						<p className="text-muted-foreground mt-1">{t("description")}</p>
					</div>
					<Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm" onClick={() => h.setConnectDialogOpen(true)}>
						<Plug className="size-4" />{t("connect")}
					</Button>
				</div>
			</motion.div>

			<StatsCards stats={h.stats} />

			<CategoryTabs
				activeTab={h.activeTab} onTabChange={h.setActiveTab}
				integrations={h.integrations} catalog={h.catalog}
				expandedIntegration={h.expandedIntegration}
				onToggleExpand={(id) => h.setExpandedIntegration(id || null)}
				syncingIds={h.syncingIds} onSync={h.handleSync}
				onDisconnect={(intg) => { h.setDisconnectTarget(intg); h.setDisconnectDialogOpen(true); }}
				onConnect={h.handleOpenConnect}
			/>

			<ConnectDialog
				open={h.connectDialogOpen} onOpenChange={h.setConnectDialogOpen}
				selectedIntegration={h.selectedIntegration}
				apiKey={h.apiKey} onApiKeyChange={h.setApiKey}
				baseUrl={h.baseUrl} onBaseUrlChange={h.setBaseUrl}
				syncFrequency={h.syncFrequency} onSyncFrequencyChange={h.setSyncFrequency}
				dataMappings={h.dataMappings} onDataMappingsChange={h.setDataMappings}
				testResult={h.testResult} testMessage={h.testMessage}
				testing={h.testing} connecting={h.connecting}
				onTestConnection={h.handleTestConnection} onConnect={h.handleConnect}
			/>

			<DisconnectDialog
				open={h.disconnectDialogOpen} onOpenChange={h.setDisconnectDialogOpen}
				target={h.disconnectTarget} onConfirm={h.handleDisconnect}
			/>
		</div>
	);
}
