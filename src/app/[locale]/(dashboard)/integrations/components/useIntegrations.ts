import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import {
  IntegrationData,
  IntegrationStats,
  CatalogIntegration,
  TestConnectionResult,
} from "./types";

export function useIntegrations() {
  const t = useTranslations("integrations");
  const { toast } = useToast();

  const [integrations, setIntegrations] = useState<IntegrationData[]>([]);
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [catalog, setCatalog] = useState<CatalogIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] =
    useState<CatalogIntegration | null>(null);
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(
    null,
  );
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [disconnectTarget, setDisconnectTarget] =
    useState<IntegrationData | null>(null);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [testMessage, setTestMessage] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [syncFrequency, setSyncFrequency] = useState("daily");
  const [dataMappings, setDataMappings] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "success" | "failed">(
    "idle",
  );

  const fetchIntegrations = useCallback(async () => {
    try {
      const response = await fetch("/api/integrations", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setIntegrations(data.integrations || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Failed to fetch integrations:", error);
    }
  }, []);

  const fetchCatalog = useCallback(async () => {
    try {
      const response = await fetch("/api/integrations/catalog", {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = await response.json();
      setCatalog(data.catalog || []);
    } catch (error) {
      console.error("Failed to fetch integration catalog:", error);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchIntegrations(), fetchCatalog()]);
      setLoading(false);
    };
    load();
  }, [fetchIntegrations, fetchCatalog]);

  const resetConnectForm = useCallback(() => {
    setApiKey("");
    setBaseUrl("");
    setSyncFrequency("daily");
    setDataMappings({});
    setTestResult("idle");
    setTestMessage("");
  }, []);

  const handleOpenConnect = useCallback(
    (integration: CatalogIntegration) => {
      setSelectedIntegration(integration);
      resetConnectForm();
      setDataMappings(
        integration.dataFlows.reduce<Record<string, boolean>>(
          (accumulator, flow) => ({ ...accumulator, [flow]: true }),
          {},
        ),
      );
      setConnectDialogOpen(true);
    },
    [resetConnectForm],
  );

  const buildConfig = useCallback(
    () => ({
      apiKey,
      baseUrl,
      syncFrequency: syncFrequency as "realtime" | "hourly" | "daily" | "weekly",
      mappings: dataMappings,
    }),
    [apiKey, baseUrl, syncFrequency, dataMappings],
  );

  const handleTestConnection = useCallback(async () => {
    if (!selectedIntegration) return;
    setTesting(true);
    setTestResult("idle");
    setTestMessage("");
    try {
      const response = await fetch("/api/integrations/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedIntegration.type,
          config: buildConfig(),
        }),
      });
      const data: TestConnectionResult = await response.json();
      setTestResult(response.ok && data.success ? "success" : "failed");
      setTestMessage(data.message || t("connectionFailed"));
    } catch {
      setTestResult("failed");
      setTestMessage(t("networkError"));
    } finally {
      setTesting(false);
    }
  }, [selectedIntegration, buildConfig, t]);

  const handleConnect = useCallback(async () => {
    if (!selectedIntegration) return;
    if (testResult !== "success") {
      toast({
        title: t("connectionFailed"),
        description: t("testBeforeConnect"),
        variant: "destructive",
      });
      return;
    }

    setConnecting(true);
    try {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedIntegration.name,
          type: selectedIntegration.type,
          category: selectedIntegration.category,
          config: buildConfig(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({
          title: t("connectionFailed"),
          description: data.error || t("unknownError"),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t("connectionSuccess"),
        description: t("connectionVerifiedDescription", {
          name: selectedIntegration.name,
        }),
      });
      setConnectDialogOpen(false);
      resetConnectForm();
      await fetchIntegrations();
    } catch {
      toast({
        title: t("connectionFailed"),
        description: t("networkError"),
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  }, [
    selectedIntegration,
    testResult,
    buildConfig,
    toast,
    t,
    resetConnectForm,
    fetchIntegrations,
  ]);

  const handleDisconnect = useCallback(async () => {
    if (!disconnectTarget) return;
    try {
      const response = await fetch(`/api/integrations/${disconnectTarget.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("connectionFailed"));
      }
      toast({
        title: t("disconnected"),
        description: t("disconnectSuccessDescription", {
          name: disconnectTarget.name,
        }),
      });
      setDisconnectDialogOpen(false);
      setDisconnectTarget(null);
      await fetchIntegrations();
    } catch (error) {
      toast({
        title: t("connectionFailed"),
        description:
          error instanceof Error ? error.message : t("networkError"),
        variant: "destructive",
      });
    }
  }, [disconnectTarget, toast, t, fetchIntegrations]);

  const handleSync = useCallback(
    async (integration: IntegrationData) => {
      if (!integration.syncAvailable) {
        toast({
          title: t("syncUnavailable"),
          description: t("syncUnavailableDescription"),
        });
        return;
      }

      setSyncingIds((previous) => new Set(previous).add(integration.id));
      try {
        const response = await fetch(`/api/integrations/${integration.id}/sync`, {
          method: "POST",
        });
        const data = await response.json();
        if (response.ok && data.success) {
          toast({ title: t("syncCompleted"), description: data.message });
        } else {
          toast({
            title: t("error"),
            description: data.message || data.error || t("syncUnavailableDescription"),
            variant: "destructive",
          });
        }
        await fetchIntegrations();
      } catch {
        toast({
          title: t("connectionFailed"),
          description: t("networkError"),
          variant: "destructive",
        });
      } finally {
        setSyncingIds((previous) => {
          const next = new Set(previous);
          next.delete(integration.id);
          return next;
        });
      }
    },
    [toast, t, fetchIntegrations],
  );

  return {
    integrations,
    stats,
    catalog,
    loading,
    activeTab,
    setActiveTab,
    connectDialogOpen,
    setConnectDialogOpen,
    selectedIntegration,
    expandedIntegration,
    setExpandedIntegration,
    disconnectDialogOpen,
    setDisconnectDialogOpen,
    disconnectTarget,
    syncingIds,
    testMessage,
    apiKey,
    setApiKey,
    baseUrl,
    setBaseUrl,
    syncFrequency,
    setSyncFrequency,
    dataMappings,
    setDataMappings,
    testing,
    connecting,
    testResult,
    handleOpenConnect,
    handleTestConnection,
    handleConnect,
    handleDisconnect,
    handleSync,
    setDisconnectTarget,
  };
}
