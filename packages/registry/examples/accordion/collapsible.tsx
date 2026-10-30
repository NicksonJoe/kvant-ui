import { Copy } from 'lucide-react';
import { Button, Collapsible, DataList, DataListItem } from '@/kvant';

export default function AccordionCollapsible() {
  return (
    <Collapsible
      title="Реквизиты для счёта"
      summary="ООО «Студия Север» · ИНН 7701234567"
      openSummary="Проверены по ЕГРЮЛ 27.10.2026"
      className="w-full max-w-xl"
    >
      <DataList className="[&_dt]:sm:w-35">
        <DataListItem label="ИНН / КПП">7701234567 / 770101001</DataListItem>
        <DataListItem label="Расчётный счёт">40702 810 9 3800 0012 345</DataListItem>
        <DataListItem label="Банк">АО «Банк Северный», г. Москва</DataListItem>
        <DataListItem label="БИК / корр. счёт">044525974 / 30101 810 1 4525 0000 974</DataListItem>
      </DataList>
      <Button variant="secondary" size="sm" leadingIcon={<Copy />} className="mt-3">
        Скопировать реквизиты
      </Button>
    </Collapsible>
  );
}
