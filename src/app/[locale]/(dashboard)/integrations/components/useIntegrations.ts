import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  IntegrationData,
  IntegrationStats,
  CatalogIntegration,
  TestConnectionResult,
} from './types';

export function useIntegrations() {
  const t = useTranslations('integrations');
  const { toast } = useToast();

  const [integrations, setIntegrations] = useState<IntegrationData[]>([]);
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [catalog, setCatalog] = useState<CatalogIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<CatalogIntegration | null>(null);
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<IntegrationData | null>(null);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [testMessage, setTestMessage] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [syncFrequency, setSyncFrequency] = useState('daily');
  const [dataMappings, setDataMappings] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'failed'>('idle');

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations');
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch integrations:', err);
    }
  }, []);

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/catalog');
      if (res.ok) {
        const data = await res.json();
        setCatalog(data.catalog);
      }
    } catch (err) {
      console.error('Failed to fetch integration catalog:', err);
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
    setApiKey('');
    setBaseUrl('');
    setSyncFrequency('daily');
    setDataMappings({});
    setTestResult('idle');
    setTestMessage('');
  }, []);

  const handleOpenConnect = useCallback(
    (integration: CatalogIntegration) => {
      setSelectedIntegration(integration);
      resetConnectForm();
      setDataMappings(integration.dataFlows.reduce((acc, flow) => ({ ...acc, [flow]: true }), {}));
      setConnectDialogOpen(true);
    },
    [resetConnectForm]
  );

  const handleTestConnection = useCallback(async () => {
    if (!selectedIntegration) return;
    setTesting(true);
    setTestResult('idle');
    setTestMessage('');
    try {
      const res = await fetch('/api/integrations/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedIntegration.type,
          config: { apiKey, baseUrl },
        }),
      });
      const data: TestConnectionResult = await res.json();
      setTestResult(data.success ? 'success' : 'failed');
      setTestMessage(data.message);
    } catch {
      setTestResult('failed');
      setTestMessage('Network error. Please check your connection and try again.');
    } finally {
      setTesting(false);
    }
  }, [selectedIntegration, apiKey, baseUrl]);

  const handleConnect = useCallback(async () => {
    if (!selectedIntegration) return;
    setConnecting(true);
    try {
      const config = JSON.stringify({
        apiKey: apiKey ? '••••••••' : null,
        baseUrl: baseUrl || null,
        syncFrequency,
        mappings: dataMappings,
      });
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedIntegration.name,
          type: selectedIntegration.type,
          category: selectedIntegration.category,
          config,
        }),
      });
      if (res.ok) {
        toast({
          title: t('connectionSuccess'),
          description: `${selectedIntegration.name} ${t('connected').toLowerCase()}`,
        });
        setConnectDialogOpen(false);
        fetchIntegrations();
      } else {
        const data = await res.json();
        toast({ title: t('connectionFailed'), description: data.error || 'Unknown error', variant: 'destructive' });
      }
    } catch {
      toast({ title: t('connectionFailed'), description: 'Network error', variant: 'destructive' });
    } finally {
      setConnecting(false);
    }
  }, [selectedIntegration, apiKey, baseUrl, syncFrequency, dataMappings, toast, t, fetchIntegrations]);

  const handleDisconnect = useCallback(async () => {
    if (!disconnectTarget) return;
    try {
      const res = await fetch(`/api/integrations/${disconnectTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: t('disconnected'), description: `${disconnectTarget.name} has been disconnected` });
        setDisconnectDialogOpen(false);
        setDisconnectTarget(null);
        fetchIntegrations();
      }
    } catch {
      toast({ title: t('connectionFailed'), description: 'Network error', variant: 'destructive' });
    }
  }, [disconnectTarget, toast, t, fetchIntegrations]);

  const handleSync = useCallback(async (integration: IntegrationData) => {
    setSyncingIds((prev) => new Set(prev).add(integration.id));
    try {
      const res = await fetch(`/api/integrations/${integration.id}/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast({ title: t('syncCompleted'), description: data.message });
      } else {
        toast({ title: t('error'), description: data.message, variant: 'destructive' });
      }
      fetchIntegrations();
    } catch {
      toast({ title: t('connectionFailed'), description: 'Sync failed', variant: 'destructive' });
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(integration.id);
        return next;
      });
    }
  }, [toast, t, fetchIntegrations]);

  return {
    integrations, stats, catalog, loading, activeTab, setActiveTab,
    connectDialogOpen, setConnectDialogOpen, selectedIntegration,
    expandedIntegration, setExpandedIntegration,
    disconnectDialogOpen, setDisconnectDialogOpen, disconnectTarget,
    syncingIds, testMessage,
    apiKey, setApiKey, baseUrl, setBaseUrl,
    syncFrequency, setSyncFrequency,
    dataMappings, setDataMappings,
    testing, connecting, testResult,
    handleOpenConnect, handleTestConnection, handleConnect,
    handleDisconnect, handleSync, setDisconnectTarget,
  };
}
