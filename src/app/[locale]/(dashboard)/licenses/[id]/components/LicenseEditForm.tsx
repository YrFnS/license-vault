import { useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Hash, Calendar } from 'lucide-react';

interface EditFormState {
  name: string;
  type: string;
  licenseNumber: string;
  issuedBy: string;
  issueDate: string;
  expirationDate: string;
  notes: string;
}

interface LicenseEditFormProps {
  editForm: EditFormState;
  setEditForm: React.Dispatch<React.SetStateAction<EditFormState>>;
}

export function LicenseEditForm({ editForm, setEditForm }: LicenseEditFormProps) {
  const t = useTranslations('licenses');

  return (
    <div className="space-y-6">
      {/* Identification Group */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Hash className="size-4" />
          {t('detail.identification')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">{t('form.name')}</Label>
            <Input
              id="edit-name"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t('form.namePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-type">{t('form.type')}</Label>
            <Input
              id="edit-type"
              value={editForm.type}
              onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
              placeholder={t('form.typePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-licenseNumber">{t('form.licenseNumber')}</Label>
            <Input
              id="edit-licenseNumber"
              value={editForm.licenseNumber}
              onChange={(e) => setEditForm((f) => ({ ...f, licenseNumber: e.target.value }))}
              placeholder={t('form.licenseNumberPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-issuedBy">{t('form.issuedBy')}</Label>
            <Input
              id="edit-issuedBy"
              value={editForm.issuedBy}
              onChange={(e) => setEditForm((f) => ({ ...f, issuedBy: e.target.value }))}
              placeholder={t('form.issuedByPlaceholder')}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Dates Group */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Calendar className="size-4" />
          {t('detail.dates')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-issueDate">{t('form.issueDate')}</Label>
            <Input
              id="edit-issueDate"
              type="date"
              value={editForm.issueDate}
              onChange={(e) => setEditForm((f) => ({ ...f, issueDate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-expirationDate">{t('form.expirationDate')}</Label>
            <Input
              id="edit-expirationDate"
              type="date"
              value={editForm.expirationDate}
              onChange={(e) => setEditForm((f) => ({ ...f, expirationDate: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="edit-notes">{t('form.notes')}</Label>
        <Textarea
          id="edit-notes"
          value={editForm.notes}
          onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder={t('form.notesPlaceholder')}
          rows={3}
        />
      </div>
    </div>
  );
}
