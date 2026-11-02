import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

export interface SchedulerCategory {
  id: string;
  label: string;
  /** A chart-N token; one category keeps one colour in every view. */
  color: string;
}

export interface SchedulerEvent {
  id: string;
  title: string;
  /** Local ISO: `2026-11-02T10:00`, or a date `2026-11-03` for an all-day event. */
  start: string;
  /** End time, or the last day of a multi-day all-day event. */
  end?: string;
  allDay?: boolean;
  category?: string;
}

export const SCHEDULER_VIEWS = ['month', 'week', 'day'] as const;
export type SchedulerView = (typeof SCHEDULER_VIEWS)[number];

export interface SchedulerProps extends Omit<ComponentProps<'div'>, 'children' | 'onSelect'> {
  'aria-label': string;
  events: readonly SchedulerEvent[];
  categories?: readonly SchedulerCategory[];
  view?: SchedulerView;
  defaultView?: SchedulerView;
  onViewChange?: (view: SchedulerView) => void;
  /** Any day inside the shown period, ISO date. */
  date?: string;
  defaultDate?: string;
  onDateChange?: (date: string) => void;
  /** Highlighted day; today by default. */
  today?: string;
  /** «Now» line in the week and day views, local ISO time; the current time by default. */
  now?: string;
  /** Hours shown in the week and day views. */
  startHour?: number;
  endHour?: number;
  selectedId?: string;
  onSelect?: (id: string) => void;
}

const HOUR = 48;
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAYS_FULL = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
const VIEW_LABELS: Record<SchedulerView, string> = { month: 'Месяц', week: 'Неделя', day: 'День' };
const STEP_LABELS: Record<SchedulerView, [string, string]> = {
  month: ['Предыдущий месяц', 'Следующий месяц'],
  week: ['Предыдущая неделя', 'Следующая неделя'],
  day: ['Предыдущий день', 'Следующий день'],
};

const parse = (iso: string) => (iso.length === 10 ? new Date(`${iso}T00:00`) : new Date(iso));
const pad = (value: number) => String(value).padStart(2, '0');
const isoDay = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const clock = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const weekday = (date: Date) => (date.getDay() + 6) % 7;
const startOfWeek = (date: Date) => addDays(date, -weekday(date));
const minutes = (date: Date) => date.getHours() * 60 + date.getMinutes();

function eventsWord(count: number): string {
  const tens = count % 100;
  const ones = count % 10;
  if (tens >= 11 && tens <= 14) return `${count} событий`;
  if (ones === 1) return `${count} событие`;
  if (ones >= 2 && ones <= 4) return `${count} события`;
  return `${count} событий`;
}

/** Events of one day: all-day first, then by start time. */
function eventsOn(events: readonly SchedulerEvent[], day: string): SchedulerEvent[] {
  return events
    .filter((event) => {
      const first = isoDay(parse(event.start));
      if (!event.allDay) return first === day;
      const last = event.end ? isoDay(parse(event.end)) : first;
      return first <= day && day <= last;
    })
    .sort((a, b) => Number(b.allDay ?? false) - Number(a.allDay ?? false) || parse(a.start).getTime() - parse(b.start).getTime());
}

