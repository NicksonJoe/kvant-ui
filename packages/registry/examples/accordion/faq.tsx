import { Accordion, AccordionItem } from '@/kvant';

export default function AccordionFaq() {
  return (
    <Accordion defaultValue={['import']} className="w-full max-w-xl">
      <AccordionItem value="import" title="Можно ли перенести данные из другой CRM?">
        Да. Загрузите выгрузку в CSV или XLSX — мастер импорта сам сопоставит поля и покажет дубли до загрузки. Обычно перенос
        занимает 10–15 минут, история писем и звонков сохраняется.
      </AccordionItem>
      <AccordionItem value="price" title="Как считается стоимость тарифа?">
        По числу мест в команде. Гости и клиенты в общих сделках места не занимают.
      </AccordionItem>
      <AccordionItem value="storage" title="Где хранятся данные?">
        На серверах в России, с ежедневными резервными копиями. Выгрузить всё можно в любой момент.
      </AccordionItem>
      <AccordionItem value="mobile" title="Есть ли приложение для телефона?">
        Да, для iOS и Android: сделки, задачи и чат с клиентом.
      </AccordionItem>
    </Accordion>
  );
}
