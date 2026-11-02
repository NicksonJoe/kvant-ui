import { CalendarPlus, Check, Ellipsis } from 'lucide-react';
import { useState } from 'react';
import { SwipeActions } from '@/kvant';

const initial = [
  { id: 'bakery', title: 'Айдентика для пекарни', next: 'Подготовить презентацию', amount: '1 284 900 ₽' },
  { id: 'mall', title: 'Навигация для ТЦ', next: 'Перезвонить по смете', amount: '1 920 000 ₽' },
  { id: 'yacht', title: 'Сайт для яхт-клуба', next: 'Отправить смету', amount: '860 000 ₽' },
];

export default function SwipeActionsDeals() {
  const [done, setDone] = useState<string[]>([]);
  return (
    <ul className="w-full max-w-sm overflow-hidden rounded-xl shadow-raised">
      {initial.map((deal) => (
        <li key={deal.id} className="border-b border-separator last:border-b-0">
          <SwipeActions
            leading={[{ id: 'done', label: 'Готово', icon: <Check aria-hidden />, tone: 'success', onSelect: () => setDone((list) => [...list, deal.id]) }]}
            trailing={[
              { id: 'task', label: 'Задача', icon: <CalendarPlus aria-hidden />, onSelect: () => {} },
              { id: 'more', label: 'Ещё', icon: <Ellipsis aria-hidden />, tone: 'neutral', onSelect: () => {} },
            ]}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className={done.includes(deal.id) ? 'text-label-md text-fg-3 line-through' : 'text-label-md font-medium text-fg-1'}>{deal.title}</span>
                <span className="truncate text-body-xs text-fg-2">{deal.next}</span>
              </div>
              <span className="text-label-md font-semibold tabular-nums">{deal.amount}</span>
            </div>
          </SwipeActions>
        </li>
      ))}
    </ul>
  );
}
