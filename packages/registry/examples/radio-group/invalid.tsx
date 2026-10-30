import { useState } from 'react';
import { RadioGroup, RadioItem } from '@/kvant';

export default function RadioGroupInvalid() {
  const [picked, setPicked] = useState(false);
  return (
    <RadioGroup
      label="Способ оплаты"
      error={picked ? undefined : 'Выберите способ оплаты, чтобы продолжить'}
      onValueChange={() => setPicked(true)}
    >
      <RadioItem value="card">Картой онлайн</RadioItem>
      <RadioItem value="invoice">По счёту для юрлица</RadioItem>
    </RadioGroup>
  );
}
