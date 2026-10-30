import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  DialogFooter,
  Field,
  Input,
} from '@/kvant';

const workspace = 'Студия Север';

/** For the irreversible: the action unlocks only when the name is typed (case and edge spaces do not matter). */
export default function AlertDialogTypeToConfirm() {
  const [typed, setTyped] = useState('');
  const confirmed = typed.trim().toLocaleLowerCase('ru') === workspace.toLocaleLowerCase('ru');

  return (
    <AlertDialog onOpenChange={(open) => (open ? undefined : setTyped(''))}>
      <AlertDialogTrigger render={<Button variant="danger-soft" />}>Удалить пространство</AlertDialogTrigger>
      <AlertDialogContent icon={<TriangleAlert />}>
        <AlertDialogTitle>Удалить рабочее пространство?</AlertDialogTitle>
        <AlertDialogDescription>
          Сделки, контакты и файлы «{workspace}» удалятся без возможности восстановления. Доступ потеряют 12 участников.
        </AlertDialogDescription>
        <Field label={`Введите «${workspace}», чтобы подтвердить`}>
          <Input value={typed} onValueChange={setTyped} autoComplete="off" />
        </Field>
        <DialogFooter>
          <AlertDialogClose render={<Button variant="secondary" />}>Отмена</AlertDialogClose>
          <AlertDialogClose render={<Button variant="danger" />} disabled={!confirmed}>
            Удалить навсегда
          </AlertDialogClose>
        </DialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
