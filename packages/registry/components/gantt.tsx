import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useControllable } from '../lib/use-controllable';
import { Announce } from './visually-hidden';

export interface GanttTask {
  id: string;
  title: string;
  /** First and last day, ISO `YYYY-MM-DD`; a milestone uses the same day twice. */
  start: string;
  end: string;
  /** Section the task belongs to: «Дизайн». Groups keep the order of their first task. */
  group?: string;
  /** Done share 0…1. */
  progress?: number;
  /** Bar hue, a chart-N token; chart-1 by default. */
  color?: string;
  /** Small avatar in the «Кто» column. */
  assignee?: ReactNode;
  milestone?: boolean;
  /** Finish-to-start links from these tasks. */
  dependsOn?: readonly string[];
  /** Risk note inside the bar on the right, danger-soft-fg: «ждёт API · риск +2 дня». */
  risk?: string;
}

/** New dates of a moved or resized task, ISO `YYYY-MM-DD`. */
export interface GanttChange {
  id: string;
  start: string;
  end: string;
}

export interface GanttProps extends Omit<ComponentProps<'div'>, 'children' | 'onSelect' | 'onChange'> {
  'aria-label': string;
  tasks: readonly GanttTask[];
  /** Visible range, ISO dates; start it on a Monday so weeks line up. */
  from: string;
  to: string;
  /** Red «today» line. */
  today?: string;
  /** Width of one day, px. */
  dayWidth?: number;
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Turns on dragging, resizing and ← → on rows. Called once per drop or key press; pass the dates back in `tasks`. */
  onChange?: (change: GanttChange) => void;
  /** Earliest and latest day a task may take, ISO; the visible range by default. */
  min?: string;
  max?: string;
  /** Collapsed group names, controlled. */
  collapsed?: readonly string[];
  defaultCollapsed?: readonly string[];
  onCollapsedChange?: (collapsed: readonly string[]) => void;
}

type EditMode = 'move' | 'start' | 'end';

interface Drag {
  id: string;
  mode: EditMode;
  pointerId: number;
  x: number;
  /** Day indexes when the press began, then the live ones. */
  from: readonly [number, number];
  start: number;
  end: number;
}

const DAY = 86_400_000;
const ROW = 40;
const GROUP_ROW = 32;
const HEADER = 56;
const BAR = 22;
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const SHORTCUTS = 'ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight';

const time = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const short = (ms: number) => {
  const date = new Date(ms);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
};
const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

function isoWeek(ms: number): number {
  const date = new Date(ms);
  const thursday = ms + (3 - ((date.getUTCDay() + 6) % 7)) * DAY;
  const yearStart = Date.UTC(new Date(thursday).getUTCFullYear(), 0, 1);
  return Math.floor((thursday - yearStart) / DAY / 7) + 1;
}

function plural(count: number, one: string, few: string, many: string): string {
  const tens = count % 100;
  const ones = count % 10;
  if (tens >= 11 && tens <= 14) return `${count} ${many}`;
  if (ones === 1) return `${count} ${one}`;
  if (ones >= 2 && ones <= 4) return `${count} ${few}`;
  return `${count} ${many}`;
}
/** «1 задача», «3 задачи», «5 задач». */
const tasksWord = (count: number) => plural(count, 'задача', 'задачи', 'задач');
const daysWord = (count: number) => plural(count, 'день', 'дня', 'дней');

/** Days after a move or resize by `delta`; a task never ends up further outside [min, max] than it already was. */
function edit(start: number, end: number, mode: EditMode, delta: number, min: number, max: number): [number, number] {
  if (mode === 'start') return [clamp(start + delta, Math.min(min, start), end), end];
  if (mode === 'end') return [start, clamp(end + delta, start, Math.max(max, end))];
  const shift = clamp(delta, Math.min(0, min - start), Math.max(0, max - end));
  return [start + shift, end + shift];
}

