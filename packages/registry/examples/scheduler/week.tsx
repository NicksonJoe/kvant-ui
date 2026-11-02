import { Scheduler, type SchedulerEvent } from '@/kvant';

const events: SchedulerEvent[] = [
  { id: 'brief', title: 'Бриф «Полка»', start: '2026-11-02T10:00', end: '2026-11-02T11:00', category: 'meeting' },
  { id: 'orbit', title: 'Звонок «Орбите»', start: '2026-11-02T12:30', end: '2026-11-02T13:30', category: 'call' },
  { id: 'demo', title: 'Демо', start: '2026-11-02T15:00', end: '2026-11-02T16:00', category: 'meeting' },
  { id: 'review', title: 'Ревью', start: '2026-11-02T15:30', end: '2026-11-02T16:30', category: 'meeting' },
  { id: 'estimate', title: 'Срок сметы', start: '2026-11-03', allDay: true, category: 'deadline' },
  { id: 'office', title: 'Встреча в офисе', start: '2026-11-03T11:00', end: '2026-11-03T12:30', category: 'meeting' },
];

export default function SchedulerWeek() {
  return (
    <Scheduler
      aria-label="Неделя менеджера"
      className="w-full"
      events={events}
      categories={[
        { id: 'meeting', label: 'Встречи', color: 'var(--color-chart-1)' },
        { id: 'call', label: 'Звонки', color: 'var(--color-chart-3)' },
        { id: 'deadline', label: 'Сроки', color: 'var(--color-chart-2)' },
      ]}
      defaultView="week"
      defaultDate="2026-11-02"
      today="2026-11-02"
      now="2026-11-02T13:20"
      startHour={9}
      endHour={18}
      selectedId="orbit"
    />
  );
}
