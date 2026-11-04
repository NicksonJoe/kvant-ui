import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId, useState, type ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from './popover';

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
/** Rows of a month cell: every event when they fit, otherwise one row less and «+N ещё» in the last. */
const MONTH_ROWS = 3;
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const SHORT_MONTHS = MONTHS_GEN.map((month) => month.slice(0, 3));
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
// round() absorbs a DST hour
const daysBetween = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / 86_400_000);

/** First and last day of an event, ISO dates; an end before the start counts as one day. */
function dayRange(event: SchedulerEvent): [string, string] {
  const first = isoDay(parse(event.start));
  const last = event.allDay && event.end ? isoDay(parse(event.end)) : first;
  return [first, last > first ? last : first];
}

/** «10–12 ноября», «30 октября – 2 декабря»; undefined for a one-day event. */
function rangeLabel(event: SchedulerEvent, months: readonly string[]): string | undefined {
  const [firstDay, lastDay] = dayRange(event);
  if (firstDay === lastDay) return undefined;
  const first = parse(firstDay);
  const last = parse(lastDay);
  return first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear()
    ? `${first.getDate()}–${last.getDate()} ${months[last.getMonth()]}`
    : `${first.getDate()} ${months[first.getMonth()]} – ${last.getDate()} ${months[last.getMonth()]}`;
}

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
      const [first, last] = dayRange(event);
      return first <= day && day <= last;
    })
    .sort((a, b) => Number(b.allDay ?? false) - Number(a.allDay ?? false) || parse(a.start).getTime() - parse(b.start).getTime());
}

interface Span {
  event: SchedulerEvent;
  /** Column of the first shown day and the number of shown days. */
  start: number;
  span: number;
  lane: number;
  /** The event goes on before or after the shown days: that edge is cut square. */
  clipped?: 'start' | 'end' | 'both';
  /** The first piece of the event on screen; only it is announced and reached by Tab. */
  primary: boolean;
}

/** All-day events of a row of days as bars, stacked in lanes greedily: by start, longer first, then input order. */
function layoutSpans(events: readonly SchedulerEvent[], from: Date, length: number): Span[] {
  const pieces = events
    .flatMap((event) => {
      if (!event.allDay) return [];
      const [firstDay, lastDay] = dayRange(event);
      const first = daysBetween(from, parse(firstDay));
      const last = daysBetween(from, parse(lastDay));
      if (last < 0 || first >= length) return [];
      const start = Math.max(0, first);
      const end = Math.min(length - 1, last);
      const clipped = first < start ? (last > end ? 'both' : 'start') : last > end ? 'end' : undefined;
      return [{ event, start, span: end - start + 1, clipped } as const];
    })
    .sort((a, b) => a.start - b.start || b.span - a.span);
  const laneEnds: number[] = [];
  return pieces.map((piece) => {
    let lane = laneEnds.findIndex((end) => end < piece.start);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = piece.start + piece.span - 1;
    return { ...piece, lane, primary: true };
  });
}

/** Lanes of one column: the bar crossing it in each lane, or a gap that keeps lower lanes in line. */
function lanesAt(spans: readonly Span[], column: number): (Span | undefined)[] {
  const lanes: (Span | undefined)[] = [];
  for (const span of spans) if (span.start <= column && column < span.start + span.span) lanes[span.lane] = span;
  return Array.from(lanes);
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

const allDayLabel = (event: SchedulerEvent) => {
  const range = rangeLabel(event, MONTHS_GEN);
  return range ? `${range}, ${event.title}` : `Весь день, ${event.title}`;
};
// on the grid the fill is opaque, so the day lines do not show through a bar
const softFill = (color: string, ground = 'transparent') => `color-mix(in oklab, ${color} 16%, ${ground})`;

/**
 * An all-day event as a bar over `span` equal columns. It sits in the flow of its first column, so lanes line up
 * with the gaps of the others; `gap` is a column's padding on both sides plus its border, `pad` the padding a cut
 * edge bleeds into.
 */
function SpanEvent({
  span,
  color,
  selected,
  onSelect,
  gap,
  pad,
}: {
  span: Span;
  color: string;
  selected: boolean;
  onSelect?: (id: string) => void;
  gap: number;
  pad: number;
}) {
  const { event, clipped } = span;
  const cutStart = clipped === 'start' || clipped === 'both';
  const cutEnd = clipped === 'end' || clipped === 'both';
  const range = rangeLabel(event, SHORT_MONTHS);
  return (
    <button
      type="button"
      data-slot="scheduler-span"
      data-span={span.span}
      data-lane={span.lane}
      data-clipped={clipped}
      aria-label={allDayLabel(event)}
      aria-hidden={span.primary ? undefined : true}
      tabIndex={span.primary ? undefined : -1}
      onClick={() => onSelect?.(event.id)}
      className={cn(
        'relative z-1 flex h-5 shrink-0 items-center gap-1 self-start overflow-hidden text-left text-body-xs font-medium text-fg-1',
        range ? 'pr-2 pl-[7px]' : 'px-1.5',
        clipped === undefined && 'rounded-[5px]',
        clipped === 'start' && 'rounded-r-[5px]',
        clipped === 'end' && 'rounded-l-[5px]',
      )}
      style={{
        width: `calc(${span.span} * (100% + ${gap}px) - ${gap - (cutStart ? pad : 0) - (cutEnd ? pad : 0)}px)`,
        marginLeft: cutStart ? -pad : undefined,
        background: selected ? color : softFill(color, 'var(--color-surface-1)'),
      }}
    >
      {range && !selected ? <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: color }} /> : null}
      <span className="truncate">{range ? `${event.title} · ${range}` : event.title}</span>
    </button>
  );
}

