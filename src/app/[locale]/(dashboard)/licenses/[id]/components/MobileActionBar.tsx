import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Pencil, RefreshCw, X, Check } from 'lucide-react';
import { DeleteDialog } from './DeleteDialog';
import type { LicenseData } from './types';

interface MobileActionBarProps {
  license: LicenseData;
  isEditing: boolean;
  saving: boolean;
  canManageLicenses: boolean;
  onEnterEditMode: () => void;
  onCancelEdit: () => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  onRenewClick: () => void;
}

export function MobileActionBar({
  license,
  isEditing,
  saving,
  canManageLicenses,
  onEnterEditMode,
  onCancelEdit,
  onSave,
  onDelete,
  onRenewClick,
}: MobileActionBarProps) {
  const t = useTranslations('licenses');
  const tR = useTranslations('renewal');

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t">
      <div className="flex items-center justify-between gap-2 p-3 max-w-lg mx-auto">
        {!isEditing ? (
          <>
            <Button onClick={onEnterEditMode} variant="outline" size="sm" className="gap-1.5 flex-1">
              <Pencil className="size-3.5" />
              {t('detail.editLicense')}
            </Button>
            <Button onClick={onRenewClick} size="sm" className="gap-1.5 flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
              <RefreshCw className="size-3.5" />
              {tR('renewButton')}
            </Button>
            <DeleteDialog licenseName={license.name} onDelete={onDelete} compact />
          </>
        ) : (
          <>
            <Button onClick={onCancelEdit} variant="outline" size="sm" className="gap-1.5 flex-1">
              <X className="size-3.5" />
              {t('detail.cancelEdit')}
            </Button>
            <Button onClick={onSave} disabled={saving} size="sm" className="gap-1.5 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving ? (
                <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              {t('detail.saveChanges')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
