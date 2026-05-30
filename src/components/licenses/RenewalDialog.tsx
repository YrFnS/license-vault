'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Calendar, CheckCircle2, Clock, User } from 'lucide-react';
import { toast } from 'sonner';

interface RenewalEntry {
  date: string;
  notes: string;
  renewedBy: string;
}

interface RenewalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: {
    id: string;
    name: string;
    expirationDate: string;
    renewalHistory?: string | null;
  };
  onRenewed: () => void;
}

export function RenewalDialog({
  open,
  onOpenChange,
  license,
  onRenewed,
}: RenewalDialogProps) {
  const t = useTranslations('renewal');
  const tc = useTranslations('common');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Calculate new expiration date (1 year from current)
  const currentExpiration = new Date(license.expirationDate);
  const newExpirationDate = new Date(currentExpiration);
  newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 1);

  const formatDate = (dateStr: string | Date) => {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Parse renewal history
  let renewalHistory: RenewalEntry[] = [];
  if (license.renewalHistory) {
    try {
      renewalHistory = JSON.parse(license.renewalHistory);
    } catch {
      renewalHistory = [];
    }
  }

  const handleRenew = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/licenses/${license.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data.error || 'Failed to renew license';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      setNotes('');
      onOpenChange(false);
      onRenewed();
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="size-5 text-emerald-600 dark:text-emerald-400" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* License name */}
          <div className="rounded-lg bg-muted/50 border p-3">
            <p className="text-sm font-semibold">{license.name}</p>
          </div>

          {/* Current & New expiration dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {t('currentExpiration')}
              </p>
              <p className="text-sm font-semibold">{formatDate(license.expirationDate)}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-1">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {t('newExpiration')}
              </p>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                {formatDate(newExpirationDate)}
              </p>
            </div>
          </div>

          {/* Renewal notes */}
          <div className="space-y-2">
            <Label htmlFor="renewal-notes" className="text-sm font-medium">
              {t('notes')}
            </Label>
            <Textarea
              id="renewal-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              rows={3}
            />
          </div>

          {/* Renewal History */}
          {renewalHistory.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  {t('history')}
                </p>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {renewalHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3"
                    >
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {t('renewedOn', { date: formatDate(entry.date) })}
                        </p>
                        {entry.renewedBy && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <User className="size-3" />
                            {entry.renewedBy}
                          </p>
                        )}
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleRenew}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm"
          >
            {loading ? (
              <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin me-2" />
            ) : (
              <RefreshCw className="size-4 me-2" />
            )}
            {t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