/** Bars and gaps of one column, up to `limit` lanes. */
function SpanLanes({ spans, column, limit, gap, pad, color, selectedId, onSelect }: Omit<GridProps, 'events' | 'todayDay' | 'timedLabel'> & { spans: readonly Span[]; column: number; limit: number; gap: number; pad: number }) {
  return lanesAt(spans, column)
    .slice(0, limit)
    .map((span, lane) =>
      span && span.start === column ? (
        <SpanEvent key={lane} span={span} color={color(span.event)} selected={span.event.id === selectedId} onSelect={onSelect} gap={gap} pad={pad} />
      ) : (
        <div key={lane} aria-hidden className="h-5 shrink-0" />
      ),
    );
}

/** «+N ещё» and its popover with every event of the day. */
function DayMore({ day, list, hidden, color, timedLabel, selectedId, onSelect }: Omit<GridProps, 'events' | 'todayDay'> & { day: Date; list: readonly SchedulerEvent[]; hidden: number }) {
  const id = useId();
  const date = `${day.getDate()} ${MONTHS_GEN[day.getMonth()]}`;
  return (
    <Popover>
      <PopoverTrigger aria-label={`Ещё ${eventsWord(hidden)}, ${date}`} className="self-start rounded-xs px-1 text-body-xs font-semibold whitespace-nowrap text-accent-soft-fg hover:bg-fill-1">
        +{hidden} ещё
      </PopoverTrigger>
      <PopoverContent data-slot="scheduler-day" align="start" sideOffset={4} aria-labelledby={`${id}-title`} aria-describedby={`${id}-count`} className="w-75! gap-1! rounded-lg! p-3!">
        <div className="flex items-center justify-between gap-3 px-1 pb-1.5">
          <h3 id={`${id}-title`} className="text-label-md font-semibold text-fg-1">
            {WEEKDAYS[weekday(day)]}, {date}
          </h3>
          <span id={`${id}-count`} className="text-caption text-fg-3">
            {eventsWord(list.length)}
          </span>
        </div>
        {list.map((event) => {
          const selected = event.id === selectedId;
          const range = rangeLabel(event, SHORT_MONTHS);
          return event.allDay ? (
            <PopoverClose
              key={event.id}
              aria-label={allDayLabel(event)}
              onClick={() => onSelect?.(event.id)}
              className="flex h-7 min-w-0 shrink-0 items-center rounded-xs px-1.5 text-left text-body-xs font-medium text-fg-1"
              style={{ background: selected ? color(event) : softFill(color(event)) }}
            >
              <span className="truncate">{range ? `${event.title} · ${range}` : event.title}</span>
            </PopoverClose>
          ) : (
            <PopoverClose
              key={event.id}
              aria-label={timedLabel(event)}
              onClick={() => onSelect?.(event.id)}
              className={cn('flex h-7 min-w-0 shrink-0 items-center gap-2 rounded-xs px-1 text-left hover:bg-fill-1', selected && 'bg-fill-2')}
            >
              <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: color(event) }} />
              <span className="w-10 shrink-0 font-mono text-overline font-medium text-fg-3 tabular-nums">{clock(parse(event.start))}</span>
              <span className="truncate text-body-xs text-fg-1">{event.title}</span>
            </PopoverClose>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

function MonthGrid({ current, events, todayDay, color, timedLabel, selectedId, onSelect }: GridProps & { current: Date }) {
  const first = new Date(current.getFullYear(), current.getMonth(), 1);
  const last = new Date(current.getFullYear(), current.getMonth() + 1, 0);
  const start = startOfWeek(first);
  // from the Monday before the 1st to the Sunday after the last day; round() absorbs a DST hour
  const weeks = Math.round(((last.getTime() - start.getTime()) / 86_400_000 + 7 - weekday(last)) / 7);
  const announced = new Set<string>();
  const weekSpans = Array.from({ length: weeks }, (_, week) =>
    layoutSpans(events, addDays(start, week * 7), 7).map((span) => {
      const primary = !announced.has(span.event.id);
      announced.add(span.event.id);
      return { ...span, primary };
    }),
  );
  // a day shows all its events when they fit; a bar in the last row also needs every day under it to fit,
  // or it would run over a neighbour's «+N ещё»
  const weekFits = weekSpans.map((spans, week) =>
    Array.from({ length: 7 }, (_, index) => {
      const timed = eventsOn(events, isoDay(addDays(start, week * 7 + index))).filter((event) => !event.allDay).length;
      return lanesAt(spans, index).length + timed <= MONTH_ROWS;
    }),
  );
  const fitsUnder = (span: Span, fits: readonly boolean[]) => fits.slice(span.start, span.start + span.span).every(Boolean);

  return (
    <div role="grid" aria-readonly="true" data-slot="scheduler-month" className="flex flex-col">
      <div role="row" className="grid grid-cols-7 border-b border-separator">
        {WEEKDAYS.map((day) => (
          <div key={day} role="columnheader" className="px-2.5 py-2 text-caption font-medium text-fg-3">
            {day}
          </div>
        ))}
      </div>
      {weekSpans.map((spans, week) => (
        <div key={week} role="row" className="grid grid-cols-7 border-b border-separator last:border-b-0">
          {Array.from({ length: 7 }, (_, index) => {
            const day = addDays(start, week * 7 + index);
            const key = isoDay(day);
            const list = eventsOn(events, key);
            const allLanes = lanesAt(spans, index);
            const allTimed = list.filter((event) => !event.allDay);
            const fits = weekFits[week] ?? [];
            const rows = fits[index] && allLanes.every((span) => !span || span.lane < MONTH_ROWS - 1 || fitsUnder(span, fits)) ? MONTH_ROWS : MONTH_ROWS - 1;
            const lanes = allLanes.slice(0, rows);
            // a cut-off trailing gap holds no bar, so its row can go to a timed event
            while (lanes.length > 0 && lanes[lanes.length - 1] === undefined) lanes.pop();
            const timed = allTimed.slice(0, rows - lanes.length);
            const hidden = list.length - lanes.filter(Boolean).length - timed.length;
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
                  {day.getDate() === 1 ? `${day.getDate()} ${SHORT_MONTHS[day.getMonth()]}` : day.getDate()}
                </span>
                {/* a cell is 6px padding on each side plus a 1px border */}
                <SpanLanes spans={spans} column={index} limit={lanes.length} gap={13} pad={6} color={color} selectedId={selectedId} onSelect={onSelect} />
                {timed.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    aria-label={timedLabel(event)}
                    onClick={() => onSelect?.(event.id)}
                    className={cn('flex h-5 min-w-0 shrink-0 items-center gap-1.5 rounded-xs px-1 text-left text-body-xs hover:bg-fill-1', outside ? 'text-fg-3' : 'text-fg-1', event.id === selectedId && 'bg-fill-2')}
                  >
                    <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: color(event) }} />
                    <span className="truncate">
                      <span className="tabular-nums">{clock(parse(event.start))}</span> {event.title}
                    </span>
                  </button>
                ))}
                {hidden > 0 ? <DayMore day={day} list={list} hidden={hidden} color={color} timedLabel={timedLabel} selectedId={selectedId} onSelect={onSelect} /> : null}
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
  const spans = days[0] ? layoutSpans(events, days[0], days.length) : [];

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
        {days.map((day, index) => (
          <div key={isoDay(day)} className="flex min-h-8 min-w-28 flex-1 flex-col gap-0.5 border-l border-separator p-1">
            {/* a column is 4px padding on each side plus a 1px border */}
            <SpanLanes spans={spans} column={index} limit={Infinity} gap={9} pad={4} color={color} selectedId={selectedId} onSelect={onSelect} />
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
                // events past the shown hours stay on the grid, pinned to the edge they cross, with their real times
                const grid = hours.length * HOUR;
                const rawTop = ((minutes(start) - startHour * 60) / 60) * HOUR;
                const rawBottom = rawTop + ((end.getTime() - start.getTime()) / 3_600_000) * HOUR;
                const top = Math.min(Math.max(0, rawTop), grid - 20);
                const bottom = Math.max(Math.min(grid, rawBottom), top + 20);
                const clipped = rawTop < 0 ? 'start' : rawBottom > grid ? 'end' : undefined;
                return (
                  <button
                    key={event.id}
                    type="button"
                    aria-label={timedLabel(event)}
                    data-clipped={clipped}
                    onClick={() => onSelect?.(event.id)}
                    className={cn(
                      'absolute flex flex-col overflow-hidden rounded-[6px] px-1.5 py-1 text-left text-body-xs text-fg-1',
                      place.lane > 0 && 'shadow-[0_0_0_1px_var(--color-surface-1)]',
                    )}
                    style={{
                      top: `${top}px`,
                      height: `${Math.max(18, bottom - top - 2)}px`,
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
                      {clipped === 'start' ? '↑ ' : ''}
                      {clock(start)}–{clock(end)}
                      {clipped === 'end' ? ' ↓' : ''}
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
