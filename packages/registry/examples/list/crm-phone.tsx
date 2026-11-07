import { Clock, LayoutGrid, Phone } from 'lucide-react';
import { useId, useState } from 'react';
import { Avatar, Checkbox, IconButton, List, ListItem, ListSectionHeader, cn } from '@/kvant';

const deals = [
  { id: 'bakery', title: 'Айдентика для пекарни', amount: '1 284 900 ₽', step: 'Подготовить презентацию концепций', due: 'Завтра, 10:00' },
  { id: 'mall', title: 'Навигация для ТЦ', amount: '1 920 000 ₽', step: 'Перезвонить по смете', due: '5 дней назад', overdue: true },
];

const initialTasks = [
  { id: 'deck', title: 'Подготовить презентацию концепций', deal: 'Айдентика для пекарни', due: 'Завтра, 10:00', done: false },
  { id: 'deck-v1', title: 'Подготовить презентацию концепций', deal: 'Айдентика для пекарни', due: 'Выполнена', done: true },
];

/** Rows of the phone CRM built from List: a deal with the next step, a task with its deal, a contact with a call. */
export default function ListCrmPhone() {
  const id = useId();
  const [tasks, setTasks] = useState(initialTasks);
  return (
    <div className="flex w-full max-w-[402px] flex-col gap-2 rounded-xl bg-background py-4 shadow-[inset_0_0_0_1px_var(--color-hairline)]">
      <ListSectionHeader title="Сделки" count={deals.length} action={<a href="#all" aria-label="Все: сделки">Все</a>} />
      <div className="px-4">
        <List variant="inset" aria-label="Сделки">
          {deals.map((deal) => (
            <ListItem
              key={deal.id}
              href={`#${deal.id}`}
              // phone rows of the CRM board: 13/18 subtitle 2 below the title, rows 67
              className="pt-[13px] pb-3.5"
              title={deal.title}
              subtitle={
                <span className="mt-0.5 flex items-center gap-1.5 text-body-xs text-fg-2">
                  <Clock aria-hidden className={cn('size-[13px] shrink-0 stroke-2', deal.overdue ? 'text-danger' : 'text-fg-4')} />
                  <span className="truncate">{deal.step}</span>
                </span>
              }
              value={
                <span className="flex flex-col items-end gap-0.5">
                  <span className="text-label-lg font-semibold text-fg-1">{deal.amount}</span>
                  <span className={cn('text-body-xs', deal.overdue && 'font-medium text-danger-soft-fg')}>{deal.due}</span>
                </span>
              }
            />
          ))}
        </List>
      </div>

      <ListSectionHeader title="Просроченные шаги" count={2} urgent action={<a href="#all" aria-label="Все: просроченные шаги">Все</a>} />
      <div className="px-4">
        <List variant="inset" aria-label="Задачи">
          {tasks.map((task) => (
            <ListItem
              key={task.id}
              // rows 71; the circle sits on the title line, not in the middle of the row
              className="pt-3 pb-[11px] *:first:-mt-0.5 *:first:self-start"
              leading={
                <Checkbox
                  shape="circle"
                  aria-label={task.title}
                  aria-describedby={`${id}-${task.id}`}
                  checked={task.done}
                  onCheckedChange={(done) => setTasks((list) => list.map((item) => (item.id === task.id ? { ...item, done } : item)))}
                />
              }
              title={<span className={cn(task.done && 'text-fg-3 line-through')}>{task.title}</span>}
              subtitle={
                // the deal and the date tell apart tasks with the same title
                <span id={`${id}-${task.id}`} className="mt-1.5 flex items-center gap-2 text-body-xs">
                  <span className="inline-flex h-5.5 min-w-0 items-center gap-[5px] rounded-full bg-fill-2 pr-2 pl-[7px] font-medium text-fg-2">
                    <LayoutGrid aria-hidden className="size-3 shrink-0 stroke-[2.25] text-fg-3" />
                    <span className="truncate">{task.deal}</span>
                  </span>
                  <span className={cn('shrink-0 tabular-nums', task.done ? 'font-medium text-success-soft-fg' : 'text-fg-3')}>{task.done ? 'Выполнена' : task.due}</span>
                </span>
              }
            />
          ))}
        </List>
      </div>

      <ListSectionHeader title="Контакты" count={1} action={<a href="#all" aria-label="Все: контакты">Все</a>} />
      <div className="px-4">
        <List variant="inset" aria-label="Контакты">
          <ListItem
            leading={<Avatar name="Пётр Савин" size={40} />}
            className="pt-3 pb-[11px]"
            title="Пётр Савин"
            subtitle={<span className="mt-0.5 block truncate text-body-xs">«Город» · Навигация для ТЦ</span>}
            value={
              <IconButton variant="soft" size="lg" icon={<Phone />} aria-label="Позвонить: Пётр Савин" className="rounded-full" />
            }
          />
        </List>
      </div>
    </div>
  );
}
