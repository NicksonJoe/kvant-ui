import { CalendarDays, CircleUser, Columns3, Megaphone, Wallet } from 'lucide-react';
import { useState } from 'react';
import { FilterBar, SearchField, type FilterField, type FilterValue } from '@/kvant';

const fields: FilterField[] = [
  {
    id: 'stage',
    label: 'Этап',
    icon: <Columns3 aria-hidden />,
    options: [
      { value: 'negotiation', label: 'Переговоры', count: 48 },
      { value: 'contract', label: 'Договор', count: 31 },
      { value: 'invoice', label: 'Счёт выставлен', count: 17 },
    ],
  },
  {
    id: 'owner',
    label: 'Ответственный',
    icon: <CircleUser aria-hidden />,
    options: [
      { value: 'anna', label: 'Анна Северова', count: 41 },
      { value: 'oleg', label: 'Олег Ильин', count: 27 },
      { value: 'vera', label: 'Вера Лебедева', count: 33 },
    ],
  },
  {
    id: 'source',
    label: 'Источник',
    icon: <Megaphone aria-hidden />,
    options: [
      { value: 'site', label: 'Сайт', count: 120 },
      { value: 'telegram', label: 'Telegram', count: 74 },
      { value: 'referral', label: 'Рекомендация', count: 58 },
    ],
  },
  {
    id: 'amount',
    label: 'Сумма',
    icon: <Wallet aria-hidden />,
    options: [
      { value: 'small', label: 'до 100 тыс ₽', count: 96 },
      { value: 'medium', label: '100 тыс – 1 млн ₽', count: 142 },
      { value: 'large', label: 'больше 1 млн ₽', count: 74 },
    ],
  },
  {
    id: 'created',
    label: 'Создана',
    icon: <CalendarDays aria-hidden />,
    options: [
      { value: 'week', label: 'На этой неделе', count: 12 },
      { value: 'month', label: 'В этом месяце', count: 38 },
    ],
  },
];

export default function FilterBarOverflow() {
  const [value, setValue] = useState<FilterValue>({
    stage: ['negotiation', 'contract'],
    owner: ['anna'],
    source: ['telegram'],
    amount: ['large'],
    created: ['month'],
  });
  return (
    // resize-x: drag the corner to watch chips fold into «Ещё N» and come back
    <div className="w-[800px] max-w-full min-w-[320px] resize-x overflow-hidden p-1">
      <FilterBar
        fields={fields}
        value={value}
        onValueChange={setValue}
        search={<SearchField aria-label="Поиск по сделкам" placeholder="Название, клиент, телефон" className="w-60" />}
        count={Object.keys(value).length > 0 ? '9 из 312' : '312 сделок'}
      />
    </div>
  );
}