/**
 * Project plan: task list 280 on the left, weeks on the right. Bars show plan (22 %) and done (45 %),
 * milestones are diamonds, links go finish → start, the red line is today. Only the selected bar gets a ring.
 * With `onChange` bars drag by whole days and stretch from either edge; rows move them with ← → and Shift.
 */
export function Gantt({
  tasks,
  from,
  to,
  today,
  dayWidth = 30,
  selectedId,
  onSelect,
  onChange,
  min,
  max,
  collapsed,
  defaultCollapsed,
  onCollapsedChange,
  className,
  ...props
}: GanttProps) {
  const markerId = useId();
  const [closed, setClosed] = useControllable<readonly string[]>(collapsed, defaultCollapsed ?? [], onCollapsedChange);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());

  const editable = onChange !== undefined;
  const origin = time(from);
  const days = Math.max(1, Math.round((time(to) - origin) / DAY) + 1);
  const width = days * dayWidth;
  const dayOf = (iso: string) => Math.round((time(iso) - origin) / DAY);
  const dayTime = (day: number) => origin + day * DAY;
  const isoOf = (day: number) => new Date(dayTime(day)).toISOString().slice(0, 10);
  const minDay = dayOf(min ?? from);
  const maxDay = dayOf(max ?? to);

  /** First and last day, the live ones while the task is dragged. */
  const span = (task: GanttTask): [number, number] => (drag?.id === task.id ? [drag.start, drag.end] : [dayOf(task.start), dayOf(task.end)]);
  const spanText = (start: number, end: number) => (start === end ? short(dayTime(start)) : `${short(dayTime(start))} – ${short(dayTime(end))}`);

  const groups: { name: string; tasks: GanttTask[] }[] = [];
  for (const task of tasks) {
    const name = task.group ?? '';
    const group = groups.find((entry) => entry.name === name);
    if (group) group.tasks.push(task);
    else groups.push({ name, tasks: [task] });
  }
  const isClosed = (name: string) => name !== '' && closed.includes(name);

  // vertical layout shared by the list and the timeline; tasks of collapsed groups get no top
  const tops = new Map<string, number>();
  const groupTops = new Map<string, number>();
  const rows: { key: string; task?: GanttTask }[] = [];
  let cursor = 0;
  for (const group of groups) {
    if (group.name) {
      groupTops.set(group.name, cursor);
      rows.push({ key: `group:${group.name}` });
      cursor += GROUP_ROW;
    }
    if (isClosed(group.name)) continue;
    for (const task of group.tasks) {
      tops.set(task.id, cursor);
      rows.push({ key: `task:${task.id}`, task });
      cursor += ROW;
    }
  }
  const bodyHeight = cursor;
  const lastMilestone = [...tasks].reverse().find((task) => task.milestone)?.id;
  const tabKey = rows.find((row) => row.key === focusKey)?.key ?? rows.find((row) => row.task?.id === selectedId)?.key ?? rows[0]?.key;
  const rowRef = (key: string) => (node: HTMLButtonElement | null) => {
    if (node) rowRefs.current.set(key, node);
    else rowRefs.current.delete(key);
  };

  const geometry = (task: GanttTask) => {
    const top = (tops.get(task.id) ?? 0) + (ROW - BAR) / 2;
    const [start, end] = span(task);
    if (task.milestone) {
      const center = end * dayWidth + dayWidth / 2;
      return { top, left: center - 8, right: center + 8, mid: top + BAR / 2 };
    }
    return { top, left: start * dayWidth, right: (end + 1) * dayWidth, mid: top + BAR / 2 };
  };

  const weeks = Array.from({ length: Math.ceil(days / 7) }, (_, index) => origin + index * 7 * DAY);
  const todayX = today ? dayOf(today) * dayWidth + dayWidth / 2 - 1 : null;
  const todayTime = today ? time(today) : null;

  const links = tasks.flatMap((task) =>
    (task.dependsOn ?? []).flatMap((id) => {
      const source = tasks.find((entry) => entry.id === id);
      // a link into a collapsed group has nowhere to land
      if (!source || !tops.has(source.id) || !tops.has(task.id)) return [];
      const a = geometry(source);
      const b = geometry(task);
      const key = `${id}-${task.id}`;
      // a milestone's date label sits on its right, so its links leave from the bottom of the diamond
      if (source.milestone) return [{ key, d: `M${a.left + 8} ${a.mid + 9}V${b.mid}H${b.left - 2}` }];
      return [{ key, d: `M${a.right} ${a.mid}H${a.right + 8}V${b.mid}H${b.left - 2}` }];
    }),
  );

  const label = (task: GanttTask) => {
    if (task.milestone) return `${task.title}, веха ${short(time(task.end))}`;
    const range = `${short(time(task.start))} – ${short(time(task.end))}`;
    return task.progress === undefined ? `${task.title}, ${range}` : `${task.title}, ${range}, готово ${Math.round(task.progress * 100)} %`;
  };

  const report = (task: GanttTask, start: number, end: number) => {
    onChange?.({ id: task.id, start: isoOf(start), end: isoOf(end) });
    setAnnouncement(task.milestone ? `${task.title}: веха ${short(dayTime(end))}` : `${task.title}: ${spanText(start, end)}, ${daysWord(end - start + 1)}`);
  };

  const toggle = (name: string) => setClosed(closed.includes(name) ? closed.filter((entry) => entry !== name) : [...closed, name]);

  const onRowKeyDown = (event: KeyboardEvent<HTMLButtonElement>, key: string) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const index = rows.findIndex((row) => row.key === key);
    const steps: Record<string, number> = { ArrowUp: index - 1, ArrowDown: index + 1, Home: 0, End: rows.length - 1 };
    const step = steps[event.key];
    if (step !== undefined) {
      event.preventDefault();
      const next = rows[clamp(step, 0, rows.length - 1)];
      if (next) rowRefs.current.get(next.key)?.focus();
      return;
    }
    const task = rows[index]?.task;
    if (!task || !editable || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    if (event.shiftKey && task.milestone) return;
    const mode: EditMode = event.shiftKey ? 'end' : 'move';
    const delta = event.key === 'ArrowLeft' ? -1 : 1;
    const first = dayOf(task.start);
    const last = dayOf(task.end);
    const [start, end] = edit(first, last, mode, delta, minDay, maxDay);
    if (start !== first || end !== last) report(task, start, end);
    else if (mode === 'end' && delta < 0) setAnnouncement('Короче одного дня нельзя');
    else setAnnouncement(delta < 0 ? `Раньше ${short(dayTime(minDay))} нельзя` : `Позже ${short(dayTime(maxDay))} нельзя`);
  };

  const onBarPointerDown = (event: PointerEvent<HTMLElement>, task: GanttTask) => {
    if (event.button !== 0 || drag) return;
    if (task.id !== selectedId) onSelect?.(task.id);
    if (!editable) return;
    const edge = event.target instanceof Element ? event.target.closest('[data-gantt-edge]')?.getAttribute('data-gantt-edge') : null;
    const mode: EditMode = !task.milestone && (edge === 'start' || edge === 'end') ? edge : 'move';
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const start = dayOf(task.start);
    const end = dayOf(task.end);
    setDrag({ id: task.id, mode, pointerId: event.pointerId, x: event.clientX, from: [start, end], start, end });
  };
  const onBarPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const delta = Math.round((event.clientX - drag.x) / dayWidth);
    const [start, end] = edit(drag.from[0], drag.from[1], drag.mode, delta, minDay, maxDay);
    if (start !== drag.start || end !== drag.end) setDrag({ ...drag, start, end });
  };
  const onBarPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    setDrag(null);
    const task = tasks.find((entry) => entry.id === drag.id);
    if (task && (drag.start !== drag.from[0] || drag.end !== drag.from[1])) report(task, drag.start, drag.end);
  };
  const onBarPointerCancel = (event: PointerEvent<HTMLElement>) => {
    if (drag && event.pointerId === drag.pointerId) setDrag(null);
  };
  const pointer = (task: GanttTask) => ({
    onPointerDown: (event: PointerEvent<HTMLElement>) => onBarPointerDown(event, task),
    onPointerMove: onBarPointerMove,
    onPointerUp: onBarPointerUp,
    onPointerCancel: onBarPointerCancel,
  });

  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) return undefined;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setDrag(null);
      setAnnouncement('Перетаскивание отменено');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dragging]);

  const dragged = drag ? tasks.find((task) => task.id === drag.id && tops.has(task.id)) : undefined;
  let tip: { text: string; left: number; top: number; above: boolean } | null = null;
  if (drag && dragged) {
    const box = geometry(dragged);
    // the first row has no room above the bar inside the scrolling timeline
    const above = box.top >= GROUP_ROW;
    tip = {
      text: dragged.milestone ? short(dayTime(drag.end)) : `${spanText(drag.start, drag.end)} · ${daysWord(drag.end - drag.start + 1)}`,
      left: clamp((box.left + box.right) / 2, 64, width - 64),
      top: above ? box.top - 6 : box.top + BAR + 6,
      above,
    };
  }

  return (
    <div
      data-slot="gantt"
      role="region"
      className={cn('flex overflow-hidden rounded-xl bg-surface-1 shadow-raised', className)}
      {...props}
    >
      <div data-slot="gantt-list" className="flex w-[min(280px,50%)] shrink-0 flex-col border-r border-separator">
        <div className="flex shrink-0 items-end justify-between px-4 pb-2 text-caption font-medium text-fg-3" style={{ height: HEADER }}>
          <span>Задача</span>
          <span>Кто</span>
        </div>
        {groups.map((group) => {
          const shut = isClosed(group.name);
          const headerKey = `group:${group.name}`;
          return (
            <div key={group.name || 'tasks'} role="group" aria-label={group.name ? `${group.name}, ${tasksWord(group.tasks.length)}` : undefined}>
              {group.name ? (
                <button
                  ref={rowRef(headerKey)}
                  type="button"
                  data-slot="gantt-group"
                  aria-label={group.name}
                  aria-expanded={!shut}
                  tabIndex={headerKey === tabKey ? 0 : -1}
                  onFocus={() => setFocusKey(headerKey)}
                  onKeyDown={(event) => onRowKeyDown(event, headerKey)}
                  onClick={() => toggle(group.name)}
                  className="group/header flex w-full items-center gap-1.5 bg-surface-2 px-3 text-left text-label-sm font-semibold text-fg-1 -outline-offset-2"
                  style={{ height: GROUP_ROW }}
                >
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      'size-3.5 shrink-0 stroke-2 text-fg-3 transition-[rotate,color] duration-(--duration-base) ease-standard group-hover/header:text-fg-1',
                      shut && '-rotate-90',
                    )}
                  />
                  <span className="min-w-0 truncate">{group.name}</span>
                  <span className="shrink-0 font-normal whitespace-nowrap text-fg-3">{tasksWord(group.tasks.length)}</span>
                </button>
              ) : null}
              {shut
                ? null
                : group.tasks.map((task) => {
                    const key = `task:${task.id}`;
                    return (
                      <button
                        key={task.id}
                        ref={rowRef(key)}
                        type="button"
                        aria-label={label(task)}
                        aria-pressed={task.id === selectedId}
                        aria-keyshortcuts={editable ? SHORTCUTS : undefined}
                        tabIndex={key === tabKey ? 0 : -1}
                        onFocus={() => setFocusKey(key)}
                        onKeyDown={(event) => onRowKeyDown(event, key)}
                        onClick={() => onSelect?.(task.id)}
                        className={cn(
                          'flex w-full items-center gap-2 px-4 text-left text-body-sm text-fg-1 -outline-offset-2 hover:bg-fill-1',
                          group.name && 'pl-8',
                          task.id === selectedId && 'bg-accent-soft hover:bg-accent-soft',
                        )}
                        style={{ height: ROW }}
                      >
                        {task.milestone ? <span aria-hidden className="size-2.5 shrink-0 rotate-45 rounded-[2px] bg-fg-1" /> : null}
                        <span className="min-w-0 flex-1 truncate">{task.title}</span>
                        <span className="flex w-6 shrink-0 justify-center">{task.assignee}</span>
                      </button>
                    );
                  })}
            </div>
          );
        })}
      </div>

      <div data-slot="gantt-timeline" className="min-w-0 flex-1 overflow-x-auto">
        <div style={{ width }}>
          <div aria-hidden className="flex border-b border-separator" style={{ height: HEADER }}>
            {weeks.map((week) => {
              const current = todayTime !== null && todayTime >= week && todayTime < week + 7 * DAY;
              return (
                <div
                  key={week}
                  className={cn('flex shrink-0 flex-col justify-end gap-0.5 border-r border-separator px-2.5 pb-2', current && 'bg-accent-soft')}
                  style={{ width: 7 * dayWidth }}
                >
                  <span className={cn('font-mono text-overline font-medium', current ? 'text-accent-soft-fg' : 'text-fg-3')}>
                    нед {isoWeek(week)}
                    {current ? ' · текущая' : ''}
                  </span>
                  <span className="truncate text-caption font-medium text-fg-1">
                    {short(week)} – {short(week + 6 * DAY)}
                  </span>
                </div>
              );
            })}
          </div>

          <div aria-hidden className="relative" style={{ height: bodyHeight }}>
            {Array.from({ length: days }, (_, index) => {
              const weekday = new Date(origin + index * DAY).getUTCDay();
              return weekday === 0 || weekday === 6 ? (
                <div key={index} className="absolute inset-y-0 bg-fill-1" style={{ left: index * dayWidth, width: dayWidth }} />
              ) : null;
            })}
            {groups.map((group) => {
              const top = groupTops.get(group.name);
              if (top === undefined) return null;
              const spans = group.tasks.map((task) => span(task));
              const start = Math.min(...spans.map(([first]) => first));
              const end = Math.max(...spans.map(([, last]) => last));
              return (
                <div key={group.name} className="absolute inset-x-0 bg-surface-2" style={{ top, height: GROUP_ROW }}>
                  <div
                    data-slot="gantt-summary"
                    className="absolute h-1.5 rounded-full bg-fg-4"
                    style={{ top: 13, left: start * dayWidth, width: (end - start + 1) * dayWidth }}
                  />
                </div>
              );
            })}
            {tasks.map((task) => {
              const top = tops.get(task.id);
              if (task.id !== selectedId || top === undefined) return null;
              return <div key="selected" className="absolute inset-x-0 bg-accent-soft/60" style={{ top, height: ROW }} />;
            })}

            <svg className="pointer-events-none absolute inset-0" width={width} height={bodyHeight}>
              <defs>
                <marker id={markerId} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0 0 6 3 0 6z" fill="var(--color-fg-4)" />
                </marker>
              </defs>
              {links.map((link) => (
                <path key={link.key} data-slot="gantt-link" d={link.d} fill="none" stroke="var(--color-fg-4)" strokeWidth={1.5} markerEnd={`url(#${markerId})`} />
              ))}
            </svg>

            {tasks.map((task) => {
              if (!tops.has(task.id)) return null;
              const box = geometry(task);
              const color = task.color ?? 'var(--color-chart-1)';
              const held = drag?.id === task.id || undefined;
              const grab = editable && 'cursor-grab touch-pan-y select-none data-dragging:cursor-grabbing';
              if (task.milestone) {
                return (
                  <div
                    key={task.id}
                    data-slot="gantt-milestone"
                    data-gantt-bar={task.id}
                    data-dragging={held}
                    className={cn('absolute flex items-center gap-2', grab)}
                    style={{ top: box.top, left: box.left, height: BAR }}
                    {...pointer(task)}
                  >
                    <span className={cn('size-3 rotate-45 rounded-[3px]', task.id === lastMilestone ? 'bg-accent' : 'bg-fg-1')} />
                    <span className="text-caption font-medium whitespace-nowrap text-fg-2">{short(dayTime(span(task)[1]))}</span>
                  </div>
                );
              }
              const progress = Math.min(1, Math.max(0, task.progress ?? 0));
              const selected = task.id === selectedId;
              const done = progress >= 1;
              const note = task.risk ?? (!done && task.progress !== undefined ? `${Math.round(progress * 100)} %` : null);
              // the visible handles are 4 wide; the hit area around them fits a finger
              const handle = cn(
                'absolute h-3.5 w-1 rounded-xs bg-surface-1 shadow-[0_0_0_1px_var(--color-ring)]',
                editable && 'cursor-ew-resize touch-pan-y before:absolute before:-inset-x-2 before:-inset-y-1.5',
              );
              return (
                <div key={task.id} className="contents">
                  <div
                    data-slot="gantt-bar"
                    data-gantt-bar={task.id}
                    data-dragging={held}
                    className={cn('absolute flex items-center overflow-hidden rounded-[6px]', selected && 'shadow-[0_0_0_2px_var(--color-ring)]', grab)}
                    style={{ top: box.top, left: box.left, width: box.right - box.left, height: BAR, background: `color-mix(in oklab, ${color} 22%, transparent)` }}
                    {...pointer(task)}
                  >
                    <span
                      className="absolute inset-y-0 left-0"
                      style={{ width: `${progress * 100}%`, background: selected ? color : `color-mix(in oklab, ${color} 45%, transparent)` }}
                    />
                    {done ? <span className="relative px-2 text-caption font-semibold text-fg-1">Готово</span> : null}
                    {note ? (
                      <span
                        className={cn(
                          'relative ml-auto truncate px-2 text-caption whitespace-nowrap tabular-nums',
                          task.risk ? 'font-medium text-danger-soft-fg' : selected && progress >= 0.85 ? 'font-semibold text-accent-fg' : 'font-semibold text-fg-1',
                        )}
                      >
                        {note}
                      </span>
                    ) : null}
                    {editable ? (
                      <>
                        <span data-gantt-edge="start" className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize" />
                        <span data-gantt-edge="end" className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize" />
                      </>
                    ) : null}
                  </div>
                  {selected ? (
                    <>
                      <span
                        data-gantt-edge={editable ? 'start' : undefined}
                        className={handle}
                        style={{ top: box.top + 4, left: box.left - 2 }}
                        {...pointer(task)}
                      />
                      <span
                        data-gantt-edge={editable ? 'end' : undefined}
                        className={handle}
                        style={{ top: box.top + 4, left: box.right - 2 }}
                        {...pointer(task)}
                      />
                    </>
                  ) : null}
                </div>
              );
            })}

            {todayX !== null ? <div className="absolute inset-y-0 w-0.5 bg-danger" style={{ left: todayX }} /> : null}

            {tip ? (
              <span
                data-slot="gantt-tooltip"
                className={cn(
                  'pointer-events-none absolute z-10 -translate-x-1/2 rounded-full bg-fg-1 px-2 py-1 text-caption font-semibold whitespace-nowrap text-surface-1 tabular-nums shadow-tooltip',
                  tip.above && '-translate-y-full',
                )}
                style={{ left: tip.left, top: tip.top }}
              >
                {tip.text}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <Announce>{announcement}</Announce>
    </div>
  );
}
