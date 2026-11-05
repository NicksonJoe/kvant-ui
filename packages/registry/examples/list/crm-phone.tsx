import { Clock, LayoutGrid, Phone } from 'lucide-react';
import { useState } from 'react';
import { Avatar, Checkbox, IconButton, List, ListItem, cn } from '@/kvant';

const deals = [
  { id: 'bakery', title: 'Айдентика для пекарни', amount: '1 284 900 ₽', step: 'Подготовить презентацию концепций', due: 'Завтра, 10:00' },
  { id: 'mall', title: 'Навигация для ТЦ', amount: '1 920 000 ₽', step: 'Перезвонить по смете', due: '5 дней назад', overdue: true },
];

const initialTasks = [
  { id: 'deck', title: 'Подготовить презентацию концепций', deal: 'Айдентика для пекарни', due: 'Завтра, 10:00', done: false },
  { id: 'deck-v1', title: 'Подготовить презентацию концепций', deal: 'Айдентика для пекарни', due: 'Выполнена', done: true },
];

/** Section title 44 high: a counter, red when it counts problems, and «Все» on the right. */
function SectionHeader({ title, count, urgent = false }: { title: string; count: number; urgent?: boolean }) {
  return (
    <div className="flex h-11 items-center gap-1.5 px-4">
      <h3 className="text-heading-xs font-semibold text-fg-1">{title}</h3>
      <span className={cn('text-body-md tabular-nums', urgent ? 'text-danger-soft-fg' : 'text-fg-3')}>{count}</span>
      <a href="#all" className="ml-auto text-label-md font-medium text-accent">
        Все
      </a>
    </div>
  );
}

/** Rows of the phone CRM built from List: a deal with the next step, a task with its deal, a contact with a call. */
export default function ListCrmPhone() {
  const [tasks, setTasks] = useState(initialTasks);
  return (
    <div className="flex w-full max-w-[402px] flex-col gap-2 rounded-xl bg-background py-4 shadow-[inset_0_0_0_1px_var(--color-hairline)]">
      <SectionHeader title="Сделки" count={deals.length} />
      <div className="px-4">
        <List variant="inset" aria-label="Сделки">
          {deals.map((deal) => (
            <ListItem
              key={deal.id}
              href={`#${deal.id}`}
              title={deal.title}
              subtitle={
                <span className="flex items-center gap-1.5">
                  <Clock aria-hidden className={cn('size-3.5 shrink-0 stroke-2', deal.overdue ? 'text-danger' : 'text-fg-4')} />
                  <span className="truncate">{deal.step}</span>
                </span>
              }
              value={
                <span className="flex flex-col items-end">
                  <span className="text-label-lg font-semibold text-fg-1">{deal.amount}</span>
                  <span className={cn('text-caption', deal.overdue && 'font-medium text-danger-soft-fg')}>{deal.due}</span>
                </span>
              }
            />
          ))}
        </List>
      </div>

      <SectionHeader title="Просроченные шаги" count={2} urgent />
      <div className="px-4">
        <List variant="inset" aria-label="Задачи">
          {tasks.map((task) => (
            <ListItem
              key={task.id}
              leading={
                <Checkbox
                  size="lg"
                  aria-label={task.title}
                  checked={task.done}
                  onCheckedChange={(done) => setTasks((list) => list.map((item) => (item.id === task.id ? { ...item, done } : item)))}
                  className="size-6 rounded-full"
                />
              }
              title={<span className={cn(task.done && 'text-fg-3 line-through')}>{task.title}</span>}
              subtitle={
                <span className="flex items-center gap-2">
                  <span className="inline-flex h-5 min-w-0 items-center gap-1 rounded-full bg-fill-1 px-2 text-fg-2">
                    <LayoutGrid aria-hidden className="size-3 shrink-0" />
                    <span className="truncate">{task.deal}</span>
                  </span>
                  <span className={cn('shrink-0', task.done && 'text-success-soft-fg')}>{task.done ? 'Выполнена' : task.due}</span>
                </span>
              }
            />
          ))}
        </List>
      </div>

      <SectionHeader title="Контакты" count={1} />
      <div className="px-4">
        <List variant="inset" aria-label="Контакты">
          <ListItem
            leading={<Avatar name="Пётр Савин" size={40} />}
            title="Пётр Савин"
            subtitle="«Город» · Навигация для ТЦ"
            value={
              <IconButton variant="soft" size="lg" icon={<Phone />} aria-label="Позвонить: Пётр Савин" className="rounded-full" />
            }
          />
        </List>
      </div>
    </div>
  );
}
