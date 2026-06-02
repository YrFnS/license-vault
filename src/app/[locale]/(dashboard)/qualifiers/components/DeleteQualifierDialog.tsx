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
import { Loader2 } from 'lucide-react';

interface DeleteQualifierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qualifierName?: string;
  deleting: boolean;
  onDelete: () => void;
}

export function DeleteQualifierDialog({
  open,
  onOpenChange,
  qualifierName,
  deleting,
  onDelete,
}: DeleteQualifierDialogProps) {
  const t = useTranslations('qualifiers');
  const tc = useTranslations('common');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteQualifier')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('deleteConfirm')}
            <br />
            <span className="text-amber-600 dark:text-amber-400 font-medium">{t('deleteWarning')}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{tc('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? <Loader2 className="size-4 animate-spin me-2" /> : null}
            {tc('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
