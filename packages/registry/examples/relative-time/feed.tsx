import { RelativeTime } from '@/kvant';

const now = new Date('2026-11-03T15:00:00');
const events = [
  { text: 'Вера упомянула вас в сделке', at: '2026-11-03T14:55:00' },
  { text: 'Оплачен счёт № 312', at: '2026-11-03T12:30:00' },
  { text: 'Новая заявка из Telegram', at: '2026-11-02T18:42:00' },
  { text: 'Клиент подписал акт № 318', at: '2026-10-28T14:05:00' },
];

export default function RelativeTimeFeed() {
  return (
    <ul className="flex w-full max-w-sm flex-col divide-y divide-separator">
      {events.map((event) => (
        <li key={event.at} className="flex items-baseline justify-between gap-4 py-2.5">
          <span className="text-body-sm text-fg-1">{event.text}</span>
          <RelativeTime date={event.at} now={now} className="shrink-0 text-caption text-fg-3 tabular-nums" />
        </li>
      ))}
    </ul>
  );
}
