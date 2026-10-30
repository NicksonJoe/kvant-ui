import { RadioGroup, RadioItem } from '@/kvant';

export default function RadioGroupTouch() {
  return (
    <RadioGroup aria-label="Доставка документов" size="lg" defaultValue="edo" className="w-80 max-w-full">
      <RadioItem value="courier" description="Москва и Петербург, 1–2 дня">
        Курьером
      </RadioItem>
      <RadioItem value="edo" description="Подпишем за несколько минут">
        Через ЭДО
      </RadioItem>
      <RadioItem value="mail" description="5–7 дней по России">
        Заказным письмом
      </RadioItem>
    </RadioGroup>
  );
}
