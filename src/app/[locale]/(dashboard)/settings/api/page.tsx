'use client';

import { useTranslations } from 'next-intl';
import { Key } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  ApiKeysSection,
  ApiKeysCreateDialog,
  ApiKeysCreatedKeyDialog,
  ApiKeysRevokeDialog,
  WebhooksSection,
  WebhookFormDialog,
  WebhookDeleteDialog,
  ApiDocsSection,
  ApiDocsFullLink,
  useApiData,
} from './components';

export default function ApiAccessPage() {
  const t = useTranslations('apiAccess');
  const tc = useTranslations('common');
  const d = useApiData();

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
      <ApiKeysSection
        t={t}
        apiKeys={d.apiKeys}
        keysLoading={d.keysLoading}
        onCreateClick={() => d.setCreateKeyDialogOpen(true)}
        onRevokeClick={d.setRevokeKeyId}
        onCopyPrefix={d.handleCopyPrefix}
      />

      <ApiKeysCreatedKeyDialog
        t={t}
        tc={tc}
        open={d.showCreatedKey}
        onOpenChange={d.setShowCreatedKey}
        keyValue={d.createdKeyValue}
        copied={d.copiedKey}
        onCopy={d.handleCopyKey}
      />

      <ApiKeysCreateDialog
        t={t}
        tc={tc}
        open={d.createKeyDialogOpen}
        onOpenChange={d.setCreateKeyDialogOpen}
        name={d.newKeyName}
        onNameChange={d.setNewKeyName}
        permissions={d.newKeyPermissions}
        onPermissionsChange={d.setNewKeyPermissions}
        expiry={d.newKeyExpiry}
        onExpiryChange={d.setNewKeyExpiry}
        creating={d.creatingKey}
        onCreate={d.handleCreateKey}
      />

      <ApiKeysRevokeDialog
        t={t}
        tc={tc}
        open={!!d.revokeKeyId}
        onOpenChange={() => d.setRevokeKeyId(null)}
        onConfirm={d.handleRevokeKey}
      />

      <Separator />

      {/* ===== Webhooks Section ===== */}
      <WebhooksSection
        t={t}
        tc={tc}
        webhooks={d.webhooks}
        webhooksLoading={d.webhooksLoading}
        testingWebhookId={d.testingWebhookId}
        copiedSecret={d.copiedSecret}
        onCreateClick={() => {
          d.resetWebhookForm();
          d.setCreateWebhookDialogOpen(true);
        }}
        onEdit={d.openEditWebhook}
        onDelete={d.setDeleteWebhookId}
        onTest={d.handleTestWebhook}
        onCopySecret={d.handleCopySecret}
      />

      <WebhookFormDialog
        t={t}
        tc={tc}
        open={d.createWebhookDialogOpen || d.editWebhookDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            d.setCreateWebhookDialogOpen(false);
            d.setEditWebhookDialogOpen(false);
            d.resetWebhookForm();
          }
        }}
        editingWebhook={d.editingWebhook}
        name={d.whName}
        onNameChange={d.setWhName}
        url={d.whUrl}
        onUrlChange={d.setWhUrl}
        events={d.whEvents}
        onToggleEvent={d.toggleEvent}
        saving={d.savingWebhook}
        onSave={d.editingWebhook ? d.handleUpdateWebhook : d.handleCreateWebhook}
        onCancel={() => {
          d.setCreateWebhookDialogOpen(false);
          d.setEditWebhookDialogOpen(false);
          d.resetWebhookForm();
        }}
      />

      <WebhookDeleteDialog
        t={t}
        tc={tc}
        open={!!d.deleteWebhookId}
        onOpenChange={() => d.setDeleteWebhookId(null)}
        onConfirm={d.handleDeleteWebhook}
      />

      <Separator />

      {/* ===== API Documentation Section ===== */}
      <ApiDocsSection t={t} open={d.docsOpen} onOpenChange={d.setDocsOpen} />

      {/* Link to Full API Documentation */}
      <ApiDocsFullLink t={t} />
    </div>
  );
}
