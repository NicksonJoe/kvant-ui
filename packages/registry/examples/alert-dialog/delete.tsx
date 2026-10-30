import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  toast,
} from '@/kvant';

export default function AlertDialogDelete() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="danger-soft" />}>Удалить сделку</AlertDialogTrigger>
      <AlertDialogContent icon={<Trash2 />}>
        <AlertDialogTitle>Удалить сделку?</AlertDialogTitle>
        <AlertDialogDescription>
          «Айдентика для пекарни» исчезнет вместе с задачами и файлами. Это нельзя отменить.
        </AlertDialogDescription>
        <div className="flex justify-end gap-2 pt-2">
          <AlertDialogClose render={<Button variant="secondary" />}>Отмена</AlertDialogClose>
          <AlertDialogClose render={<Button variant="danger" />} onClick={() => toast.add({ title: 'Сделка удалена' })}>
            Удалить
          </AlertDialogClose>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
