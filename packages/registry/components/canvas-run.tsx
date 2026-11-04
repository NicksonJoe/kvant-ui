import { Check, ChevronDown, Pin } from 'lucide-react';
import { useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';
import type { CanvasRunStatus } from './canvas-types';
import { JsonViewer, type JsonValue } from './json-viewer';
import { SegmentedControl } from './segmented-control';
import { Spinner } from './spinner';

const tenths = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });

/** «80 мс» under a second, «1,5 с» above. */
export function formatRunTime(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} мс` : `${tenths.format(ms / 1000)} с`;
}

const STEPS = [500, 1000, 2000, 5000, 10_000, 30_000, 60_000, 120_000, 300_000, 600_000];

/** Time axis of the run: the end rounded up to a round step, about six ticks. */
export function runScale(end: number): { total: number; ticks: number[] } {
  const step = STEPS.find((candidate) => Math.ceil(end / candidate) <= 5) ?? Math.ceil(end / 5 / 60_000) * 60_000;
  const total = Math.max(step, Math.ceil(end / step) * step);
  return { total, ticks: Array.from({ length: total / step + 1 }, (_, index) => index * step) };
}

export interface CanvasRunStep {
  id: string;
  title: string;
  status: CanvasRunStatus;
  /** Milliseconds from the start of the run. */
  start?: number;
  /** How long it took, or has been running so far. */
  duration?: number;
  /** After the time: «840 токенов», «1 запись». */
  detail?: string;
  /** Why it was skipped or failed: «пропущен — ветка «нет» не выбрана». */
  reason?: string;
}

export type CanvasRunState = 'running' | 'done' | 'error' | 'stopped';

export type CanvasRunData = 'input' | 'output' | 'log';

export interface CanvasRunPanelProps extends Omit<ComponentProps<'section'>, 'title'> {
  /** «Запуск № 24». */
  title: string;
  status: CanvasRunState;
  /** Milliseconds since the start (running) or the whole run (finished). */
  elapsed?: number;
  /** Test data the run uses: «тест: «Заявка Ивана, сайт, 120 000 ₽»». */
  testLabel?: string;
  steps: readonly CanvasRunStep[];
  selectedStepId?: string;
  /** Selecting a step should also select its node on the canvas. */
  onSelectStep?: (id: string) => void;
  /** Data of the selected step. */
  input?: JsonValue;
  output?: JsonValue;
  log?: readonly string[];
  onStop?: () => void;
  /** «Закрепить как тестовые данные шага»: the step stops running and returns this output. */
  onPin?: () => void;
  /** Folded into the 52 strip with the header only. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const stateNames: Record<CanvasRunStatus, string> = {
  idle: 'не запускался',
  waiting: 'ждёт',
  running: 'выполняется',
  done: 'готово',
  error: 'ошибка',
  warning: 'не настроен',
  skipped: 'пропущен',
};

function StepMark({ status }: { status: CanvasRunStatus }) {
  if (status === 'running') return <Spinner size={16} className="text-accent" />;
  if (status === 'done')
    return (
      <span className="grid size-4 shrink-0 place-items-center rounded-full bg-success text-success-fg">
        <Check className="size-2.5 stroke-[4]" />
      </span>
    );
  if (status === 'error' || status === 'warning')
    return <span className={cn('grid size-4 shrink-0 place-items-center rounded-full text-[11px] font-bold', status === 'error' ? 'bg-danger text-danger-fg' : 'bg-warning text-warning-fg')}>!</span>;
  if (status === 'skipped') return <span className="grid size-4 shrink-0 place-items-center rounded-full bg-fill-2 text-overline text-fg-3">–</span>;
  return <span className="size-4 shrink-0 rounded-full border-[1.5px] border-dashed border-fg-4" />;
}

const percent = (value: number, total: number) => `${Math.min(100, Math.max(0, (value / total) * 100))}%`;

function describe(value: JsonValue): string {
  if (Array.isArray(value)) return `[${value.length}]`;
  if (value !== null && typeof value === 'object') return `{ ${Object.keys(value).length} поля }`;
  return String(value);
}

/**
 * The run under the canvas: a time track by step (done success, running accent, waiting empty, skipped with the
 * reason) and the input, output and log of the selected step as a table or JSON.
 */
export function CanvasRunPanel({
  title,
  status,
  elapsed,
  testLabel,
  steps,
  selectedStepId,
  onSelectStep,
  input,
  output,
  log,
  onStop,
  onPin,
  collapsed = false,
  onCollapsedChange,
  className,
  ...props
}: CanvasRunPanelProps) {
  const [tab, setTab] = useState<CanvasRunData>('output');
  const [view, setView] = useState<'table' | 'json'>('json');
  const end = Math.max(elapsed ?? 0, ...steps.map((step) => (step.start ?? 0) + (step.duration ?? 0)));
  const { total, ticks } = runScale(end);
  const at = Math.max(0, steps.findIndex((step) => step.status === 'running' || step.status === 'error'));
  const where = `шаг ${at + 1} из ${steps.length}`;
  const summary =
    status === 'running'
      ? ['идёт', elapsed === undefined ? null : formatRunTime(elapsed), where].filter(Boolean).join(' · ')
      : status === 'done'
        ? `готово${elapsed === undefined ? '' : ` за ${formatRunTime(elapsed)}`}`
        : status === 'error'
          ? `ошибка · ${where}`
          : `остановлен · ${where}`;
  const selected = steps.find((step) => step.id === selectedStepId);
  const data = tab === 'input' ? input : tab === 'output' ? output : undefined;
  const dot: Record<CanvasRunState, string> = {
    running: 'bg-accent shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-accent)_18%,transparent)]',
    done: 'bg-success',
    error: 'bg-danger',
    stopped: 'bg-fg-3',
  };

  return (
    <section
      data-slot="canvas-run"
      data-status={status}
      aria-label={title}
      className={cn('flex flex-col overflow-hidden rounded-xl bg-surface-1 shadow-raised', className)}
      {...props}
    >
      <header className={cn('flex h-control-xl shrink-0 items-center gap-2.5 pr-3 pl-5', !collapsed && 'border-b border-separator')}>
        <span aria-hidden className={cn('size-2 shrink-0 rounded-full', dot[status])} />
        <h2 className="text-body-sm font-semibold text-fg-1">{title}</h2>
        <p role="status" className="truncate text-body-xs text-fg-3 tabular-nums">
          {summary}
        </p>
        {testLabel ? <span className="hidden h-[22px] items-center truncate rounded-xs bg-fill-2 px-2 text-caption font-medium text-fg-2 sm:inline-flex">{testLabel}</span> : null}
        <span className="flex-1" />
        {status === 'running' && onStop ? (
          <Button variant="secondary" size="sm" onClick={onStop}>
            Остановить
          </Button>
        ) : null}
        {onCollapsedChange ? (
          <button
            type="button"
            aria-label={collapsed ? 'Развернуть панель запуска' : 'Свернуть панель запуска'}
            aria-expanded={!collapsed}
            onClick={() => onCollapsedChange(!collapsed)}
            className="kv-pressable grid size-8 shrink-0 place-items-center rounded-sm text-fg-2 [--kv-press-scale:var(--scale-press-icon)] hover:bg-fill-2 hover:text-fg-1"
          >
            <ChevronDown aria-hidden className={cn('size-4 stroke-[1.75] transition-[rotate] duration-(--duration-quick) ease-out', collapsed && 'rotate-180')} />
          </button>
        ) : null}
      </header>
      {collapsed ? null : (
        <div className="flex min-h-0 flex-1 max-md:flex-col">
          <div className="flex min-w-0 flex-[1.4] flex-col gap-1 border-separator px-5 pt-4 pb-5 md:border-r max-md:border-b">
            <div aria-hidden className="flex h-5 shrink-0 items-center gap-4">
              <span className="w-[180px] shrink-0" />
              <span className="relative h-3.5 flex-1">
                {ticks.map((tick, index) => (
                  <span
                    key={tick}
                    className={cn('absolute font-mono text-overline font-medium text-fg-3', index === ticks.length - 1 ? '-translate-x-full' : index > 0 && '-translate-x-1/2')}
                    style={{ left: percent(tick, total) }}
                  >
                    {index === 0 ? '0 с' : tenths.format(tick / 1000)}
                  </span>
                ))}
              </span>
            </div>
            <ol aria-label="Шаги запуска" className="flex flex-col gap-1">
              {steps.map((step) => {
                const time = step.duration === undefined ? undefined : [formatRunTime(step.duration), step.detail].filter(Boolean).join(' · ');
                const said = step.status === 'skipped' || step.status === 'error' ? step.reason ?? stateNames[step.status] : [stateNames[step.status], time].filter(Boolean).join(', ');
                const current = step.id === selectedStepId;
                const bar: CSSProperties = { left: percent(step.start ?? 0, total), width: percent(step.duration ?? 0, total) };
                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      data-status={step.status}
                      aria-label={`${step.title}, ${said}`}
                      aria-current={current || undefined}
                      onClick={() => onSelectStep?.(step.id)}
                      className={cn(
                        'flex h-control-md w-full items-center gap-4 rounded-sm text-left transition-colors duration-(--duration-micro) ease-hover',
                        current ? 'bg-accent-soft' : 'hover:bg-fill-1',
                      )}
                    >
                      <span className="flex w-[180px] shrink-0 items-center gap-2 pl-1">
                        <StepMark status={step.status} />
                        <span className={cn('truncate text-body-xs', current ? 'font-semibold text-fg-1' : step.status === 'skipped' ? 'text-fg-3' : step.status === 'done' ? 'text-fg-1' : 'text-fg-2')}>
                          {step.title}
                        </span>
                      </span>
                      {step.status === 'skipped' || (step.status === 'error' && step.reason) ? (
                        <span className={cn('flex-1 truncate pr-2 text-caption', step.status === 'error' ? 'text-danger-soft-fg' : 'text-fg-3')}>{step.reason ?? stateNames[step.status]}</span>
                      ) : (
                        <span className="relative h-5 flex-1">
                          {step.duration !== undefined && step.status !== 'waiting' ? (
                            <>
                              <span
                                className={cn(
                                  'absolute top-1 h-3 min-w-1 rounded-[3px] transition-[width] duration-(--duration-slow) ease-standard',
                                  step.status === 'running'
                                    ? 'bg-[linear-gradient(90deg_in_oklab,var(--color-accent),color-mix(in_oklab,var(--color-accent)_45%,transparent))]'
                                    : step.status === 'error'
                                      ? 'bg-danger'
                                      : 'bg-success',
                                )}
                                style={bar}
                              />
                              {time ? (
                                <span
                                  className={cn('absolute top-0.5 pl-1.5 font-mono text-overline whitespace-nowrap', current ? 'font-semibold text-accent-soft-fg' : 'text-fg-3')}
                                  style={{ left: percent((step.start ?? 0) + step.duration, total) }}
                                >
                                  {time}
                                </span>
                              ) : null}
                            </>
                          ) : null}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3 px-5 pt-4 pb-5">
            {selected ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <SegmentedControl<CanvasRunData>
                    aria-label="Данные шага"
                    value={tab}
                    onValueChange={setTab}
                    options={[
                      { value: 'input', label: 'Вход' },
                      { value: 'output', label: 'Выход' },
                      { value: 'log', label: 'Лог' },
                    ]}
                  />
                  {tab === 'log' ? null : (
                    <SegmentedControl<'table' | 'json'>
                      aria-label="Вид данных"
                      value={view}
                      onValueChange={setView}
                      options={[
                        { value: 'table', label: 'Таблица' },
                        { value: 'json', label: 'JSON' },
                      ]}
                    />
                  )}
                </div>
                <RunData tab={tab} view={view} data={data} log={log} step={selected.title} />
                {onPin && tab === 'output' && output !== undefined ? (
                  <Button variant="ghost" size="xs" leadingIcon={<Pin />} onClick={onPin} className="self-start">
                    Закрепить как тестовые данные шага
                  </Button>
                ) : null}
              </>
            ) : (
              <p className="m-auto max-w-[32ch] text-center text-body-xs text-fg-3">Выберите шаг слева, чтобы увидеть его вход, выход и лог.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function RunData({ tab, view, data, log, step }: { tab: CanvasRunData; view: 'table' | 'json'; data: JsonValue | undefined; log: readonly string[] | undefined; step: string }): ReactNode {
  if (tab === 'log') {
    return log?.length ? (
      <ol aria-label={`Лог шага «${step}»`} className="flex flex-col gap-1 rounded-md bg-surface-2 px-3.5 py-3 font-mono text-caption text-fg-2">
        {log.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ol>
    ) : (
      <p className="text-body-xs text-fg-3">Лог пуст.</p>
    );
  }
  const name = `${tab === 'input' ? 'Вход' : 'Выход'} шага «${step}»`;
  if (data === undefined) return <p className="text-body-xs text-fg-3">{tab === 'input' ? 'Шаг ещё ничего не получил.' : 'Шаг ещё ничего не вернул.'}</p>;
  if (view === 'json') return <JsonViewer aria-label={name} value={data} height={240} />;
  const rows: [string, JsonValue][] = data !== null && typeof data === 'object' && !Array.isArray(data) ? Object.entries(data) : [['значение', data]];
  return (
    <table aria-label={name} className="w-full border-collapse overflow-hidden rounded-md bg-surface-2 text-caption">
      <tbody>
        {rows.map(([key, value]) => (
          <tr key={key} className="border-b border-separator last:border-b-0">
            <th scope="row" className="w-2/5 px-3.5 py-2 text-left font-mono font-medium text-fg-2">
              {key}
            </th>
            <td className="px-3.5 py-2 text-fg-1 tabular-nums">{describe(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
