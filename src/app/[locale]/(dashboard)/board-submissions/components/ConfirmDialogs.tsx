'use client';

import { Send, Loader2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogsProps {
  submitConfirmOpen: boolean;
  onSubmitConfirmOpenChange: (open: boolean) => void;
  submitTarget: { id: string } | null;
  submitting: boolean;
  onSubmitToBoard: () => void;
  deleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  onDelete: () => void;
  t: (key: string) => string;
  tc: (key: string) => string;
}

export function ConfirmDialogs({
  submitConfirmOpen, onSubmitConfirmOpenChange, submitting, onSubmitToBoard,
  deleteOpen, onDeleteOpenChange, onDelete,
  t, tc,
}: ConfirmDialogsProps) {
  return (
    <>
      {/* Submit Confirmation */}
      <AlertDialog open={submitConfirmOpen} onOpenChange={onSubmitConfirmOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmSubmit')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmSubmitDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onSubmitToBoard}
              disabled={submitting}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              {submitting ? <Loader2 className="size-4 me-2 animate-spin" /> : <Send className="size-4 me-2" />}
              {tc('submit')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={onDeleteOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDeleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-red-600 text-white hover:bg-red-700">
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
