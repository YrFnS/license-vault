import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { WEBHOOK_EVENTS } from './constants';
import { useEventLabel } from './helpers';
import type { WebhookData } from './types';

interface WebhookFormDialogProps {
  t: (key: string) => string;
  tc: (key: string) => string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingWebhook: WebhookData | null;
  name: string;
  onNameChange: (v: string) => void;
  url: string;
  onUrlChange: (v: string) => void;
  events: string[];
  onToggleEvent: (event: string) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function WebhookFormDialog({
  t,
  tc,
  open,
  onOpenChange,
  editingWebhook,
  name,
  onNameChange,
  url,
  onUrlChange,
  events,
  onToggleEvent,
  saving,
  onSave,
  onCancel,
}: WebhookFormDialogProps) {
  const getEventLabel = useEventLabel();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wh-url">{t('webhooks.url')}</Label>
            <Input
              id="wh-url"
              placeholder={t('webhooks.urlPlaceholder')}
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
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
                      checked={events.includes(event)}
                      onCheckedChange={() => onToggleEvent(event)}
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
          <Button variant="outline" onClick={onCancel}>
            {tc('cancel')}
          </Button>
          <Button
            onClick={onSave}
            disabled={saving || !name.trim() || !url.trim() || events.length === 0}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
          >
            {saving && <Loader2 className="size-4 me-1 animate-spin" />}
            {editingWebhook ? tc('save') : tc('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
