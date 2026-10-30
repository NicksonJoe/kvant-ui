import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  toast,
} from '@/kvant';

export default function DialogForm() {
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>Новая задача</DialogTrigger>
      <DialogContent>
        <DialogTitle>Новая задача</DialogTitle>
        <DialogDescription>Задача появится в карточке сделки и в календаре ответственного.</DialogDescription>
        <Field label="Что сделать">
          <Input placeholder="Позвонить Ольге Мироновой" />
        </Field>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>Отмена</DialogClose>
          <DialogClose render={<Button />} onClick={() => toast.add({ title: 'Задача создана', type: 'success' })}>
            Создать задачу
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
