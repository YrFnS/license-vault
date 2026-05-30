'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Puzzle,
  HardHat,
  Calculator,
  BookOpen,
  Users,
  RefreshCw,
  Settings,
  Plug,
  Unplug,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Zap,
  ArrowRightLeft,
  Shield,
  FileText,
  Building,
  DollarSign,
  Activity,
  Search,
  Loader2,
  Link2,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Types
interface IntegrationData {
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
}

interface SyncLogData {
  id: string;
  integrationId: string;
  type: string;
  status: string;
  recordsSynced: number;
  errors: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface IntegrationStats {
  total: number;
  connected: number;
  disconnected: number;
  error: number;
  syncing: number;
  lastSyncAt: string | null;
  totalSyncErrors: number;
}

// Icon name to component mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  HardHat,
  Layers,
  Building,
  Calculator,
  DollarSign,
  Users,
  Puzzle,
};

// Catalog integration type (from API)
interface CatalogIntegration {
  type: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  dataFlows: string[];
}

// Test connection result
interface TestConnectionResult {
  success: boolean;
  message: string;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function IntegrationsPage() {
  const t = useTranslations('integrations');
  const tc = useTranslations('common');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-1">
            <CheckCircle2 className="size-3" />
            {t('connected')}
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 gap-1">
            <Unplug className="size-3" />
            {t('disconnected')}
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800 gap-1">
            <AlertCircle className="size-3" />
            {t('error')}
          </Badge>
        );
      case 'syncing':
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 gap-1">
            <RefreshCw className="size-3 animate-spin" />
            {t('syncing')}
          </Badge>
        );
      default:
        return null;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'construction_erp':
        return <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400">{t('constructionErp')}</Badge>;
      case 'accounting':
        return <Badge variant="outline" className="text-xs border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-400">{t('accounting')}</Badge>;
      case 'hris':
        return <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">{t('hrPayroll')}</Badge>;
      case 'custom':
        return <Badge variant="outline" className="text-xs border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-400">{t('custom')}</Badge>;
      default:
        return null;
    }
  };

  const getIntegrationIcon = (type: string) => {
    const found = catalog.find((i) => i.type === type);
    if (found && ICON_MAP[found.icon]) return ICON_MAP[found.icon];
    return Puzzle;
  };

  const getDataFlowLabel = (flow: string) => {
    switch (flow) {
      case 'licenses': return t('licenses');
      case 'projects': return t('projects');
      case 'contractors': return t('contractors');
      case 'documents': return t('documents');
      default: return flow;
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return t('never');
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredIntegrations = integrations.filter((i) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'construction_erp') return i.category === 'construction_erp';
    if (activeTab === 'accounting') return i.category === 'accounting';
    if (activeTab === 'hris') return i.category === 'hris';
    if (activeTab === 'custom') return i.category === 'custom';
    return true;
  });

  const filteredAvailable = catalog.filter((i) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'construction_erp') return i.category === 'construction_erp';
    if (activeTab === 'accounting') return i.category === 'accounting';
    if (activeTab === 'hris') return i.category === 'hris';
    if (activeTab === 'custom') return i.category === 'custom';
    return true;
  }).filter((i) => !integrations.some((existing) => existing.type === i.type));

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
      <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.4 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
              <Puzzle className="size-7 text-emerald-600 dark:text-emerald-400" />
              {t('title')}
            </h1>
            <p className="text-muted-foreground mt-1">{t('description')}</p>
          </div>
          <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm">
                <Plug className="size-4" />
                {t('connect')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedIntegration && (() => {
                    const Icon = ICON_MAP[selectedIntegration.icon] || Puzzle;
                    return <Icon className="size-5 text-emerald-600 dark:text-emerald-400" />;
                  })()}
                  {t('connect')} {selectedIntegration?.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedIntegration?.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">{t('apiKey')}</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">{t('baseUrl')}</Label>
                  <Input
                    id="baseUrl"
                    placeholder="https://api.example.com"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('syncFrequency')}</Label>
                  <Select value={syncFrequency} onValueChange={setSyncFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">{t('realtime')}</SelectItem>
                      <SelectItem value="hourly">{t('hourly')}</SelectItem>
                      <SelectItem value="daily">{t('daily')}</SelectItem>
                      <SelectItem value="weekly">{t('weekly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('dataMapping')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedIntegration?.dataFlows.map((flow) => (
                      <label
                        key={flow}
                        className={cn(
                          'flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all duration-200',
                          dataMappings[flow]
                            ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/20'
                            : 'border-border bg-background hover:bg-muted/50'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={dataMappings[flow] || false}
                          onChange={(e) => setDataMappings((prev) => ({ ...prev, [flow]: e.target.checked }))}
                          className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium">{getDataFlowLabel(flow)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Test Connection Result */}
                {testResult !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-lg text-sm font-medium',
                      testResult === 'success'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                    )}
                  >
                    {testResult === 'success' ? (
                      <CheckCircle2 className="size-4 shrink-0" />
                    ) : (
                      <XCircle className="size-4 shrink-0" />
                    )}
                    {testMessage || (testResult === 'success' ? t('connectionSuccess') : t('connectionFailed'))}
                  </motion.div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
                >
                  {testing ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                  {t('testConnection')}
                </Button>
                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                >
                  {connecting ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />}
                  {t('saveConnect')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-s-4 border-s-emerald-500">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400">
                <Puzzle className="size-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t('totalIntegrations')}</p>
            <p className="text-2xl md:text-3xl font-extrabold tabular-nums mt-1">{stats?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-s-4 border-s-teal-500">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 text-teal-600 dark:text-teal-400">
                <CheckCircle2 className="size-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t('connectedCount')}</p>
            <p className="text-2xl md:text-3xl font-extrabold tabular-nums mt-1">{stats?.connected ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-s-4 border-s-amber-500">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400">
                <Clock className="size-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t('lastSyncTime')}</p>
            <p className="text-lg md:text-xl font-bold mt-1">{formatTime(stats?.lastSyncAt ?? null)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-s-4 border-s-red-500">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400">
                <AlertCircle className="size-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t('syncErrors')}</p>
            <p className="text-2xl md:text-3xl font-extrabold tabular-nums mt-1">{stats?.totalSyncErrors ?? 0}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Tabs */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm">{t('all')}</TabsTrigger>
            <TabsTrigger value="construction_erp" className="text-xs sm:text-sm">{t('constructionErp')}</TabsTrigger>
            <TabsTrigger value="accounting" className="text-xs sm:text-sm">{t('accounting')}</TabsTrigger>
            <TabsTrigger value="hris" className="text-xs sm:text-sm">{t('hrPayroll')}</TabsTrigger>
          </TabsList>

          {/* All tab content */}
          <TabsContent value={activeTab} className="mt-6">
            {/* Connected Integrations */}
            {filteredIntegrations.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Link2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                  Connected
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredIntegrations.map((integration, idx) => {
                    const Icon = getIntegrationIcon(integration.type);
                    const isExpanded = expandedIntegration === integration.id;
                    const isSyncing = syncingIds.has(integration.id);
                    const availableDef = catalog.find((a) => a.type === integration.type);
                    const configData = integration.config ? JSON.parse(integration.config) : null;

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
                                    <Icon className="size-5 text-emerald-600 dark:text-emerald-400" />
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="font-semibold text-sm truncate">{integration.name}</h3>
                                    {getCategoryBadge(integration.category)}
                                  </div>
                                </div>
                                {getStatusBadge(integration.status)}
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
                                      {getDataFlowLabel(flow)}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Stats Row */}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3" />
                                  {t('lastSync')}: {formatTime(integration.lastSyncAt)}
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
                                onClick={() => handleSync(integration)}
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
                                onClick={() => setExpandedIntegration(isExpanded ? null : integration.id)}
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
                                  onClick={() => {
                                    setDisconnectTarget(integration);
                                    setDisconnectDialogOpen(true);
                                  }}
                                >
                                  <Unplug className="size-3" />
                                  {t('disconnect')}
                                </Button>
                              </div>
                            </div>

                            {/* Expanded Sync History */}
                            <AnimatePresence>
                              {isExpanded && integration.syncLogs.length > 0 && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 py-3 border-t border-border/50 bg-muted/10">
                                    <ScrollArea className="max-h-40">
                                      <div className="space-y-2">
                                        {integration.syncLogs.map((log) => (
                                          <div
                                            key={log.id}
                                            className="flex items-center justify-between text-xs py-1.5 px-2 rounded-md bg-background/50 border border-border/30"
                                          >
                                            <div className="flex items-center gap-2">
                                              {log.status === 'completed' && <CheckCircle2 className="size-3 text-emerald-500" />}
                                              {log.status === 'failed' && <XCircle className="size-3 text-red-500" />}
                                              {log.status === 'running' && <Loader2 className="size-3 animate-spin text-amber-500" />}
                                              <span className="font-medium capitalize">{log.type}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-muted-foreground">
                                              <span>{log.recordsSynced} records</span>
                                              <span>{formatTime(log.startedAt)}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Integrations */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Search className="size-5 text-teal-600 dark:text-teal-400" />
                Available
              </h2>
              {filteredAvailable.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAvailable.map((integration, idx) => {
                    const Icon = ICON_MAP[integration.icon] || Puzzle;
                    return (
                      <motion.div
                        key={integration.type}
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                      >
                        <Card className="shadow-sm hover:shadow-md transition-all duration-300 group">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-muted/80 to-muted/40 group-hover:from-emerald-500/20 group-hover:to-teal-500/20 transition-all duration-300 shrink-0">
                                  <Icon className="size-5 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300" />
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-semibold text-sm">{integration.name}</h3>
                                  {getCategoryBadge(integration.category)}
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{integration.description}</p>
                            {/* Data Flow Indicators */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {integration.dataFlows.map((flow) => (
                                <span
                                  key={flow}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted/50 text-muted-foreground border border-border/50"
                                >
                                  <ArrowRightLeft className="size-2.5" />
                                  {getDataFlowLabel(flow)}
                                </span>
                              ))}
                            </div>
                            <Button
                              className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm text-xs h-8"
                              onClick={() => handleOpenConnect(integration)}
                            >
                              <Plug className="size-3" />
                              {t('connect')}
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              ) : filteredIntegrations.length > 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-500" />
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">All integrations connected</p>
                  <p className="text-sm">You&apos;ve connected all available integrations for this category</p>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Puzzle className="size-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="font-medium text-lg">{t('noIntegrations')}</p>
                  <p className="text-sm mt-1">{t('noIntegrationsDesc')}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDisconnect')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDisconnectDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t('disconnect')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
