"use client";

import { motion } from "framer-motion";
import {
  RefreshCw,
  Activity,
  ChevronDown,
  ChevronUp,
  Clock,
  Unplug,
  ArrowRightLeft,
  AlertCircle,
  Loader2,
  Link2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { IntegrationData, CatalogIntegration, fadeIn } from "./types";
import { CatalogIcon, getDataFlowLabel, formatTime } from "./helpers";
import { StatusBadge } from "./StatusBadge";
import { CategoryBadge } from "./CategoryBadge";
import { SyncHistory } from "./SyncHistory";

interface IntegrationCardProps {
  integration: IntegrationData;
  idx: number;
  catalog: CatalogIntegration[];
  isExpanded: boolean;
  isSyncing: boolean;
  onToggleExpand: (id: string) => void;
  onSync: (integration: IntegrationData) => void;
  onDisconnect: (integration: IntegrationData) => void;
}

export function IntegrationCard({
  integration,
  idx,
  catalog,
  isExpanded,
  isSyncing,
  onToggleExpand,
  onSync,
  onDisconnect,
}: IntegrationCardProps) {
  const t = useTranslations("integrations");
  const availableDefinition = catalog.find(
    (item) => item.type === integration.type,
  );
  const syncAvailable =
    integration.syncAvailable && Boolean(availableDefinition?.syncAvailable);

  return (
    <motion.div
      key={integration.id}
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3, delay: idx * 0.05 }}
    >
      <Card className="overflow-hidden shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          <div className="p-4 pb-3">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <CatalogIcon
                    integration={{
                      icon: availableDefinition?.icon ?? "Puzzle",
                      iconUrl: availableDefinition?.iconUrl,
                      name: integration.name,
                    }}
                    className="size-5 text-primary"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">
                    {integration.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <CategoryBadge category={integration.category} />
                    {!syncAvailable && (
                      <Badge variant="outline" className="h-5 gap-1 text-[10px]">
                        <Link2 className="size-2.5" />
                        {t("connectionOnly")}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <StatusBadge status={integration.status} />
            </div>

            {availableDefinition && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {availableDefinition.dataFlows.map((flow) => (
                  <span
                    key={flow}
                    className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    <ArrowRightLeft className="size-2.5" />
                    {getDataFlowLabel(flow, t)}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {syncAvailable ? (
                <>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {t("lastSync")}: {formatTime(integration.lastSyncAt, t)}
                  </span>
                  <span className="flex items-center gap-1">
                    <RefreshCw className="size-3" />
                    {t("syncCount")}: {integration.syncCount}
                  </span>
                </>
              ) : (
                <span className="flex items-center gap-1">
                  <Link2 className="size-3" />
                  {t("syncUnavailableDescription")}
                </span>
              )}
            </div>

            {integration.lastError && (
              <p className="mt-2 flex items-start gap-1 text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle className="mt-0.5 size-3 shrink-0" />
                {integration.lastError}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 border-t border-border/50 bg-muted/20 px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => onSync(integration)}
              disabled={
                !syncAvailable || isSyncing || integration.status === "syncing"
              }
              title={!syncAvailable ? t("syncUnavailableDescription") : undefined}
            >
              {isSyncing ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <RefreshCw className="size-3" />
              )}
              {syncAvailable ? t("syncNow") : t("syncUnavailable")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => onToggleExpand(isExpanded ? "" : integration.id)}
            >
              <Activity className="size-3" />
              {t("syncHistory")}
              {isExpanded ? (
                <ChevronUp className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )}
            </Button>
            <div className="ms-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs hover:text-red-600 dark:hover:text-red-400"
                onClick={() => onDisconnect(integration)}
              >
                <Unplug className="size-3" />
                {t("disconnect")}
              </Button>
            </div>
          </div>

          <SyncHistory
            syncLogs={integration.syncLogs}
            isExpanded={isExpanded}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
