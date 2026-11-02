import { useState } from 'react';
import { FilterBar, type FilterField, type FilterValue } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const fields: FilterField[] = [
  {
    id: 'stage',
    label: 'Этап',
    options: [
      { value: 'negotiation', label: 'Переговоры', count: 48 },
      { value: 'contract', label: 'Договор', count: 31 },
    ],
  },
  {
    id: 'owner',
    label: 'Ответственный',
    options: [
      { value: 'anna', label: 'Анна' },
      { value: 'oleg', label: 'Олег' },
    ],
  },
];

function Demo({ count }: { count: string }) {
  const [value, setValue] = useState<FilterValue>({ stage: ['negotiation'] });
  return <FilterBar className="w-full" fields={fields} value={value} onValueChange={setValue} count={count || undefined} />;
}

const playground: Playground = {
  initial: { count: '48 из 312' },
  render: (p) => <Demo count={p.text('count')} />,
  code: (p) => `<FilterBar fields={fields} value={value} onValueChange={setValue}${p.attrs(['count'])} />`,
};

export default playground;
