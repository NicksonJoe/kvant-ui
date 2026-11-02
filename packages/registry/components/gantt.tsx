import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';

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

export interface GanttProps extends Omit<ComponentProps<'div'>, 'children' | 'onSelect'> {
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
}

const DAY = 86_400_000;
const ROW = 40;
const GROUP_ROW = 32;
const HEADER = 56;
const BAR = 22;
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

const time = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const short = (ms: number) => {
  const date = new Date(ms);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
};

function isoWeek(ms: number): number {
  const date = new Date(ms);
  const thursday = ms + (3 - ((date.getUTCDay() + 6) % 7)) * DAY;
  const yearStart = Date.UTC(new Date(thursday).getUTCFullYear(), 0, 1);
  return Math.floor((thursday - yearStart) / DAY / 7) + 1;
}

/** «1 задача», «3 задачи», «5 задач». */
function tasksWord(count: number): string {
  const tens = count % 100;
  const ones = count % 10;
  if (tens >= 11 && tens <= 14) return `${count} задач`;
  if (ones === 1) return `${count} задача`;
  if (ones >= 2 && ones <= 4) return `${count} задачи`;
  return `${count} задач`;
}

/**
 * Project plan: task list 280 on the left, weeks on the right. Bars show plan (22 %) and done (45 %),
 * milestones are diamonds, links go finish → start, the red line is today. Only the selected bar gets a ring.
 */
export function Gantt({ tasks, from, to, today, dayWidth = 30, selectedId, onSelect, className, ...props }: GanttProps) {
  const markerId = useId();
  const origin = time(from);
  const days = Math.max(1, Math.round((time(to) - origin) / DAY) + 1);
  const width = days * dayWidth;
  const dayOf = (iso: string) => Math.round((time(iso) - origin) / DAY);

  const groups: { name: string; tasks: GanttTask[] }[] = [];
  for (const task of tasks) {
    const name = task.group ?? '';
    const group = groups.find((entry) => entry.name === name);
    if (group) group.tasks.push(task);
    else groups.push({ name, tasks: [task] });
  }

  // vertical layout shared by the list and the timeline
  const tops = new Map<string, number>();
  const groupTops = new Map<string, number>();
  let cursor = 0;
  for (const group of groups) {
    if (group.name) {
      groupTops.set(group.name, cursor);
      cursor += GROUP_ROW;
    }
    for (const task of group.tasks) {
      tops.set(task.id, cursor);
      cursor += ROW;
    }
  }
  const bodyHeight = cursor;
  const lastMilestone = [...tasks].reverse().find((task) => task.milestone)?.id;

  const geometry = (task: GanttTask) => {
    const top = (tops.get(task.id) ?? 0) + (ROW - BAR) / 2;
    if (task.milestone) {
      const center = dayOf(task.end) * dayWidth + dayWidth / 2;
      return { top, left: center - 8, right: center + 8, mid: top + BAR / 2 };
    }
    const left = dayOf(task.start) * dayWidth;
    const right = (dayOf(task.end) + 1) * dayWidth;
    return { top, left, right, mid: top + BAR / 2 };
  };

  const weeks = Array.from({ length: Math.ceil(days / 7) }, (_, index) => origin + index * 7 * DAY);
  const todayX = today ? dayOf(today) * dayWidth + dayWidth / 2 - 1 : null;
  const todayTime = today ? time(today) : null;

  const links = tasks.flatMap((task) =>
    (task.dependsOn ?? []).flatMap((id) => {
      const source = tasks.find((entry) => entry.id === id);
      if (!source) return [];
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

  return (
    <div
      data-slot="gantt"
      role="region"
      className={cn('flex overflow-hidden rounded-xl bg-surface-1 shadow-raised', className)}
      {...props}
    >
      <div data-slot="gantt-list" className="flex w-[280px] shrink-0 flex-col border-r border-separator">
        <div className="flex shrink-0 items-end justify-between px-4 pb-2 text-caption font-medium text-fg-3" style={{ height: HEADER }}>
          <span>Задача</span>
          <span>Кто</span>
        </div>
        {groups.map((group) => (
          <div key={group.name || 'tasks'} role="group" aria-label={group.name ? `${group.name}, ${tasksWord(group.tasks.length)}` : undefined}>
            {group.name ? (
              <div className="flex items-center gap-2 bg-surface-2 px-4 text-label-sm font-semibold text-fg-1" style={{ height: GROUP_ROW }}>
                {group.name}
                <span className="font-normal text-fg-3">{tasksWord(group.tasks.length)}</span>
              </div>
            ) : null}
            {group.tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                aria-label={label(task)}
                aria-pressed={task.id === selectedId}
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
            ))}
          </div>
        ))}
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
              const start = Math.min(...group.tasks.map((task) => dayOf(task.start)));
              const end = Math.max(...group.tasks.map((task) => dayOf(task.end)));
              return (
                <div key={group.name} className="absolute inset-x-0 bg-surface-2" style={{ top, height: GROUP_ROW }}>
                  <div className="absolute h-1.5 rounded-full bg-fg-4" style={{ top: 13, left: start * dayWidth, width: (end - start + 1) * dayWidth }} />
                </div>
              );
            })}
            {tasks.map((task) => {
              if (task.id !== selectedId) return null;
              return <div key="selected" className="absolute inset-x-0 bg-accent-soft/60" style={{ top: tops.get(task.id), height: ROW }} />;
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
              const box = geometry(task);
              const color = task.color ?? 'var(--color-chart-1)';
              if (task.milestone) {
                return (
                  <div key={task.id} data-gantt-bar={task.id} className="absolute flex items-center gap-2" style={{ top: box.top, left: box.left, height: BAR }}>
                    <span className={cn('size-3 rotate-45 rounded-[3px]', task.id === lastMilestone ? 'bg-accent' : 'bg-fg-1')} />
                    <span className="text-caption font-medium whitespace-nowrap text-fg-2">{short(time(task.end))}</span>
                  </div>
                );
              }
              const progress = Math.min(1, Math.max(0, task.progress ?? 0));
              const selected = task.id === selectedId;
              const done = progress >= 1;
              const note = task.risk ?? (!done && task.progress !== undefined ? `${Math.round(progress * 100)} %` : null);
              return (
                <div key={task.id} className="contents">
                  <div
                    data-gantt-bar={task.id}
                    className={cn('absolute flex items-center overflow-hidden rounded-[6px]', selected && 'shadow-[0_0_0_2px_var(--color-ring)]')}
                    style={{ top: box.top, left: box.left, width: box.right - box.left, height: BAR, background: `color-mix(in oklab, ${color} 22%, transparent)` }}
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
                  </div>
                  {selected ? (
                    <>
                      <span className="absolute h-3.5 w-1 rounded-xs bg-surface-1 shadow-[0_0_0_1px_var(--color-ring)]" style={{ top: box.top + 4, left: box.left - 2 }} />
                      <span className="absolute h-3.5 w-1 rounded-xs bg-surface-1 shadow-[0_0_0_1px_var(--color-ring)]" style={{ top: box.top + 4, left: box.right - 2 }} />
                    </>
                  ) : null}
                </div>
              );
            })}

            {todayX !== null ? <div className="absolute inset-y-0 w-0.5 bg-danger" style={{ left: todayX }} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
