'use client';

import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { SubsidiaryInfo } from './types';

interface UnlinkDialogProps {
  unlinkTarget: SubsidiaryInfo | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function UnlinkDialog({
  unlinkTarget,
  onOpenChange,
  onConfirm,
}: UnlinkDialogProps) {
  const t = useTranslations('organization');

  return (
    <AlertDialog open={!!unlinkTarget} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('hierarchy.unlinkConfirm')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('hierarchy.unlinkWarning')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('profile.save') === 'Save Profile' ? 'Cancel' : 'إلغاء'}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {t('hierarchy.unlink')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
