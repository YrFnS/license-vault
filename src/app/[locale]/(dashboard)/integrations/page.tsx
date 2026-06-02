'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Puzzle, Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  IntegrationData,
  IntegrationStats,
  CatalogIntegration,
  TestConnectionResult,
} from './components/types';
import { StatsCards } from './components/StatsCards';
import { CategoryTabs } from './components/CategoryTabs';
import { ConnectDialog } from './components/ConnectDialog';
import { DisconnectDialog } from './components/DisconnectDialog';

export default function IntegrationsPage() {
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
  const [testMessage, setTestMessage] = useState<string>('');

  // Connect form state
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

  const handleOpenConnect = (integration: CatalogIntegration) => {
    setSelectedIntegration(integration);
    setApiKey('');
    setBaseUrl('');
    setSyncFrequency('daily');
    setDataMappings(
      integration.dataFlows.reduce((acc, flow) => ({ ...acc, [flow]: true }), {})
    );
    setTestResult('idle');
    setTestMessage('');
    setConnectDialogOpen(true);
  };

  const handleTestConnection = async () => {
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
  };

  const handleConnect = async () => {
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
        toast({
          title: t('connectionFailed'),
          description: data.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: t('connectionFailed'),
        description: 'Network error',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;
    try {
      const res = await fetch(`/api/integrations/${disconnectTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({
          title: t('disconnected'),
          description: `${disconnectTarget.name} has been disconnected`,
        });
        setDisconnectDialogOpen(false);
        setDisconnectTarget(null);
        fetchIntegrations();
      }
    } catch {
      toast({
        title: t('connectionFailed'),
        description: 'Network error',
        variant: 'destructive',
      });
    }
  };

  const handleSync = async (integration: IntegrationData) => {
    setSyncingIds((prev) => new Set(prev).add(integration.id));
    try {
      const res = await fetch(`/api/integrations/${integration.id}/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast({
          title: t('syncCompleted'),
          description: data.message,
        });
      } else {
        toast({
          title: t('error'),
          description: data.message,
          variant: 'destructive',
        });
      }
      fetchIntegrations();
    } catch {
      toast({
        title: t('connectionFailed'),
        description: 'Sync failed',
        variant: 'destructive',
      });
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(integration.id);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
              <Puzzle className="size-7 text-emerald-600 dark:text-emerald-400" />
              {t('title')}
            </h1>
            <p className="text-muted-foreground mt-1">{t('description')}</p>
          </div>
          <Button
            className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-600 text-white shadow-sm"
            onClick={() => setConnectDialogOpen(true)}
          >
            <Plug className="size-4" />
            {t('connect')}
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Category Tabs + Integration Grids */}
      <CategoryTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        integrations={integrations}
        catalog={catalog}
        expandedIntegration={expandedIntegration}
        onToggleExpand={(id) => setExpandedIntegration(id ? id : null)}
        syncingIds={syncingIds}
        onSync={handleSync}
        onDisconnect={(integration) => {
          setDisconnectTarget(integration);
          setDisconnectDialogOpen(true);
        }}
        onConnect={handleOpenConnect}
      />

      {/* Connect Dialog */}
      <ConnectDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        selectedIntegration={selectedIntegration}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        baseUrl={baseUrl}
        onBaseUrlChange={setBaseUrl}
        syncFrequency={syncFrequency}
        onSyncFrequencyChange={setSyncFrequency}
        dataMappings={dataMappings}
        onDataMappingsChange={setDataMappings}
        testResult={testResult}
        testMessage={testMessage}
        testing={testing}
        connecting={connecting}
        onTestConnection={handleTestConnection}
        onConnect={handleConnect}
      />

      {/* Disconnect Confirmation Dialog */}
      <DisconnectDialog
        open={disconnectDialogOpen}
        onOpenChange={setDisconnectDialogOpen}
        target={disconnectTarget}
        onConfirm={handleDisconnect}
      />
    </div>
  );
}
