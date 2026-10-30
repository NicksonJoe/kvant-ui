import { ArrowRight, CreditCard, Shield, Upload, Zap } from 'lucide-react';
import { Accordion, AccordionItem, Badge, Button } from '@/kvant';

export default function AccordionInset() {
  return (
    <Accordion variant="inset" defaultValue={['billing']} className="w-full max-w-xl">
      <AccordionItem value="import" icon={<Upload />} title="Подключение и перенос данных">
        Импорт из CSV и XLSX, синхронизация почты и календаря. Дубли показываются до загрузки.
      </AccordionItem>
      <AccordionItem value="billing" icon={<CreditCard />} title="Оплата и закрывающие документы">
        <p>
          Счёт на юрлицо приходит первого числа, акт и счёт-фактура — в ЭДО до пятого. Оплатить можно по счёту или картой; при
          оплате за год скидка 15 %.
        </p>
        <Button variant="link" size="sm" trailingIcon={<ArrowRight />} className="mt-3">
          Все вопросы об оплате
        </Button>
      </AccordionItem>
      <AccordionItem value="security" icon={<Shield />} title="Безопасность и доступы">
        Роли, двухфакторный вход и журнал действий. Доступ к сделке можно ограничить одним человеком.
      </AccordionItem>
      <AccordionItem
        value="1c"
        icon={<Zap />}
        disabled
        title={
          <>
            Интеграция с 1С <Badge>в декабре</Badge>
          </>
        }
      >
        Скоро.
      </AccordionItem>
    </Accordion>
  );
}
