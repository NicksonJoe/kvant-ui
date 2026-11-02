import { Scheduler } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const events = [
  { id: 'brief', title: 'Бриф', start: '2026-11-02T10:00', end: '2026-11-02T11:00' },
  { id: 'call', title: 'Звонок', start: '2026-11-02T10:30', end: '2026-11-02T11:00' },
  { id: 'deadline', title: 'Срок сметы', start: '2026-11-03', allDay: true },
];

const playground: Playground = {
  render: (p) => (
    <Scheduler
      key={p.text('defaultView')}
      aria-label="Календарь"
      className="w-full"
      events={events}
      defaultView={p.pick('defaultView', ['month', 'week', 'day'] as const)}
      defaultDate="2026-11-02"
      today="2026-11-02"
      now="2026-11-02T10:45"
    />
  ),
  code: (p) => `<Scheduler aria-label="Календарь" events={events} categories={categories}${p.attrs(['defaultView'])} />`,
};

export default playground;
