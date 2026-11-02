import { useState } from 'react';
import { FilterBar, SearchField, type FilterField, type FilterValue } from '@/kvant';

const fields: FilterField[] = [
  {
    id: 'stage',
    label: 'Этап',
    options: [
      { value: 'qualification', label: 'Квалификация', count: 64 },
      { value: 'negotiation', label: 'Переговоры', count: 48 },
      { value: 'contract', label: 'Договор', count: 31 },
      { value: 'invoice', label: 'Счёт выставлен', count: 17 },
      { value: 'paid', label: 'Оплачено', count: 152 },
    ],
  },
  {
    id: 'owner',
    label: 'Ответственный',
    options: [
      { value: 'anna', label: 'Анна Северова', count: 41 },
      { value: 'oleg', label: 'Олег Ильин', count: 27 },
      { value: 'vera', label: 'Вера Лебедева', count: 33 },
    ],
  },
  {
    id: 'source',
    label: 'Источник',
    options: [
      { value: 'site', label: 'Сайт', count: 120 },
      { value: 'telegram', label: 'Telegram', count: 74 },
      { value: 'referral', label: 'Рекомендация', count: 58 },
    ],
  },
];

export default function FilterBarDeals() {
  const [value, setValue] = useState<FilterValue>({ stage: ['negotiation'], owner: ['anna', 'oleg'] });
  const filtered = Object.keys(value).length > 0;
  return (
    <FilterBar
      className="w-full"
      fields={fields}
      value={value}
      onValueChange={setValue}
      search={<SearchField aria-label="Поиск по сделкам" placeholder="Название, клиент, телефон" className="w-60" />}
      count={filtered ? '48 из 312' : '312 сделок'}
    />
  );
}
