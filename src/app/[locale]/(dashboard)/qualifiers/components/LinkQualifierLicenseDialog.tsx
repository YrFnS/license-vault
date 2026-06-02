'use client';

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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { OrgLicense, Qualifier } from './types';

interface LinkQualifierLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkingQualifier: Qualifier | null;
  orgLicenses: OrgLicense[];
  selectedLicenseId: string;
  onSelectedLicenseIdChange: (id: string) => void;
  linkRole: string;
  onLinkRoleChange: (role: string) => void;
  linking: boolean;
  onLink: () => void;
}

export function LinkQualifierLicenseDialog({
  open,
  onOpenChange,
  linkingQualifier,
  orgLicenses,
  selectedLicenseId,
  onSelectedLicenseIdChange,
  linkRole,
  onLinkRoleChange,
  linking,
  onLink,
}: LinkQualifierLicenseDialogProps) {
  const t = useTranslations('qualifiers');
  const tc = useTranslations('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('linkLicense')}</DialogTitle>
          <DialogDescription>
            Link a license to {linkingQualifier?.firstName} {linkingQualifier?.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select License</Label>
            <Select value={selectedLicenseId} onValueChange={onSelectedLicenseIdChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a license..." />
              </SelectTrigger>
              <SelectContent>
                {orgLicenses.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name} ({l.licenseNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('role')}</Label>
            <Select value={linkRole} onValueChange={onLinkRoleChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qualifier">Qualifier</SelectItem>
                <SelectItem value="rmo">Responsible Managing Officer</SelectItem>
                <SelectItem value="rme">Responsible Managing Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button
            onClick={onLink}
            disabled={linking || !selectedLicenseId}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            {linking ? <Loader2 className="size-4 animate-spin me-2" /> : null}
            {t('linkLicense')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
