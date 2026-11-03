import { useState } from 'react';
import { SortableList } from '@/kvant';

interface Widget {
  id: string;
  title: string;
  value: string;
  note: string;
  tone?: 'up' | 'down';
}

const initial: Widget[] = [
  { id: 'revenue', title: 'Выручка · октябрь', value: '1 284 900 ₽', note: '+12,4 % к сентябрю', tone: 'up' },
  { id: 'clients', title: 'Новые клиенты', value: '38', note: '+6 за неделю', tone: 'up' },
  { id: 'check', title: 'Средний чек', value: '33 813 ₽', note: '+3,1 % к сентябрю', tone: 'up' },
  { id: 'deals', title: 'Сделок в работе', value: '248', note: '18,4 млн ₽' },
  { id: 'overdue', title: 'Просрочено задач', value: '3', note: 'из 41 на неделе', tone: 'down' },
  { id: 'invoices', title: 'Счета к оплате', value: '17', note: '2,1 млн ₽' },
];

/** Summary widgets: the handle shows on hover in the top right corner. */
export default function Widgets() {
  const [widgets, setWidgets] = useState(initial);
  return (
    <SortableList
      aria-label="Виджеты сводки"
      className="w-full max-w-190"
      layout="grid"
      items={widgets}
      onItemsChange={setWidgets}
      getLabel={(widget) => widget.title}
      renderItem={(widget) => (
        <>
          <p className="text-label-sm font-medium text-fg-3">{widget.title}</p>
          <p className={widget.tone === 'down' ? 'text-heading-md font-semibold text-danger-soft-fg tabular-nums' : 'text-heading-md font-semibold tabular-nums'}>{widget.value}</p>
          <p className={widget.tone === 'up' ? 'text-caption font-medium text-success-soft-fg' : 'text-caption font-medium text-fg-3'}>{widget.note}</p>
        </>
      )}
    />
  );
}
