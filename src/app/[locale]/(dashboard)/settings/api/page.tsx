'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Key,
  Webhook,
  Plus,
  Copy,
  Check,
  Trash2,
  Pencil,
  Send,
  ChevronDown,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  Terminal,
  Code2,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from '@/i18n/navigation';

// --- Types ---
interface ApiKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface WebhookData {
  id: string;
  name: string;
  url: string;
  events: string;
  secret: string;
  isActive: boolean;
  lastTriggeredAt: string | null;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

const WEBHOOK_EVENTS = [
  'license.created',
  'license.updated',
  'license.expiring',
  'license.expired',
  'insurance.expiring',
  'insurance.expired',
  'compliance.changed',
  'approval.created',
  'approval.approved',
  'approval.rejected',
] as const;

export default function ApiAccessPage() {
  const t = useTranslations('apiAccess');
  const tc = useTranslations('common');
  const locale = useLocale();

  // --- API Keys State ---
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [createKeyDialogOpen, setCreateKeyDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState('read');
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [createdKeyValue, setCreatedKeyValue] = useState<string | null>(null);
  const [showCreatedKey, setShowCreatedKey] = useState(false);
  const [revokeKeyId, setRevokeKeyId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // --- Webhooks State ---
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [webhooksLoading, setWebhooksLoading] = useState(true);
  const [createWebhookDialogOpen, setCreateWebhookDialogOpen] = useState(false);
  const [editWebhookDialogOpen, setEditWebhookDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookData | null>(null);
  const [whName, setWhName] = useState('');
  const [whUrl, setWhUrl] = useState('');
  const [whEvents, setWhEvents] = useState<string[]>([]);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [deleteWebhookId, setDeleteWebhookId] = useState<string | null>(null);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);

  // --- Docs State ---
  const [docsOpen, setDocsOpen] = useState(false);

  // --- Fetch API Keys ---
  const fetchApiKeys = useCallback(async () => {
    try {
      setKeysLoading(true);
      const res = await fetch('/api/api-keys');
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.apiKeys || []);
      }
    } catch {
      // silently fail
    } finally {
      setKeysLoading(false);
    }
  }, []);

  // --- Fetch Webhooks ---
  const fetchWebhooks = useCallback(async () => {
    try {
      setWebhooksLoading(true);
      const res = await fetch('/api/webhooks');
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks || []);
      }
    } catch {
      // silently fail
    } finally {
      setWebhooksLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
    fetchWebhooks();
  }, [fetchApiKeys, fetchWebhooks]);

