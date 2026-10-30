import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => {
    const tone = p.pick('tone', ['danger', 'accent'] as const);
    return (
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant={tone === 'danger' ? 'danger-soft' : 'secondary'} />}>Удалить сделку</AlertDialogTrigger>
        <AlertDialogContent icon={<Trash2 />} tone={tone}>
          <AlertDialogTitle>Удалить сделку?</AlertDialogTitle>
          <AlertDialogDescription>Сделка исчезнет вместе с задачами и файлами.</AlertDialogDescription>
          <div className="flex justify-end gap-2 pt-2">
            <AlertDialogClose render={<Button variant="secondary" />}>Отмена</AlertDialogClose>
            <AlertDialogClose render={<Button variant={tone === 'danger' ? 'danger' : 'primary'} />}>Удалить</AlertDialogClose>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    );
  },
  code: (p) => `<AlertDialog>
  <AlertDialogTrigger render={<Button variant="danger-soft" />}>Удалить сделку</AlertDialogTrigger>
  <AlertDialogContent icon={<Trash2 />}${p.attrs(['tone'])}>
    <AlertDialogTitle>Удалить сделку?</AlertDialogTitle>
    <AlertDialogDescription>Сделка исчезнет вместе с задачами и файлами.</AlertDialogDescription>
    <div className="flex justify-end gap-2 pt-2">
      <AlertDialogClose render={<Button variant="secondary" />}>Отмена</AlertDialogClose>
      <AlertDialogClose render={<Button variant="danger" />}>Удалить</AlertDialogClose>
    </div>
  </AlertDialogContent>
</AlertDialog>`,
};

export default playground;
