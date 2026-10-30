import { Button, Field, Input, Sheet, SheetBody, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTrigger, Textarea } from '@/kvant';

export default function SheetClient() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="secondary" />}>Открыть клиента</SheetTrigger>
      <SheetContent>
        <SheetHeader title="Ольга Миронова" description="Пекарня «Хлебница» · клиент с 2024 года" />
        <SheetBody>
          <Field label="Телефон">
            <Input type="tel" defaultValue="+7 921 555-01-14" />
          </Field>
          <Field label="Почта">
            <Input type="email" defaultValue="olga@hlebnitsa.ru" />
          </Field>
          <Field label="Заметка" optional>
            <Textarea defaultValue="Предпочитает созвоны после 15:00." />
          </Field>
        </SheetBody>
        <SheetFooter>
          <Button variant="danger-soft" className="mr-auto">
            Архивировать
          </Button>
          <SheetClose render={<Button variant="secondary" />}>Отмена</SheetClose>
          <SheetClose render={<Button />}>Сохранить</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
