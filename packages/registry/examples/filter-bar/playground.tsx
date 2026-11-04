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
  {
    id: 'source',
    label: 'Источник',
    options: [
      { value: 'site', label: 'Сайт' },
      { value: 'telegram', label: 'Telegram' },
    ],
  },
];

function Demo({ count, width }: { count: string; width: number }) {
  const [value, setValue] = useState<FilterValue>({ stage: ['negotiation'], owner: ['anna', 'oleg'], source: ['telegram'] });
  return (
    <div className="max-w-full" style={{ width }}>
      <FilterBar fields={fields} value={value} onValueChange={setValue} count={count || undefined} />
    </div>
  );
}

const playground: Playground = {
  initial: { count: '48 из 312' },
  controls: [{ name: 'width', type: 'number', options: [720, 900, 1200], default: 720, description: 'Ширина строки: в узкой лишние чипы уходят в «Ещё N».' }],
  render: (p) => <Demo count={p.text('count')} width={p.num('width')} />,
  code: (p) => `<FilterBar fields={fields} value={value} onValueChange={setValue}${p.attrs(['count'])} />`,
};

export default playground;
