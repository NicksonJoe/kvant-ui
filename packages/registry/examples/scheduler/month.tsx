import { useState } from 'react';
import { Scheduler, type SchedulerCategory, type SchedulerEvent } from '@/kvant';

const categories: SchedulerCategory[] = [
  { id: 'meeting', label: 'Встречи', color: 'var(--color-chart-1)' },
  { id: 'call', label: 'Звонки', color: 'var(--color-chart-3)' },
  { id: 'demo', label: 'Демо', color: 'var(--color-chart-5)' },
  { id: 'deadline', label: 'Сроки', color: 'var(--color-chart-2)' },
];

const events: SchedulerEvent[] = [
  { id: 'market', title: 'Звонок «Маркет 24»', start: '2026-10-28T11:00', end: '2026-10-28T11:30', category: 'call' },
  { id: 'brief', title: 'Бриф «Полка»', start: '2026-11-02T10:00', end: '2026-11-02T11:00', category: 'meeting' },
  { id: 'orbit', title: 'Звонок «Орбите»', start: '2026-11-02T12:30', end: '2026-11-02T13:30', category: 'call' },
  { id: 'demo1', title: 'Демо', start: '2026-11-02T15:00', end: '2026-11-02T16:00', category: 'demo' },
  { id: 'review', title: 'Ревью', start: '2026-11-02T15:30', end: '2026-11-02T16:30', category: 'meeting' },
  { id: 'estimate', title: 'Срок сметы', start: '2026-11-03', allDay: true, category: 'deadline' },
  { id: 'office', title: 'Встреча в офисе', start: '2026-11-03T11:00', end: '2026-11-03T12:30', category: 'meeting' },
  { id: 'standup', title: 'Планёрка', start: '2026-11-05T09:30', end: '2026-11-05T10:00', category: 'meeting' },
  { id: 'tea', title: '«Чайная лавка»', start: '2026-11-05T14:00', end: '2026-11-05T15:00', category: 'call' },
  { id: 'mockups', title: 'Ревью макетов', start: '2026-11-05T16:00', end: '2026-11-05T17:00', category: 'meeting' },
  { id: 'honey', title: 'Демо «Мёду»', start: '2026-11-05T17:00', end: '2026-11-05T18:00', category: 'demo' },
  { id: 'litera', title: 'Демо «Литере»', start: '2026-11-06T12:00', end: '2026-11-06T13:00', category: 'demo' },
  { id: 'standup2', title: 'Планёрка', start: '2026-11-09T09:30', end: '2026-11-09T10:00', category: 'meeting' },
  { id: 'trip', title: 'Командировка в Казань · «Зерно и пар»', start: '2026-11-10', end: '2026-11-12', allDay: true, category: 'meeting' },
  { id: 'gusev', title: '«Лавка Гусева»', start: '2026-11-11T17:00', end: '2026-11-11T18:00', category: 'call' },
  { id: 'identity', title: 'Сдача айдентики', start: '2026-11-13', allDay: true, category: 'deadline' },
  { id: 'efir', title: 'Демо «Эфиру»', start: '2026-11-17T11:00', end: '2026-11-17T12:00', category: 'demo' },
  { id: 'covers', title: 'Обложки «Тихий эфир»', start: '2026-11-19', allDay: true, category: 'deadline' },
  { id: 'quarter', title: 'Итоги квартала', start: '2026-11-25T10:00', end: '2026-11-25T11:30', category: 'meeting' },
  { id: 'close', title: 'Закрыть месяц', start: '2026-11-30', allDay: true, category: 'deadline' },
];

export default function SchedulerMonth() {
  const [selected, setSelected] = useState<string>();
  return (
    <Scheduler
      aria-label="Календарь студии"
      className="w-full"
      events={events}
      categories={categories}
      defaultDate="2026-11-03"
      today="2026-11-02"
      now="2026-11-02T13:20"
      selectedId={selected}
      onSelect={setSelected}
    />
  );
}
