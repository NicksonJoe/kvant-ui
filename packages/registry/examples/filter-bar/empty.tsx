import { CalendarDays, CircleUser } from 'lucide-react';
import { useState } from 'react';
import { FilterBar, type FilterField, type FilterValue } from '@/kvant';

const fields: FilterField[] = [
  {
    id: 'assignee',
    label: 'Исполнитель',
    icon: <CircleUser aria-hidden />,
    options: [
      { value: 'ilya', label: 'Илья Громов' },
      { value: 'vera', label: 'Вера Лебедева' },
    ],
  },
  {
    id: 'due',
    label: 'Срок',
    icon: <CalendarDays aria-hidden />,
    options: [
      { value: 'overdue', label: 'Просрочено', count: 2 },
      { value: 'week', label: 'На этой неделе', count: 5 },
      { value: 'later', label: 'Позже', count: 7 },
    ],
  },
];

export default function FilterBarEmpty() {
  const [value, setValue] = useState<FilterValue>({});
  return <FilterBar className="w-full max-w-xl" fields={fields} value={value} onValueChange={setValue} count="14 задач" />;
}
