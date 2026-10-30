import { Send } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from '@/kvant';

export default function AlertDialogSend() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="secondary" leadingIcon={<Send />} />}>Отправить смету</AlertDialogTrigger>
      <AlertDialogContent icon={<Send />} tone="accent">
        <AlertDialogTitle>Отправить смету клиенту?</AlertDialogTitle>
        <AlertDialogDescription>Ольга Миронова получит письмо со ссылкой. Изменить смету после отправки нельзя.</AlertDialogDescription>
        <div className="flex justify-end gap-2 pt-2">
          <AlertDialogClose render={<Button variant="secondary" />}>Отмена</AlertDialogClose>
          <AlertDialogClose render={<Button />}>Отправить</AlertDialogClose>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
