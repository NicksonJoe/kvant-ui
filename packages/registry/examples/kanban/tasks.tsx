import { useState } from 'react';
import { Kanban, KanbanCard, type KanbanItems } from '@/kvant';

interface Task {
  id: string;
  title: string;
}

const columns = [
  { id: 'todo', title: 'Сделать' },
  { id: 'doing', title: 'В работе', limit: 2 },
  { id: 'done', title: 'Готово' },
];

export default function KanbanTasks() {
  const [items, setItems] = useState<KanbanItems<Task>>({
    todo: [
      { id: 'brief', title: 'Собрать бриф по сайту' },
      { id: 'kp', title: 'Подготовить КП для «Кофе Лаб»' },
    ],
    doing: [{ id: 'layout', title: 'Макеты страниц' }],
    done: [{ id: 'call', title: 'Созвон с клиентом' }],
  });
  return (
    <Kanban
      aria-label="Задачи проекта"
      className="w-full"
      columns={columns}
      items={items}
      onItemsChange={setItems}
      getLabel={(task) => task.title}
      onAdd={(column) =>
        setItems((current) => ({ ...current, [column]: [...(current[column] ?? []), { id: `task-${Date.now()}`, title: 'Новая задача' }] }))
      }
      renderCard={(task) => <KanbanCard className="text-label-md">{task.title}</KanbanCard>}
    />
  );
}
