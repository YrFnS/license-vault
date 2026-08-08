import React from "react";
import {
  HardHat,
  Layers,
  Building,
  Calculator,
  DollarSign,
  Users,
  Puzzle,
} from "lucide-react";

export interface IntegrationData {
  id: string;
  orgId: string;
  name: string;
  type: string;
  category: string;
  status: string;
  config: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  syncCount: number;
  errorCount: number;
  lastError: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  syncLogs: SyncLogData[];
  syncAvailable: boolean;
}

export interface SyncLogData {
  id: string;
  integrationId: string;
  type: string;
  status: string;
  recordsSynced: number;
  errors: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface IntegrationStats {
  total: number;
  connected: number;
  disconnected: number;
  error: number;
  syncing: number;
  lastSyncAt: string | null;
  totalSyncErrors: number;
}

export interface CatalogIntegration {
  type: string;
  name: string;
  category: string;
  icon: string;
  iconUrl?: string;
  description: string;
  dataFlows: string[];
  connectionAvailable: boolean;
  syncAvailable: boolean;
  availability: "connection_only" | "sync_available";
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  status?: number;
  latencyMs?: number;
}

export const ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  HardHat,
  Layers,
  Building,
  Calculator,
  DollarSign,
  Users,
  Puzzle,
};

export const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};
