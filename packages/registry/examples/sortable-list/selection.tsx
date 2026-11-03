import { useState } from 'react';
import { SortableList } from '@/kvant';

interface Task {
  id: string;
  title: string;
}

const initial: Task[] = [
  { id: 'estimate', title: 'Согласовать смету с «Издательством Полка»' },
  { id: 'call', title: 'Позвонить «Чайной лавке» по упаковке' },
  { id: 'contract', title: 'Отправить договор «Орбите Лаб» юристу' },
  { id: 'deck', title: 'Подготовить презентацию для «Полярного света»' },
  { id: 'invoice', title: 'Выставить счёт «Маркету 24»' },
  { id: 'update', title: 'Обновить смету по упаковке' },
  { id: 'review', title: 'Ревью макетов «Литеры»' },
];

/** Selected rows in a run merge into one plate; dragging any of them moves the whole selection. */
export default function Selection() {
  const [tasks, setTasks] = useState(initial);
  const [selected, setSelected] = useState<string[]>(['call', 'contract', 'deck', 'review']);
  return (
    <SortableList
      aria-label="Задачи"
      className="w-full max-w-160"
      items={tasks}
      onItemsChange={setTasks}
      selected={selected}
      onSelectedChange={setSelected}
      getLabel={(task) => task.title}
      renderItem={(task) => <span className="block truncate">{task.title}</span>}
    />
  );
}