  // --- API Key Actions ---
  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          permissions: newKeyPermissions,
          expiresAt: newKeyExpiry || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedKeyValue(data.key);
        setShowCreatedKey(true);
        setCreateKeyDialogOpen(false);
        setNewKeyName('');
        setNewKeyPermissions('read');
        setNewKeyExpiry('');
        fetchApiKeys();
        toast.success(t('apiKeys.createSuccess'));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create API key');
      }
    } catch {
      toast.error('Failed to create API key');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async () => {
    if (!revokeKeyId) return;
    try {
      const res = await fetch(`/api/api-keys/${revokeKeyId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('apiKeys.revokeSuccess'));
        fetchApiKeys();
      } else {
        toast.error('Failed to revoke API key');
      }
    } catch {
      toast.error('Failed to revoke API key');
    } finally {
      setRevokeKeyId(null);
    }
  };

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(true);
      toast.success(t('apiKeys.keyCopied'));
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleCopyPrefix = async (prefix: string) => {
    try {
      await navigator.clipboard.writeText(prefix);
      toast.success('Prefix copied!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  // --- Webhook Actions ---
  const handleCreateWebhook = async () => {
    if (!whName.trim() || !whUrl.trim() || whEvents.length === 0) return;
    setSavingWebhook(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: whName,
          url: whUrl,
          events: whEvents.join(','),
        }),
      });
      if (res.ok) {
        toast.success(t('webhooks.createSuccess'));
        setCreateWebhookDialogOpen(false);
        resetWebhookForm();
        fetchWebhooks();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create webhook');
      }
    } catch {
      toast.error('Failed to create webhook');
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleUpdateWebhook = async () => {
    if (!editingWebhook || !whName.trim() || !whUrl.trim() || whEvents.length === 0) return;
    setSavingWebhook(true);
    try {
      const res = await fetch(`/api/webhooks/${editingWebhook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: whName,
          url: whUrl,
          events: whEvents.join(','),
        }),
      });
      if (res.ok) {
        toast.success(t('webhooks.updateSuccess'));
        setEditWebhookDialogOpen(false);
        resetWebhookForm();
        fetchWebhooks();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update webhook');
      }
    } catch {
      toast.error('Failed to update webhook');
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!deleteWebhookId) return;
    try {
      const res = await fetch(`/api/webhooks/${deleteWebhookId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('webhooks.deleteSuccess'));
        fetchWebhooks();
      } else {
        toast.error('Failed to delete webhook');
      }
    } catch {
      toast.error('Failed to delete webhook');
    } finally {
      setDeleteWebhookId(null);
    }
  };

  const handleTestWebhook = async (id: string) => {
    setTestingWebhookId(id);
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          toast.success(t('webhooks.testSuccess'));
        } else {
          toast.error(`${t('webhooks.testFailed')} (HTTP ${data.statusCode})`);
        }
        fetchWebhooks();
      } else {
        toast.error(t('webhooks.testFailed'));
      }
    } catch {
      toast.error(t('webhooks.testFailed'));
    } finally {
      setTestingWebhookId(null);
    }
  };

  const handleCopySecret = async (secret: string, id: string) => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopiedSecret(id);
      toast.success(t('webhooks.secretCopied'));
      setTimeout(() => setCopiedSecret(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const openEditWebhook = (webhook: WebhookData) => {
    setEditingWebhook(webhook);
    setWhName(webhook.name);
    setWhUrl(webhook.url);
    setWhEvents(webhook.events.split(','));
    setEditWebhookDialogOpen(true);
  };

  const resetWebhookForm = () => {
    setWhName('');
    setWhUrl('');
    setWhEvents([]);
    setEditingWebhook(null);
  };

  const toggleEvent = (event: string) => {
    setWhEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return t('apiKeys.never');
    return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getEventLabel = (event: string) => {
    const map: Record<string, string> = {
      'license.created': t('events.licenseCreated'),
      'license.updated': t('events.licenseUpdated'),
      'license.expiring': t('events.licenseExpiring'),
      'license.expired': t('events.licenseExpired'),
      'insurance.expiring': t('events.insuranceExpiring'),
      'insurance.expired': t('events.insuranceExpired'),
      'compliance.changed': t('events.complianceChanged'),
      'approval.created': t('events.approvalCreated'),
      'approval.approved': t('events.approvalApproved'),
      'approval.rejected': t('events.approvalRejected'),
    };
    return map[event] || event;
  };

  const getPermissionBadge = (perm: string) => {
    switch (perm) {
      case 'admin':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800 text-xs">
            {t('apiKeys.admin')}
          </Badge>
        );
      case 'write':
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-xs">
            {t('apiKeys.write')}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs">
            {t('apiKeys.read')}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
            <Key className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        </div>
        <p className="text-muted-foreground mt-1 ms-10">{t('description')}</p>
      </div>

      {/* ===== API Keys Section ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="size-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle>{t('apiKeys.title')}</CardTitle>
            </div>
            <Button
              onClick={() => setCreateKeyDialogOpen(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            >
              <Plus className="size-4 me-1" />
              {t('apiKeys.create')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {keysLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-10 border rounded-lg border-dashed">
              <div className="rounded-full bg-muted p-3 mx-auto w-fit mb-3">
                <Key className="size-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{t('apiKeys.noKeys')}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{t('apiKeys.noKeysDesc')}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setCreateKeyDialogOpen(true)}
              >
                <Plus className="size-4 me-1" />
                {t('apiKeys.create')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-lg border transition-colors',
                    apiKey.isActive
                      ? 'bg-card hover:bg-muted/30 border-border/50'
                      : 'bg-muted/20 border-border/30 opacity-60'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{apiKey.name}</span>
                      {getPermissionBadge(apiKey.permissions)}
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs cursor-pointer',
                          apiKey.isActive
                            ? 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                            : 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                        )}
                        onClick={() => handleCopyPrefix(apiKey.keyPrefix)}
                      >
                        {apiKey.keyPrefix}••••
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                      <span>
                        {t('apiKeys.lastUsed')}: {formatDate(apiKey.lastUsedAt)}
                      </span>
                      <span>
                        {t('apiKeys.expires')}: {apiKey.expiresAt ? formatDate(apiKey.expiresAt) : t('apiKeys.never')}
                      </span>
                      <span>
                        {apiKey.isActive ? t('apiKeys.active') : t('apiKeys.revoked')}
                      </span>
                    </div>
                  </div>
                  {apiKey.isActive && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() => setRevokeKeyId(apiKey.id)}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">{t('apiKeys.revoke')}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('apiKeys.revoke')}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Created Key Dialog */}
      <Dialog open={showCreatedKey} onOpenChange={setShowCreatedKey}>
        <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="size-5 text-emerald-600" />
              {t('apiKeys.createSuccess')}
            </DialogTitle>
            <DialogDescription>{t('apiKeys.keyWarning')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="size-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                {t('apiKeys.keyWarning')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 rounded-lg bg-muted font-mono text-sm break-all select-all">
                {createdKeyValue}
              </code>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => createdKeyValue && handleCopyKey(createdKeyValue)}
              >
                {copiedKey ? (
                  <Check className="size-4 text-emerald-600" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowCreatedKey(false)}>
              {tc('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create API Key Dialog */}
      <Dialog open={createKeyDialogOpen} onOpenChange={setCreateKeyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('apiKeys.create')}</DialogTitle>
            <DialogDescription>
              Generate a new API key to access your data programmatically
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="key-name">{t('apiKeys.name')}</Label>
              <Input
                id="key-name"
                placeholder="e.g., Production API Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('apiKeys.permissions')}</Label>
              <Select value={newKeyPermissions} onValueChange={setNewKeyPermissions}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">{t('apiKeys.read')}</SelectItem>
                  <SelectItem value="write">{t('apiKeys.write')}</SelectItem>
                  <SelectItem value="admin">{t('apiKeys.admin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="key-expiry">{t('apiKeys.expiresAt')}</Label>
              <Input
                id="key-expiry"
                type="date"
                value={newKeyExpiry}
                onChange={(e) => setNewKeyExpiry(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground">{t('apiKeys.noExpiry')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateKeyDialogOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleCreateKey}
              disabled={creatingKey || !newKeyName.trim()}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            >
              {creatingKey && <Loader2 className="size-4 me-1 animate-spin" />}
              {tc('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Key Confirmation */}
      <AlertDialog open={!!revokeKeyId} onOpenChange={() => setRevokeKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('apiKeys.revokeConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('apiKeys.revokeWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeKey}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('apiKeys.revoke')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Separator />

      {/* ===== Webhooks Section ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="size-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle>{t('webhooks.title')}</CardTitle>
            </div>
            <Button
              onClick={() => {
                resetWebhookForm();
                setCreateWebhookDialogOpen(true);
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            >
              <Plus className="size-4 me-1" />
              {t('webhooks.create')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {webhooksLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-10 border rounded-lg border-dashed">
              <div className="rounded-full bg-muted p-3 mx-auto w-fit mb-3">
                <Webhook className="size-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{t('webhooks.noWebhooks')}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{t('webhooks.noWebhooksDesc')}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  resetWebhookForm();
                  setCreateWebhookDialogOpen(true);
                }}
              >
                <Plus className="size-4 me-1" />
                {t('webhooks.create')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className={cn(
                    'p-4 rounded-lg border transition-colors',
                    webhook.isActive
                      ? 'bg-card hover:bg-muted/30 border-border/50'
                      : 'bg-muted/20 border-border/30 opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{webhook.name}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            webhook.isActive
                              ? 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                              : 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                          )}
                        >
                          {webhook.isActive ? t('webhooks.active') : t('webhooks.inactive')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate font-mono">
                        {webhook.url}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {webhook.events.split(',').map((event) => (
                          <Badge key={event} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {getEventLabel(event)}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          {t('webhooks.lastTriggered')}: {formatDate(webhook.lastTriggeredAt)}
                        </span>
                        {webhook.failureCount > 0 && (
                          <span className="text-red-600 dark:text-red-400">
                            {t('webhooks.failureCount')}: {webhook.failureCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleCopySecret(webhook.secret, webhook.id)}
                          >
                            {copiedSecret === webhook.id ? (
                              <Check className="size-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                            <span className="sr-only">{t('webhooks.copySecret')}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('webhooks.copySecret')}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            disabled={testingWebhookId === webhook.id}
                            onClick={() => handleTestWebhook(webhook.id)}
                          >
                            {testingWebhookId === webhook.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Send className="size-3.5" />
                            )}
                            <span className="sr-only">{t('webhooks.test')}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('webhooks.test')}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEditWebhook(webhook)}
                          >
                            <Pencil className="size-3.5" />
                            <span className="sr-only">{tc('edit')}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{tc('edit')}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteWebhookId(webhook.id)}
                          >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">{tc('delete')}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{tc('delete')}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Webhook Dialog */}
      <Dialog
        open={createWebhookDialogOpen || editWebhookDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateWebhookDialogOpen(false);
            setEditWebhookDialogOpen(false);
            resetWebhookForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingWebhook ? t('webhooks.editWebhook') : t('webhooks.create')}
            </DialogTitle>
            <DialogDescription>
              {editingWebhook
                ? 'Update webhook endpoint and event subscriptions'
                : 'Set up a new webhook to receive real-time event notifications'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="wh-name">{t('webhooks.name')}</Label>
              <Input
                id="wh-name"
                placeholder="e.g., Slack Notification"
                value={whName}
                onChange={(e) => setWhName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wh-url">{t('webhooks.url')}</Label>
              <Input
                id="wh-url"
                placeholder={t('webhooks.urlPlaceholder')}
                value={whUrl}
                onChange={(e) => setWhUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('webhooks.events')}</Label>
              <p className="text-xs text-muted-foreground">{t('webhooks.selectEvents')}</p>
              <ScrollArea className="h-48 rounded-lg border p-3">
                <div className="space-y-2">
                  {WEBHOOK_EVENTS.map((event) => (
                    <label
                      key={event}
                      className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 transition-colors"
                    >
                      <Checkbox
                        checked={whEvents.includes(event)}
                        onCheckedChange={() => toggleEvent(event)}
                      />
                      <span className="text-sm">{getEventLabel(event)}</span>
                      <code className="text-[10px] text-muted-foreground ms-auto">{event}</code>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateWebhookDialogOpen(false);
                setEditWebhookDialogOpen(false);
                resetWebhookForm();
              }}
            >
              {tc('cancel')}
            </Button>
            <Button
              onClick={editingWebhook ? handleUpdateWebhook : handleCreateWebhook}
              disabled={savingWebhook || !whName.trim() || !whUrl.trim() || whEvents.length === 0}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            >
              {savingWebhook && <Loader2 className="size-4 me-1 animate-spin" />}
              {editingWebhook ? tc('save') : tc('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Webhook Confirmation */}
      <AlertDialog open={!!deleteWebhookId} onOpenChange={() => setDeleteWebhookId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('webhooks.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('webhooks.deleteWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWebhook}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Separator />

      {/* ===== API Documentation Section ===== */}
      <Collapsible open={docsOpen} onOpenChange={setDocsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <CardTitle>{t('docs.title')}</CardTitle>
                </div>
                <ChevronDown
                  className={cn(
                    'size-5 text-muted-foreground transition-transform duration-200',
                    docsOpen && 'rotate-180'
                  )}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6 pt-0">
              {/* Base URL */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t('docs.baseUrl')}</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 rounded-lg bg-muted font-mono text-sm">
                    {process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/v1
                  </code>
                </div>
              </div>

              {/* Authentication */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="size-4 text-emerald-600" />
                  {t('docs.auth')}
                </Label>
                <p className="text-sm text-muted-foreground">{t('docs.authDesc')}</p>
                <div className="rounded-lg bg-muted p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-muted-foreground">{"# "}{t('docs.authDesc')}</div>
                  <div>
                    <span className="text-blue-600 dark:text-blue-400">Authorization</span>: <span className="text-emerald-600 dark:text-emerald-400">Bearer</span> lv_live_your_api_key_here
                  </div>
                </div>
              </div>

              {/* Endpoints */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">{t('docs.endpoints')}</Label>
                {[
                  {
                    method: 'GET',
                    path: '/api/v1/licenses',
                    desc: t('docs.getLicenses'),
                    color: 'text-emerald-600',
                  },
                  {
                    method: 'GET',
                    path: '/api/v1/licenses/:id',
                    desc: t('docs.getLicense'),
                    color: 'text-emerald-600',
                  },
                  {
                    method: 'GET',
                    path: '/api/v1/compliance',
                    desc: t('docs.getCompliance'),
                    color: 'text-emerald-600',
                  },
                  {
                    method: 'GET',
                    path: '/api/v1/projects',
                    desc: t('docs.getProjects'),
                    color: 'text-emerald-600',
                  },
                ].map((endpoint) => (
                  <div
                    key={endpoint.path}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20"
                  >
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-mono text-xs px-2">
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono">{endpoint.path}</code>
                    <span className="text-xs text-muted-foreground ms-auto">{endpoint.desc}</span>
                  </div>
                ))}
              </div>

              {/* Example curl */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t('docs.example')}</Label>
                <div className="rounded-lg bg-slate-950 dark:bg-slate-900 p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-emerald-400">
{`curl -X GET \\
  ${process.env.NEXT_PUBLIC_API_URL || 'https://api.licensevault.app'}/api/v1/licenses \\
  -H "Authorization: Bearer lv_live_your_api_key" \\
  -H "Content-Type: application/json"`}
                  </pre>
                </div>
              </div>

              {/* Event Types Reference */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Webhook Event Types</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {WEBHOOK_EVENTS.map((event) => (
                    <div
                      key={event}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/30 text-sm"
                    >
                      <Webhook className="size-3.5 text-emerald-600 shrink-0" />
                      <code className="text-xs font-mono">{event}</code>
                      <span className="text-xs text-muted-foreground ms-auto">{getEventLabel(event)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Link to Full API Documentation */}
      <Card className="border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
                <Terminal className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-medium">{t('docs.viewFullDocs')}</p>
                <p className="text-sm text-muted-foreground">{t('docs.viewFullDocsDesc')}</p>
              </div>
            </div>
            <Link href="/developer-settings/api-docs">
              <Button variant="outline" className="gap-2 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                {t('docs.viewFullDocs')}
                <ExternalLink className="size-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
