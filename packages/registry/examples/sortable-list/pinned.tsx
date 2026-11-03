import { useState } from 'react';
import { SortableList } from '@/kvant';

interface Step {
  id: string;
  title: string;
  due: string;
  late?: boolean;
  pinned?: boolean;
}

const initial: Step[] = [
  { id: 'close', title: 'Закрыть сделку «Айдентика и сайт»', due: 'пт', pinned: true },
  { id: 'contract', title: 'Отправить договор «Орбите Лаб» юристу', due: '5 ноя' },
  { id: 'deck', title: 'Подготовить презентацию для «Полярного света»', due: 'вчера', late: true },
  { id: 'call', title: 'Позвонить «Чайной лавке» по упаковке', due: 'сегодня' },
  { id: 'invoice', title: 'Выставить счёт «Маркету 24»', due: '7 ноя' },
  { id: 'review', title: 'Ревью макетов «Литеры»', due: '8 ноя' },
];

/** Dense list: rows stay put and a line shows the place; the pinned first row refuses a drop. */
export default function Pinned() {
  const [steps, setSteps] = useState(initial);
  return (
    <SortableList
      aria-label="План по сделке"
      className="w-full max-w-160"
      indicator="line"
      items={steps}
      onItemsChange={setSteps}
      isPinned={(step) => step.pinned === true}
      getLabel={(step) => step.title}
      renderItem={(step) => (
        <div className="flex items-center gap-2.5">
          <span className="min-w-0 flex-1 truncate">{step.title}</span>
          <span className={step.late ? 'w-14 shrink-0 text-right text-label-sm text-danger-soft-fg' : 'w-14 shrink-0 text-right text-label-sm text-fg-3'}>{step.due}</span>
        </div>
      )}
    />
  );
}
