'use client';

import { useTranslations } from 'next-intl';
import { Flag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { VendorScoreData } from '../types';

interface FlagVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVendor: VendorScoreData | null;
  flagReason: string;
  setFlagReason: (reason: string) => void;
  onSubmit: () => void;
}

export function FlagVendorDialog({ open, onOpenChange, selectedVendor, flagReason, setFlagReason, onSubmit }: FlagVendorDialogProps) {
  const t = useTranslations('vendorScores');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Flag className="size-5 text-red-500" /> {t('flagVendor')}</DialogTitle>
        </DialogHeader>
        {selectedVendor && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedVendor.isFlagged ? t('unflag') : t('flag')}: <span className="font-semibold text-foreground">{selectedVendor.vendorName}</span>
            </p>
            {!selectedVendor.isFlagged && (
              <div className="space-y-2">
                <Label>{t('flagReason')}</Label>
                <Textarea value={flagReason} onChange={e => setFlagReason(e.target.value)} placeholder={t('flagReasonPlaceholder')} rows={3} />
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); }}>Cancel</Button>
          <Button onClick={onSubmit} variant={selectedVendor?.isFlagged ? 'outline' : 'destructive'}>
            {selectedVendor?.isFlagged ? t('unflag') : t('flag')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
