import { useEffect, useState, type ComponentProps } from 'react';

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

const clock = (date: Date) => `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** «только что» · «5 мин назад» · «2 ч назад» · «вчера, 18:52» · «22 октября, 14:05» · «30 декабря 2025». */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diff = now.getTime() - date.getTime();
  if (diff >= 0 && diff < MINUTE) return 'только что';
  if (diff >= 0 && diff < HOUR) return `${Math.floor(diff / MINUTE)} мин назад`;
  if (diff >= 0 && diff < 6 * HOUR && startOfDay(date) === startOfDay(now)) return `${Math.floor(diff / HOUR)} ч назад`;
  if (startOfDay(date) === startOfDay(now)) return `сегодня, ${clock(date)}`;
  // compare calendar days, not 24 hours: a DST day is 23 or 25 hours long
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
  if (startOfDay(date) === yesterday) return `вчера, ${clock(date)}`;
  if (date.getFullYear() === now.getFullYear()) return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${clock(date)}`;
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** «3 ноября 2026, 14:55» for the title. */
export function formatExactTime(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${clock(date)}`;
}

export interface RelativeTimeProps extends Omit<ComponentProps<'time'>, 'children' | 'dateTime'> {
  date: Date | string;
  /** Fixed «now» for previews and tests; without it the text refreshes every 30 s. */
  now?: Date;
}

/** Time as people say it, with the exact date in the title and the machine date in `dateTime`. */
export function RelativeTime({ date, now, className, ...props }: RelativeTimeProps) {
  const value = typeof date === 'string' ? new Date(date) : date;
  const [tick, setTick] = useState(() => now ?? new Date());

  useEffect(() => {
    if (now) return;
    const timer = window.setInterval(() => setTick(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, [now]);

  return (
    <time data-slot="relative-time" dateTime={value.toISOString()} title={formatExactTime(value)} className={className} {...props}>
      {formatRelativeTime(value, now ?? tick)}
    </time>
  );
}
