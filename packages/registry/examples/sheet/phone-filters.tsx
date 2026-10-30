import { useState } from 'react';
import { Button, Sheet, SheetBody, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTrigger, Tag } from '@/kvant';

const stages = ['Квалификация', 'Переговоры', 'Предложение', 'Договор', 'Проиграна'] as const;

/** Phone: opens at the medium detent; drag the grabber up for 92 % or down to close. */
export default function SheetPhoneFilters() {
  const [picked, setPicked] = useState<readonly string[]>(['Переговоры', 'Предложение']);
  const toggle = (stage: string) =>
    setPicked((current) => (current.includes(stage) ? current.filter((item) => item !== stage) : [...current, stage]));

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="secondary" />}>Фильтры на телефоне</SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader
          title="Фильтры"
          leading={
            <Button variant="link" size="lg" onClick={() => setPicked([])}>
              Сбросить
            </Button>
          }
        />
        <SheetBody>
          <div className="flex flex-col gap-2">
            <span className="text-label-sm font-medium text-fg-3">Этап</span>
            <div className="flex flex-wrap gap-2">
              {stages.map((stage) => (
                <Tag key={stage} size="md" selected={picked.includes(stage)} onSelectedChange={() => toggle(stage)}>
                  {stage}
                </Tag>
              ))}
            </div>
          </div>
        </SheetBody>
        <SheetFooter>
          <SheetClose render={<Button size="xl" />}>Показать 12 сделок</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
