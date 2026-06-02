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
import { IntegrationData } from './types';

interface DisconnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: IntegrationData | null;
  onConfirm: () => void;
}

export function DisconnectDialog({
  open,
  onOpenChange,
  target,
  onConfirm,
}: DisconnectDialogProps) {
  const t = useTranslations('integrations');
  const tc = useTranslations('common');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('confirmDisconnect')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('confirmDisconnectDesc')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {t('disconnect')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
