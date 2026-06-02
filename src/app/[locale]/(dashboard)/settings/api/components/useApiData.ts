import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { ApiKeyData, WebhookData } from './types';

export function useApiData() {
  const t = useTranslations('apiAccess');
  const tc = useTranslations('common');

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
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  return {
    // Translations
    t,
    tc,
    // API Keys
    apiKeys,
    keysLoading,
    createKeyDialogOpen,
    setCreateKeyDialogOpen,
    newKeyName,
    setNewKeyName,
    newKeyPermissions,
    setNewKeyPermissions,
    newKeyExpiry,
    setNewKeyExpiry,
    creatingKey,
    createdKeyValue,
    showCreatedKey,
    setShowCreatedKey,
    revokeKeyId,
    setRevokeKeyId,
    copiedKey,
    handleCreateKey,
    handleRevokeKey,
    handleCopyKey,
    handleCopyPrefix,
    // Webhooks
    webhooks,
    webhooksLoading,
    createWebhookDialogOpen,
    setCreateWebhookDialogOpen,
    editWebhookDialogOpen,
    setEditWebhookDialogOpen,
    editingWebhook,
    whName,
    setWhName,
    whUrl,
    setWhUrl,
    whEvents,
    savingWebhook,
    deleteWebhookId,
    setDeleteWebhookId,
    testingWebhookId,
    copiedSecret,
    handleCreateWebhook,
    handleUpdateWebhook,
    handleDeleteWebhook,
    handleTestWebhook,
    handleCopySecret,
    openEditWebhook,
    resetWebhookForm,
    toggleEvent,
    // Docs
    docsOpen,
    setDocsOpen,
  };
}
