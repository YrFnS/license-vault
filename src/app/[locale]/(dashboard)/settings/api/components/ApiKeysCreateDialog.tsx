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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface ApiKeysCreateDialogProps {
  t: (key: string) => string;
  tc: (key: string) => string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (v: string) => void;
  permissions: string;
  onPermissionsChange: (v: string) => void;
  expiry: string;
  onExpiryChange: (v: string) => void;
  creating: boolean;
  onCreate: () => void;
}

export function ApiKeysCreateDialog({
  t,
  tc,
  open,
  onOpenChange,
  name,
  onNameChange,
  permissions,
  onPermissionsChange,
  expiry,
  onExpiryChange,
  creating,
  onCreate,
}: ApiKeysCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('apiKeys.permissions')}</Label>
            <Select value={permissions} onValueChange={onPermissionsChange}>
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
              value={expiry}
              onChange={(e) => onExpiryChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground">{t('apiKeys.noExpiry')}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button
            onClick={onCreate}
            disabled={creating || !name.trim()}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
          >
            {creating && <Loader2 className="size-4 me-1 animate-spin" />}
            {tc('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