/** Side-by-side lanes for overlapping timed events: width 1/lanes of the cluster, left by lane. */
function layoutDay(events: readonly SchedulerEvent[]): Map<string, { lane: number; lanes: number }> {
  const sorted = [...events].sort((a, b) => parse(a.start).getTime() - parse(b.start).getTime());
  const result = new Map<string, { lane: number; lanes: number }>();
  let cluster: { id: string; lane: number }[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => {
    for (const item of cluster) result.set(item.id, { lane: item.lane, lanes: laneEnds.length });
    cluster = [];
    laneEnds = [];
  };
  for (const event of sorted) {
    const start = parse(event.start).getTime();
    const end = event.end ? parse(event.end).getTime() : start + 30 * 60_000;
    if (start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    if (lane < 0) lane = laneEnds.push(end) - 1;
    else laneEnds[lane] = end;
    cluster.push({ id: event.id, lane });
    clusterEnd = Math.max(clusterEnd, end);
  }
  flush();
  return result;
}

/**
 * Calendar of events in three views on the same data: a month grid with up to three events a day and «+N ещё»,
 * and week and day views by the hour where overlapping events share the column and a red line marks now.
 */
export function Scheduler({
  events,
  categories = [],
  view: viewProp,
  defaultView = 'month',
  onViewChange,
  date: dateProp,
  defaultDate,
  onDateChange,
  today,
  now,
  startHour = 8,
  endHour = 20,
  selectedId,
  onSelect,
  className,
  ...props
}: SchedulerProps) {
  const todayDay = today ?? isoDay(new Date());
  const [viewState, setViewState] = useState(defaultView);
  const [dateState, setDateState] = useState(defaultDate ?? todayDay);
  const view = viewProp ?? viewState;
  const current = parse(dateProp ?? dateState);

  const setView = (next: SchedulerView) => {
    setViewState(next);
    onViewChange?.(next);
  };
  const setDate = (next: Date) => {
    setDateState(isoDay(next));
    onDateChange?.(isoDay(next));
  };
  const step = (direction: 1 | -1) => {
    if (view === 'month') setDate(new Date(current.getFullYear(), current.getMonth() + direction, 1));
    else setDate(addDays(current, direction * (view === 'week' ? 7 : 1)));
  };
  const color = (event: SchedulerEvent) => categories.find((category) => category.id === event.category)?.color ?? 'var(--color-chart-1)';

  const weekStart = startOfWeek(current);
  const weekEnd = addDays(weekStart, 6);
  const title =
    view === 'month'
      ? `${MONTHS[current.getMonth()]} ${current.getFullYear()}`
      : view === 'day'
        ? `${current.getDate()} ${MONTHS_GEN[current.getMonth()]}, ${WEEKDAYS_FULL[weekday(current)]}`
        : weekStart.getMonth() === weekEnd.getMonth()
          ? `${weekStart.getDate()} – ${weekEnd.getDate()} ${MONTHS_GEN[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`
          : `${weekStart.getDate()} ${MONTHS_GEN[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MONTHS_GEN[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

  const timedLabel = (event: SchedulerEvent) => {
    const start = clock(parse(event.start));
    return event.end ? `${start}–${clock(parse(event.end))}, ${event.title}` : `${start}, ${event.title}`;
  };

  return (
    <div data-slot="scheduler" role="region" className={cn('flex flex-col overflow-hidden rounded-2xl bg-surface-1 shadow-raised', className)} {...props}>
      <div data-slot="scheduler-toolbar" className="flex flex-wrap items-center gap-3 border-b border-separator px-5 py-3.5">
        <h2 className="min-w-40 text-heading-sm font-semibold text-fg-1">{title}</h2>
        <div className="flex items-center gap-1">
          {([-1, 1] as const).map((direction) => (
            <button
              key={direction}
              type="button"
              aria-label={STEP_LABELS[view][direction === -1 ? 0 : 1]}
              onClick={() => step(direction)}
              className="grid size-8 place-items-center rounded-full text-fg-2 hover:bg-fill-1 hover:text-fg-1 [&_svg]:size-4 [&_svg]:stroke-[1.75]"
            >
              {direction === -1 ? <ChevronLeft aria-hidden /> : <ChevronRight aria-hidden />}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDate(parse(todayDay))}
          className="h-8 rounded-full px-3 text-label-sm font-medium text-fg-1 shadow-[inset_0_0_0_1px_var(--color-border)] hover:bg-fill-1"
        >
          Сегодня
        </button>
        <div className="flex-1" />
        {categories.length > 0 ? (
          <ul aria-label="Категории" className="flex flex-wrap gap-x-4 gap-y-1">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center gap-1.5 text-body-xs text-fg-2">
                <span aria-hidden className="size-2 rounded-full" style={{ background: category.color }} />
                {category.label}
              </li>
            ))}
          </ul>
        ) : null}
        <div role="group" aria-label="Вид" className="flex h-8 items-center gap-0.5 rounded-full bg-fill-2 p-0.5">
          {SCHEDULER_VIEWS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => setView(option)}
              className={cn(
                'h-7 rounded-full px-3 text-label-sm font-medium',
                view === option ? 'bg-surface-1 text-fg-1 shadow-[0_1px_2px_#161A1F1A,0_0_0_0.5px_#161A1F1F]' : 'text-fg-2 hover:text-fg-1',
              )}
            >
              {VIEW_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' ? (
        <MonthGrid
          current={current}
          events={events}
          todayDay={todayDay}
          color={color}
          timedLabel={timedLabel}
          selectedId={selectedId}
          onSelect={onSelect}
          onMore={(day) => {
            setDate(day);
            setView('day');
          }}
        />
      ) : (
        <TimeGrid
          days={view === 'week' ? Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)) : [current]}
          events={events}
          todayDay={todayDay}
          now={now ? parse(now) : new Date()}
          startHour={startHour}
          endHour={endHour}
          color={color}
          timedLabel={timedLabel}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}

interface GridProps {
  events: readonly SchedulerEvent[];
  todayDay: string;
  color: (event: SchedulerEvent) => string;
  timedLabel: (event: SchedulerEvent) => string;
  selectedId?: string;
  onSelect?: (id: string) => void;
}

function AllDayEvent({ event, color, selected, onSelect }: { event: SchedulerEvent; color: string; selected: boolean; onSelect?: (id: string) => void }) {
  return (
    <button
      type="button"
      aria-label={`Весь день, ${event.title}`}
      onClick={() => onSelect?.(event.id)}
      className="truncate rounded-xs px-1.5 py-0.5 text-left text-body-xs font-medium text-fg-1"
      style={{ background: selected ? color : `color-mix(in oklab, ${color} 16%, transparent)` }}
    >
      {event.title}
    </button>
  );
}

function MonthGrid({ current, events, todayDay, color, timedLabel, selectedId, onSelect, onMore }: GridProps & { current: Date; onMore: (day: Date) => void }) {
  const first = new Date(current.getFullYear(), current.getMonth(), 1);
  const last = new Date(current.getFullYear(), current.getMonth() + 1, 0);
  const start = startOfWeek(first);
  // from the Monday before the 1st to the Sunday after the last day; round() absorbs a DST hour
  const weeks = Math.round(((last.getTime() - start.getTime()) / 86_400_000 + 7 - weekday(last)) / 7);

  return (
    <div role="grid" aria-readonly="true" data-slot="scheduler-month" className="flex flex-col">
      <div role="row" className="grid grid-cols-7 border-b border-separator">
        {WEEKDAYS.map((day) => (
          <div key={day} role="columnheader" className="px-2.5 py-2 text-caption font-medium text-fg-3">
            {day}
          </div>
        ))}
      </div>
      {Array.from({ length: weeks }, (_, week) => (
        <div key={week} role="row" className="grid grid-cols-7 border-b border-separator last:border-b-0">
          {Array.from({ length: 7 }, (_, index) => {
            const day = addDays(start, week * 7 + index);
            const key = isoDay(day);
            const list = eventsOn(events, key);
            const shown = list.slice(0, 3);
            const outside = day.getMonth() !== current.getMonth();
            const isToday = key === todayDay;
            return (
              <div
                key={key}
                role="gridcell"
                aria-label={`${day.getDate()} ${MONTHS_GEN[day.getMonth()]}, ${eventsWord(list.length)}`}
                aria-current={isToday ? 'date' : undefined}
                className={cn('flex min-h-26 min-w-0 flex-col gap-0.5 border-r border-separator p-1.5 last:border-r-0', outside && 'bg-surface-2', isToday && 'bg-accent-soft/40')}
              >
                <span
                  className={cn(
                    'mb-0.5 grid h-6 min-w-6 place-items-center self-start rounded-full px-1 text-label-sm tabular-nums',
                    isToday ? 'bg-accent font-semibold text-accent-fg' : outside ? 'text-fg-3' : 'text-fg-1',
                  )}
                >
                  {day.getDate() === 1 ? `${day.getDate()} ${MONTHS_GEN[day.getMonth()]?.slice(0, 3)}` : day.getDate()}
                </span>
                {shown.map((event) =>
                  event.allDay ? (
                    <AllDayEvent key={event.id} event={event} color={color(event)} selected={event.id === selectedId} onSelect={onSelect} />
                  ) : (
                    <button
                      key={event.id}
                      type="button"
                      aria-label={timedLabel(event)}
                      onClick={() => onSelect?.(event.id)}
                      className={cn('flex min-w-0 items-center gap-1.5 rounded-xs px-1 text-left text-body-xs hover:bg-fill-1', outside ? 'text-fg-3' : 'text-fg-1', event.id === selectedId && 'bg-fill-2')}
                    >
                      <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: color(event) }} />
                      <span className="truncate">
                        <span className="tabular-nums">{clock(parse(event.start))}</span> {event.title}
                      </span>
                    </button>
                  ),
                )}
                {list.length > shown.length ? (
                  <button
                    type="button"
                    aria-label={`Ещё ${eventsWord(list.length - shown.length)}, ${day.getDate()} ${MONTHS_GEN[day.getMonth()]}`}
                    onClick={() => onMore(day)}
                    className="self-start rounded-xs px-1 text-body-xs font-semibold text-accent-soft-fg hover:bg-fill-1"
                  >
                    +{list.length - shown.length} ещё
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function TimeGrid({
  days,
  events,
  todayDay,
  now,
  startHour,
  endHour,
  color,
  timedLabel,
  selectedId,
  onSelect,
}: GridProps & { days: readonly Date[]; now: Date; startHour: number; endHour: number }) {
  const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
  const nowTop = ((minutes(now) - startHour * 60) / 60) * HOUR;
  const nowVisible = nowTop >= 0 && nowTop <= hours.length * HOUR;

  return (
    <div data-slot="scheduler-time" className="flex flex-col overflow-x-auto">
      <div className="flex border-b border-separator">
        <div className="w-14 shrink-0" />
        {days.map((day) => {
          const isToday = isoDay(day) === todayDay;
          return (
            <div key={isoDay(day)} className="flex min-w-28 flex-1 items-center gap-1.5 border-l border-separator px-2.5 py-2 text-label-sm">
              <span className={isToday ? 'text-accent-soft-fg' : 'text-fg-3'}>{WEEKDAYS[weekday(day)]}</span>
              <span className={cn('grid h-6 min-w-6 place-items-center rounded-full px-1 font-semibold tabular-nums', isToday ? 'bg-accent text-accent-fg' : 'text-fg-1')}>
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex border-b border-separator">
        <div className="flex w-14 shrink-0 items-center px-2 text-caption text-fg-3">весь день</div>
        {days.map((day) => (
          <div key={isoDay(day)} className="flex min-h-8 min-w-28 flex-1 flex-col gap-0.5 border-l border-separator p-1">
            {eventsOn(events, isoDay(day))
              .filter((event) => event.allDay)
              .map((event) => (
                <AllDayEvent key={event.id} event={event} color={color(event)} selected={event.id === selectedId} onSelect={onSelect} />
              ))}
          </div>
        ))}
      </div>
      <div className="relative flex">
        <div className="w-14 shrink-0">
          {hours.map((hour, index) => (
            <div key={hour} className="relative text-right font-mono text-overline text-fg-3" style={{ height: HOUR }}>
              {/* labels sit on their line; the first one stays inside so it does not climb into «весь день» */}
              <span className={cn('absolute right-2', index === 0 ? 'top-0.5' : '-top-2')}>{`${pad(hour)}:00`}</span>
            </div>
          ))}
        </div>
        {days.map((day) => {
          const key = isoDay(day);
          const timed = eventsOn(events, key).filter((event) => !event.allDay);
          const lanes = layoutDay(timed);
          const isToday = key === todayDay;
          const weekend = weekday(day) >= 5;
          return (
            <div key={key} className={cn('relative min-w-28 flex-1 border-l border-separator', weekend && 'bg-fill-1', isToday && 'bg-accent-soft/30')}>
              {hours.map((hour) => (
                <div key={hour} className="border-b border-separator" style={{ height: HOUR }} />
              ))}
              {timed.map((event) => {
                const start = parse(event.start);
                const end = event.end ? parse(event.end) : new Date(start.getTime() + 30 * 60_000);
                const place = lanes.get(event.id) ?? { lane: 0, lanes: 1 };
                const width = 100 / place.lanes;
                const selected = event.id === selectedId;
                return (
                  <button
                    key={event.id}
                    type="button"
                    aria-label={timedLabel(event)}
                    onClick={() => onSelect?.(event.id)}
                    className={cn(
                      'absolute flex flex-col overflow-hidden rounded-[6px] px-1.5 py-1 text-left text-body-xs text-fg-1',
                      place.lane > 0 && 'shadow-[0_0_0_1px_var(--color-surface-1)]',
                    )}
                    style={{
                      top: `${((minutes(start) - startHour * 60) / 60) * HOUR}px`,
                      height: `${Math.max(20, ((end.getTime() - start.getTime()) / 3_600_000) * HOUR - 2)}px`,
                      left: `${place.lane * width}%`,
                      width: `${width}%`,
                      background: selected ? color(event) : `color-mix(in oklab, ${color(event)} 16%, var(--color-surface-1))`,
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-1.5 font-medium">
                      {selected ? null : <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: color(event) }} />}
                      <span className="truncate">{event.title}</span>
                    </span>
                    <span className="truncate text-caption text-fg-2 tabular-nums">
                      {clock(start)}–{clock(end)}
                    </span>
                  </button>
                );
              })}
              {isToday && nowVisible ? <div aria-hidden className="absolute inset-x-0 z-10 h-0.5 bg-danger" style={{ top: nowTop }} /> : null}
            </div>
          );
        })}
        {nowVisible && days.some((day) => isoDay(day) === todayDay) ? (
          <span aria-hidden className="absolute left-1 z-10 -translate-y-1/2 rounded-xs bg-danger-hover px-1 text-caption font-semibold text-danger-fg tabular-nums" style={{ top: nowTop }}>
            {clock(now)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
