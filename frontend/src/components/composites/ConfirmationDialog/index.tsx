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

export type ConfirmationDialogProps = {
  title: string;
  description: string;
  confirmText: string;
  showDialog: boolean;
  onConfirm: () => void;
  setShowDialog: (showDialog: boolean) => void;
  confirmButtonVariant?: 'destructive' | 'default';
  loading?: boolean;
};

export function ConfirmationDialog({
  title,
  description,
  confirmText,
  showDialog,
  onConfirm,
  setShowDialog,
  confirmButtonVariant,
  loading,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={showDialog}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowDialog(false)}>キャンセル</AlertDialogCancel>
          <AlertDialogAction variant={confirmButtonVariant} onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
