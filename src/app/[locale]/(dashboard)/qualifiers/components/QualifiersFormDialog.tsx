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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { CEProgressBar } from './QualifierBadges';
import { US_STATES } from './constants';
import type { QualifierForm } from './types';

interface QualifiersFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editMode: boolean;
  form: QualifierForm;
  onFormChange: (form: QualifierForm) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function QualifiersFormDialog({
  open,
  onOpenChange,
  editMode,
  form,
  onFormChange,
  saving,
  onSave,
  onCancel,
}: QualifiersFormDialogProps) {
  const t = useTranslations('qualifiers');
  const tc = useTranslations('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? t('editQualifier') : t('addQualifier')}</DialogTitle>
          <DialogDescription>
            {editMode ? tc('edit') : t('addQualifier')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('firstName')} *</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => onFormChange({ ...form, firstName: e.target.value })}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t('lastName')} *</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => onFormChange({ ...form, lastName: e.target.value })}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => onFormChange({ ...form, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => onFormChange({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">{t('licenseNumber')}</Label>
              <Input
                id="licenseNumber"
                value={form.licenseNumber}
                onChange={(e) => onFormChange({ ...form, licenseNumber: e.target.value })}
                placeholder="QL-2024-12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseState">{t('licenseState')}</Label>
              <Select value={form.licenseState} onValueChange={(v) => onFormChange({ ...form, licenseState: v === '__none__' ? '' : v })}>
                <SelectTrigger id="licenseState">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licenseType">{t('licenseType')}</Label>
              <Input
                id="licenseType"
                value={form.licenseType}
                onChange={(e) => onFormChange({ ...form, licenseType: e.target.value })}
                placeholder="e.g., General Contractor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseExpiry">{t('licenseExpiry')}</Label>
              <Input
                id="licenseExpiry"
                type="date"
                value={form.licenseExpiry}
                onChange={(e) => onFormChange({ ...form, licenseExpiry: e.target.value })}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-semibold">{t('ceProgress')}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ceHoursEarned">{t('ceHoursEarned')}</Label>
                <Input
                  id="ceHoursEarned"
                  type="number"
                  min={0}
                  value={form.ceHoursEarned}
                  onChange={(e) => onFormChange({ ...form, ceHoursEarned: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ceHoursRequired">{t('ceHoursRequired')}</Label>
                <Input
                  id="ceHoursRequired"
                  type="number"
                  min={0}
                  value={form.ceHoursRequired}
                  onChange={(e) => onFormChange({ ...form, ceHoursRequired: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            {form.ceHoursRequired > 0 && (
              <CEProgressBar earned={form.ceHoursEarned} required={form.ceHoursRequired} />
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">{t('status')}</Label>
              <Select value={form.status} onValueChange={(v) => onFormChange({ ...form, status: v })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('active')}</SelectItem>
                  <SelectItem value="expiring">{t('expiring')}</SelectItem>
                  <SelectItem value="expired">{t('expired')}</SelectItem>
                  <SelectItem value="ce_deficient">{t('ceDeficient')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('notes')}</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => onFormChange({ ...form, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {tc('cancel')}
          </Button>
          <Button
            onClick={onSave}
            disabled={saving || !form.firstName || !form.lastName}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin me-2" />
            ) : null}
            {editMode ? tc('save') : tc('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
