import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Key, Copy, Check } from 'lucide-react';

interface ApiKeysCreatedKeyDialogProps {
  t: (key: string) => string;
  tc: (key: string) => string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyValue: string | null;
  copied: boolean;
  onCopy: (key: string) => void;
}

export function ApiKeysCreatedKeyDialog({
  t,
  tc,
  open,
  onOpenChange,
  keyValue,
  copied,
  onCopy,
}: ApiKeysCreatedKeyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              {keyValue}
            </code>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => keyValue && onCopy(keyValue)}
            >
              {copied ? (
                <Check className="size-4 text-emerald-600" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{tc('close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
