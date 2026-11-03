import { useEffect, useRef, useState } from 'react';
import { InfiniteScroll, Link, type InfiniteScrollStatus } from '@/kvant';

interface Event {
  id: string;
  title: string;
  detail: string;
  time: string;
  color: string;
}

const TOTAL = 148;
const PAGE = 20;
const KINDS = [
  { title: 'Илья Громов перевёл сделку в «Договор»', detail: 'Сайт и CRM-интеграция · «Орбита Лаб»', color: 'var(--color-chart-1)' },
  { title: 'Анна Северова выставила счёт № 318', detail: 'Анимация логотипа · 312 500 ₽', color: 'var(--color-chart-3)' },
  { title: 'Сделка создана из заявки с сайта', detail: 'Обложки для подкаста · «Тихий эфир»', color: 'var(--color-chart-5)' },
  { title: 'Вера Лебедева назначила встречу', detail: 'Фирменный стиль кафе · «Зерно и пар»', color: 'var(--color-chart-2)' },
];

const NOW = new Date(2026, 10, 4, 16, 40);
const clock = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

/** Event n of the journal, newest first: four kinds, 4 h 50 min apart, so 148 of them cover 30 days. */
function event(n: number): Event {
  const kind = KINDS[n % KINDS.length] ?? { title: '', detail: '', color: '' };
  const at = new Date(NOW.getTime() - n * 290 * 60_000);
  const time = at.getDate() === NOW.getDate() && at.getMonth() === NOW.getMonth() ? clock.format(at) : `${at.getDate()} ${MONTHS[at.getMonth()] ?? ''}`;
  return { id: `event-${n}`, title: kind.title, detail: kind.detail, color: kind.color, time };
}

/** Journal of a CRM: the next 20 events come 1.5 screens before the end, then the period ends. */
export default function Feed() {
  const [events, setEvents] = useState(() => Array.from({ length: PAGE }, (_, n) => event(n)));
  const [status, setStatus] = useState<InfiniteScrollStatus>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const loadMore = () => {
    setStatus('loading');
    timer.current = setTimeout(() => {
      setEvents((list) => [...list, ...Array.from({ length: Math.min(PAGE, TOTAL - list.length) }, (_, n) => event(list.length + n))]);
      setStatus('idle');
    }, 700);
  };

  return (
    <div className="h-120 w-full max-w-104 overflow-y-auto rounded-xl">
      <InfiniteScroll
        aria-label="События за 30 дней"
        items={events}
        getKey={(item) => item.id}
        hasMore={events.length < TOTAL}
        status={status}
        onLoadMore={loadMore}
        end={
          <>
            Это все события за 30 дней
            <Link href="#feed">Показать за всё время</Link>
          </>
        }
        renderItem={(item) => (
          <div className="flex items-start gap-3 px-4 py-3">
            <span className="flex h-5 shrink-0 items-center">
              <span className="size-2 rounded-full" style={{ background: item.color }} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-body-sm text-fg-1">{item.title}</span>
              <span className="text-label-sm text-fg-3">{item.detail}</span>
            </span>
            <span className="w-10 shrink-0 text-right font-mono text-[11px]/5 font-medium text-fg-3">{item.time}</span>
          </div>
        )}
      />
    </div>
  );
}
