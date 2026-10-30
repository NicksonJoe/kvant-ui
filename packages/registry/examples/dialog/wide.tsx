import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/kvant';

export default function DialogWide() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="secondary" />}>Условия договора</DialogTrigger>
      <DialogContent size="lg">
        <DialogTitle>Условия договора</DialogTitle>
        <DialogDescription>Договор № 114 с пекарней «Хлебница» от 29 октября 2026 года.</DialogDescription>
        <div className="flex max-h-64 flex-col gap-3 overflow-y-auto text-body-sm text-fg-2">
          <p>1. Студия разрабатывает логотип, упаковку для трёх видов хлеба и вывеску.</p>
          <p>2. Стоимость работ — 1 284 900 ₽, оплата в два этапа: 50 % при подписании, 50 % после сдачи.</p>
          <p>3. Срок — 6 недель с момента получения брифа. Две итерации правок входят в стоимость.</p>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>Закрыть</DialogClose>
          <Button>Отправить на подпись</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
