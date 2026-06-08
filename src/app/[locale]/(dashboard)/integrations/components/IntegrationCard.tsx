"use client";

import { useMemo } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { IntegrationData, CatalogIntegration, fadeIn } from './types';
import { getIntegrationIcon, getDataFlowLabel, formatTime } from './helpers';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { SyncHistory } from './SyncHistory';

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
  const t = useTranslations('integrations');
  const IntegrationIcon = useMemo(() => getIntegrationIcon(integration.type, catalog), [integration.type, catalog]);
  const availableDef = catalog.find((a) => a.type === integration.type);

  return (
    <motion.div
      key={integration.id}
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3, delay: idx * 0.05 }}
    >
      <Card className="shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardContent className="p-0">
          {/* Card Header */}
          <div className="p-4 pb-3">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 shrink-0">
                  <IntegrationIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">{integration.name}</h3>
                  <CategoryBadge category={integration.category} />
                </div>
              </div>
              <StatusBadge status={integration.status} />
            </div>

            {/* Data Flow Indicators */}
            {availableDef && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {availableDef.dataFlows.map((flow) => (
                  <span
                    key={flow}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted/50 text-muted-foreground border border-border/50"
                  >
                    <ArrowRightLeft className="size-2.5" />
                    {getDataFlowLabel(flow, t)}
                  </span>
                ))}
              </div>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {t('lastSync')}: {formatTime(integration.lastSyncAt, t)}
              </span>
              <span className="flex items-center gap-1">
                <RefreshCw className="size-3" />
                {t('syncCount')}: {integration.syncCount}
              </span>
            </div>

            {/* Error message */}
            {integration.lastError && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="size-3 shrink-0" />
                {integration.lastError}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 px-4 py-2 border-t border-border/50 bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
              onClick={() => onSync(integration)}
              disabled={isSyncing || integration.status === 'syncing'}
            >
              {isSyncing ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <RefreshCw className="size-3" />
              )}
              {t('syncNow')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => onToggleExpand(isExpanded ? '' : integration.id)}
            >
              <Activity className="size-3" />
              {t('syncHistory')}
              {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </Button>
            <div className="ms-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 hover:text-red-600 dark:hover:text-red-400"
                onClick={() => onDisconnect(integration)}
              >
                <Unplug className="size-3" />
                {t('disconnect')}
              </Button>
            </div>
          </div>

          {/* Expanded Sync History */}
          <SyncHistory syncLogs={integration.syncLogs} isExpanded={isExpanded} />
        </CardContent>
      </Card>
    </motion.div>
  );
}
