import { RadioGroup, RadioItem } from '@/kvant';

export default function RadioGroupHorizontal() {
  return (
    <RadioGroup aria-label="Способ оплаты" orientation="horizontal" defaultValue="card">
      <RadioItem value="card">Картой</RadioItem>
      <RadioItem value="invoice">По счёту</RadioItem>
      <RadioItem value="cash" disabled>
        Наличными
      </RadioItem>
    </RadioGroup>
  );
}
