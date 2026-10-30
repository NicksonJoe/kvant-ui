import { Steps } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const steps = [
  { title: 'Компания', description: 'ООО «Студия Север»' },
  { title: 'Реквизиты', description: 'ИНН и счёт' },
  { title: 'Тариф', description: 'Выберите план' },
  { title: 'Оплата', description: 'Счёт или карта' },
];

const playground: Playground = {
  controls: [{ name: 'error', type: 'boolean', default: false, description: 'Ошибка на втором шаге.' }],
  render: (p) => (
    <Steps
      className="w-full max-w-3xl"
      current={p.pick('current', [0, 1, 2, 3] as const)}
      variant={p.pick('variant', ['horizontal', 'vertical', 'compact'] as const)}
      onStepClick={() => {}}
      steps={steps.map((step, index) => (index === 1 && p.bool('error') ? { ...step, error: 'ИНН не найден в ФНС' } : step))}
    />
  ),
  code: (p) => `<Steps${p.attrs(['current', 'variant'])}
  onStepClick={setCurrent}
  steps={[
    { title: 'Компания', description: 'ООО «Студия Север»' },
    { title: 'Реквизиты', ${p.bool('error') ? "error: 'ИНН не найден в ФНС'" : "description: 'ИНН и счёт'"} },
    { title: 'Тариф', description: 'Выберите план' },
    { title: 'Оплата', description: 'Счёт или карта' },
  ]}
/>`,
};

export default playground;
