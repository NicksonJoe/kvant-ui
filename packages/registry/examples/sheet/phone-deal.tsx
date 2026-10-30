import { ChevronRight, FileText, MessageCircle, Phone } from 'lucide-react';
import { Avatar, Button, Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTrigger } from '@/kvant';

const contacts = [
  { name: 'Ольга Литвинова', role: 'Директор по маркетингу' },
  { name: 'Павел Громов', role: 'Финансовый директор' },
];
const files = [
  { name: 'Бриф_Норда_ребрендинг.pdf', meta: '8,4 МБ · 28.10' },
  { name: 'КП_Орбита_Лаб_v2.pdf', meta: '1,9 МБ · 27.10' },
  { name: 'Смета_октябрь.xlsx', meta: '46 КБ · 24.10' },
];

/** Phone record card at the large detent (92 %): the list scrolls first, the sheet follows once it is at the top. */
export default function SheetPhoneDeal() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="secondary" />}>Сделка на телефоне</SheetTrigger>
      <SheetContent side="bottom" defaultDetent="large">
        <SheetHeader title="Ребрендинг «Орбита Лаб»" description="«Орбита Лаб» · Анна Северова" />
        <SheetBody>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-display-sm font-semibold tabular-nums">1 284 900 ₽</span>
            <span className="text-body-xs text-fg-3">вероятность 60 %</span>
          </div>
          <section className="flex flex-col">
            <h3 className="pb-1 text-label-sm font-medium text-fg-3">Контакты</h3>
            {contacts.map((contact) => (
              <div key={contact.name} className="flex items-center gap-3 py-2">
                <Avatar name={contact.name} size={32} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-label-md font-medium">{contact.name}</span>
                  <span className="text-caption text-fg-3">{contact.role}</span>
                </span>
                <ChevronRight aria-hidden className="size-4 text-fg-4" />
              </div>
            ))}
          </section>
          <section className="flex flex-col">
            <h3 className="pb-1 text-label-sm font-medium text-fg-3">Файлы · 3</h3>
            {files.map((file) => (
              <div key={file.name} className="flex items-center gap-3 py-2">
                <FileText aria-hidden className="size-5 stroke-[1.5] text-fg-3" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-label-md font-medium">{file.name}</span>
                  <span className="text-caption text-fg-3 tabular-nums">{file.meta}</span>
                </span>
              </div>
            ))}
          </section>
        </SheetBody>
        <SheetFooter>
          <Button size="lg" variant="secondary" leadingIcon={<Phone />}>
            Позвонить
          </Button>
          <Button size="lg" leadingIcon={<MessageCircle />}>
            Написать
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
