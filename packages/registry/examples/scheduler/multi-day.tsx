import { useState } from 'react';
import { Scheduler, type SchedulerCategory, type SchedulerEvent } from '@/kvant';

const categories: SchedulerCategory[] = [
  { id: 'meeting', label: 'Встречи', color: 'var(--color-chart-1)' },
  { id: 'call', label: 'Звонки', color: 'var(--color-chart-3)' },
  { id: 'away', label: 'Отсутствия', color: 'var(--color-chart-4)' },
  { id: 'deadline', label: 'Сроки', color: 'var(--color-chart-2)' },
];

const events: SchedulerEvent[] = [
  { id: 'fair', title: 'Выставка «Ремесло»', start: '2026-11-19', end: '2026-11-24', allDay: true, category: 'meeting' },
  { id: 'vacation', title: 'Отпуск Глеба Орлова', start: '2026-11-20', end: '2026-11-27', allDay: true, category: 'away' },
  { id: 'audit', title: 'Сверка склада', start: '2026-11-23', end: '2026-11-25', allDay: true, category: 'meeting' },
  { id: 'report', title: 'Отчёт для «Полюса»', start: '2026-11-24', allDay: true, category: 'deadline' },
  { id: 'lead', title: 'Звонок по заявке с сайта', start: '2026-11-24T12:00', end: '2026-11-24T12:30', category: 'call' },
  { id: 'offer', title: 'КП «Зерну и пару» на 480 000 ₽', start: '2026-11-19T15:00', end: '2026-11-19T16:00', category: 'call' },
  { id: 'trip', title: 'Командировка в Казань', start: '2026-11-10', end: '2026-11-12', allDay: true, category: 'meeting' },
  { id: 'close', title: 'Закрыть месяц', start: '2026-11-30', end: '2026-12-01', allDay: true, category: 'deadline' },
];

export default function SchedulerMultiDay() {
  const [selected, setSelected] = useState<string>();
  return (
    <Scheduler
      aria-label="Календарь отдела продаж"
      className="w-full"
      events={events}
      categories={categories}
      defaultDate="2026-11-19"
      today="2026-11-19"
      selectedId={selected}
      onSelect={setSelected}
    />
  );
}
