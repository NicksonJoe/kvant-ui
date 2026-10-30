import { SlidersHorizontal } from 'lucide-react';
import { Button, Checkbox, Sheet, SheetBody, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTrigger } from '@/kvant';

export default function SheetFilters() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" leadingIcon={<SlidersHorizontal />} />}>Фильтры</SheetTrigger>
      <SheetContent side="left">
        <SheetHeader title="Фильтры" description="Сделки студии" />
        <SheetBody>
          <div className="flex flex-col gap-3">
            <span className="text-label-sm font-medium text-fg-2">Этап</span>
            <Checkbox defaultChecked>Бриф</Checkbox>
            <Checkbox defaultChecked>Переговоры</Checkbox>
            <Checkbox>Договор</Checkbox>
            <Checkbox>Счёт выставлен</Checkbox>
          </div>
        </SheetBody>
        <SheetFooter>
          <Button variant="ghost" className="mr-auto">
            Сбросить
          </Button>
          <SheetClose render={<Button />}>Показать 12 сделок</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
