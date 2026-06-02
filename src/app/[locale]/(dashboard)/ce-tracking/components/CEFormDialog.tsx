'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import type { License } from './types';
import { CATEGORIES } from './constants';

interface CEFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRecord: boolean;
  saving: boolean;
  licenses: License[];
  formLicenseId: string;
  setFormLicenseId: (v: string) => void;
  formCourseName: string;
  setFormCourseName: (v: string) => void;
  formProvider: string;
  setFormProvider: (v: string) => void;
  formHoursEarned: string;
  setFormHoursEarned: (v: string) => void;
  formHoursRequired: string;
  setFormHoursRequired: (v: string) => void;
  formCompletionDate: string;
  setFormCompletionDate: (v: string) => void;
  formCategory: string;
  setFormCategory: (v: string) => void;
  formNotes: string;
  setFormNotes: (v: string) => void;
  getCategoryLabel: (cat: string) => string;
  onSave: () => void;
}

export function CEFormDialog({
  open,
  onOpenChange,
  editingRecord,
  saving,
  licenses,
  formLicenseId,
  setFormLicenseId,
  formCourseName,
  setFormCourseName,
  formProvider,
  setFormProvider,
  formHoursEarned,
  setFormHoursEarned,
  formHoursRequired,
  setFormHoursRequired,
  formCompletionDate,
  setFormCompletionDate,
  formCategory,
  setFormCategory,
  formNotes,
  setFormNotes,
  getCategoryLabel,
  onSave,
}: CEFormDialogProps) {
  const t = useTranslations('ceTracking');
  const tCommon = useTranslations('common');

  const disabled = saving || !formLicenseId || !formCourseName || !formProvider || !formHoursEarned || !formCompletionDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingRecord ? t('editRecord') : t('addRecord')}</DialogTitle>
          <DialogDescription>
            {editingRecord ? t('editRecord') : t('addRecord')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* License */}
          <div className="space-y-2">
            <Label htmlFor="ce-license">{t('license')}</Label>
            <Select value={formLicenseId} onValueChange={setFormLicenseId}>
              <SelectTrigger id="ce-license">
                <SelectValue placeholder={t('licensePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {licenses.map((lic) => (
                  <SelectItem key={lic.id} value={lic.id}>
                    {lic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course Name */}
          <div className="space-y-2">
            <Label htmlFor="ce-course">{t('courseName')}</Label>
            <Input
              id="ce-course"
              value={formCourseName}
              onChange={(e) => setFormCourseName(e.target.value)}
              placeholder={t('courseNamePlaceholder')}
            />
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label htmlFor="ce-provider">{t('provider')}</Label>
            <Input
              id="ce-provider"
              value={formProvider}
              onChange={(e) => setFormProvider(e.target.value)}
              placeholder={t('providerPlaceholder')}
            />
          </div>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ce-hours-earned">{t('hoursEarned')}</Label>
              <Input
                id="ce-hours-earned"
                type="number"
                step="0.5"
                min="0"
                value={formHoursEarned}
                onChange={(e) => setFormHoursEarned(e.target.value)}
                placeholder={t('hoursEarnedPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ce-hours-required">{t('hoursRequired')}</Label>
              <Input
                id="ce-hours-required"
                type="number"
                step="0.5"
                min="0"
                value={formHoursRequired}
                onChange={(e) => setFormHoursRequired(e.target.value)}
                placeholder={t('hoursRequiredPlaceholder')}
              />
            </div>
          </div>

          {/* Completion Date */}
          <div className="space-y-2">
            <Label htmlFor="ce-date">{t('completionDate')}</Label>
            <Input
              id="ce-date"
              type="date"
              value={formCompletionDate}
              onChange={(e) => setFormCompletionDate(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="ce-category">{t('category')}</Label>
            <Select value={formCategory} onValueChange={setFormCategory}>
              <SelectTrigger id="ce-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="ce-notes">{t('notes')}</Label>
            <Textarea
              id="ce-notes"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button
            onClick={onSave}
            disabled={disabled}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin me-2" />
                {tCommon('loading')}
              </>
            ) : (
              tCommon('save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
