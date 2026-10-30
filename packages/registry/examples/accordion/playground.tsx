import { CreditCard, Upload } from 'lucide-react';
import { Accordion, AccordionItem } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => {
    const inset = p.pick('variant', ['plain', 'inset'] as const) === 'inset';
    return (
      <Accordion
        variant={inset ? 'inset' : 'plain'}
        multiple={p.bool('multiple')}
        disabled={p.bool('disabled')}
        defaultValue={['import']}
        className="w-full max-w-xl"
      >
        <AccordionItem value="import" title="Можно ли перенести данные из другой CRM?" icon={inset ? <Upload /> : undefined}>
          Да. Загрузите выгрузку в CSV или XLSX — мастер импорта сам сопоставит поля и покажет дубли до загрузки.
        </AccordionItem>
        <AccordionItem value="price" title="Как считается стоимость тарифа?" icon={inset ? <CreditCard /> : undefined}>
          По числу мест в команде. Оплатить можно по счёту или картой; при оплате за год скидка 15 %.
        </AccordionItem>
      </Accordion>
    );
  },
  code: (p) => `<Accordion${p.attrs(['variant', 'multiple', 'disabled'])} defaultValue={['import']}>
  <AccordionItem value="import" title="Можно ли перенести данные из другой CRM?">
    Да. Загрузите выгрузку в CSV или XLSX…
  </AccordionItem>
  <AccordionItem value="price" title="Как считается стоимость тарифа?">
    По числу мест в команде…
  </AccordionItem>
</Accordion>`,
};

export default playground;
