import { useState } from 'react';
import { Avatar, Checkbox, SortableList } from '@/kvant';

interface Task {
  id: string;
  title: string;
  owner: string;
  color: string;
  due: string;
  late?: boolean;
}

const initial: Task[] = [
  { id: 'estimate', title: 'Согласовать смету с «Издательством Полка»', owner: 'Вера Лебедева', color: 'var(--color-chart-5)', due: '4 ноя' },
  { id: 'call', title: 'Позвонить «Чайной лавке» по упаковке', owner: 'Анна Северова', color: 'var(--color-chart-3)', due: 'сегодня' },
  { id: 'contract', title: 'Отправить договор «Орбите Лаб» юристу', owner: 'Илья Громов', color: 'var(--color-chart-2)', due: '5 ноя' },
  { id: 'deck', title: 'Подготовить презентацию для «Полярного света»', owner: 'Пётр Ильин', color: 'var(--color-chart-1)', due: 'вчера', late: true },
];

export default function Tasks() {
  const [tasks, setTasks] = useState(initial);
  const [done, setDone] = useState<string[]>([]);
  return (
    <SortableList
      aria-label="Задачи на неделю"
      className="w-full max-w-160"
      items={tasks}
      onItemsChange={setTasks}
      getLabel={(task) => task.title}
      renderItem={(task) => (
        <div className="flex items-center gap-2.5">
          <Checkbox
            aria-label={`Готово: ${task.title}`}
            checked={done.includes(task.id)}
            onCheckedChange={(checked) => setDone((ids) => (checked ? [...ids, task.id] : ids.filter((id) => id !== task.id)))}
          />
          <span className="min-w-0 flex-1 truncate">{task.title}</span>
          <Avatar
            name={task.owner}
            size={24}
            style={{ background: `color-mix(in oklab, ${task.color} 14%, transparent)`, color: task.color }}
          />
          <span className={task.late ? 'w-14 shrink-0 text-right text-label-sm text-danger-soft-fg' : 'w-14 shrink-0 text-right text-label-sm text-fg-3'}>{task.due}</span>
        </div>
      )}
    />
  );
}
