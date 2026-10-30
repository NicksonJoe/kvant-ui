import { useState } from 'react';
import { Button, Steps, Tag } from '@/kvant';

const plans = ['Команда · 15 000 ₽/мес', 'Студия · 1 500 ₽/мес за место'];

export default function StepsVertical() {
  const [plan, setPlan] = useState(plans[0]);

  return (
    <div className="w-full max-w-xl rounded-xl bg-surface-1 p-6 shadow-raised">
      <Steps
        variant="vertical"
        current={2}
        steps={[
          { title: 'Компания', description: 'ООО «Студия Север», 12 сотрудников' },
          { title: 'Реквизиты', error: 'ИНН 7701234567 не найден в ФНС — проверьте цифры' },
          {
            title: 'Тариф',
            description: 'Сменить план можно в любой момент, разница пересчитается.',
            content: (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {plans.map((name) => (
                    <Tag key={name} size="md" selected={plan === name} onSelectedChange={() => setPlan(name)}>
                      {name}
                    </Tag>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm">Продолжить</Button>
                  <Button size="sm" variant="ghost">
                    Назад
                  </Button>
                </div>
              </div>
            ),
          },
          { title: 'Оплата', description: 'Счёт для юрлица или карта' },
        ]}
      />
    </div>
  );
}
