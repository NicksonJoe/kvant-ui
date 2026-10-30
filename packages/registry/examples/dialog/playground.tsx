import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <Dialog>
      <DialogTrigger render={<Button />}>Открыть диалог</DialogTrigger>
      <DialogContent size={p.pick('size', ['sm', 'md', 'lg'] as const)} showClose={p.bool('showClose')}>
        <DialogTitle>Новая задача</DialogTitle>
        <DialogDescription>Задача появится в карточке сделки.</DialogDescription>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>Отмена</DialogClose>
          <DialogClose render={<Button />}>Создать</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  code: (p) => `<Dialog>
  <DialogTrigger render={<Button />}>Открыть диалог</DialogTrigger>
  <DialogContent${p.attrs(['size', 'showClose'])}>
    <DialogTitle>Новая задача</DialogTitle>
    <DialogDescription>Задача появится в карточке сделки.</DialogDescription>
    <DialogFooter>
      <DialogClose render={<Button variant="secondary" />}>Отмена</DialogClose>
      <DialogClose render={<Button />}>Создать</DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
};

export default playground;
