import { useState } from 'react';
import { Button, Steps, type StepItem } from '@/kvant';

const steps: StepItem[] = [
  { title: 'Компания', description: 'ООО «Студия Север»' },
  { title: 'Реквизиты', error: 'ИНН не найден в ФНС' },
  { title: 'Тариф', description: 'Выберите план' },
  { title: 'Оплата', description: 'Счёт или карта' },
];

export default function StepsWizard() {
  const [current, setCurrent] = useState(2);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-5 rounded-xl bg-surface-1 p-5 shadow-raised">
      <Steps steps={steps} current={current} onStepClick={setCurrent} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" disabled={current === 0} onClick={() => setCurrent((step) => step - 1)}>
          Назад
        </Button>
        <Button disabled={current === steps.length - 1} onClick={() => setCurrent((step) => step + 1)}>
          Продолжить
        </Button>
      </div>
    </div>
  );
}
