import { Check, ChevronRight, CircleCheck, CircleX, Shield } from 'lucide-react';
import { useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useControllable } from '../lib/use-controllable';
import { Badge } from './badge';
import { Button } from './button';
import { AgentAvatar } from './conversation';
import { Spinner } from './spinner';
import { Announce, VisuallyHidden } from './visually-hidden';

/* ---------- Pure logic ---------- */

export type TraceStepStatus = 'pending' | 'running' | 'done' | 'error';

export interface TraceStepData {
  id: string;
  /** What the agent does, in the words of the task: «Нашёл 18 клиентов без активности за 30 дней». */
  title: string;
  status: TraceStepStatus;
  /** Tool call in mono: «crm.contacts.search». */
  tool?: string;
  /** After the call: «0,8 с», «таймаут 10 с», «2 варианта темы · 146 слов». */
  detail?: string;
  /** Running step over a known amount: a 160 bar and «3 из 18». */
  progress?: { value: number; max: number };
  /** A queued step that will wait for «Разрешить»: «Понадобится ваше подтверждение». */
  needsApproval?: boolean;
  /** «Повторить» next to a failed call. */
  onRetry?: () => void;
}

export interface TraceProgress {
  /** Done and failed steps. */
  finished: number;
  total: number;
  /** running while a step runs or waits in the queue. */
  status: 'running' | 'done';
}

export function traceProgress(steps: readonly TraceStepData[]): TraceProgress {
  const finished = steps.filter((step) => step.status === 'done' || step.status === 'error').length;
  return { finished, total: steps.length, status: finished < steps.length ? 'running' : 'done' };
}

/** What the screen reader hears after an update: steps that have just finished or failed. */
export function traceAnnouncement(previous: readonly TraceStepData[], next: readonly TraceStepData[]): string {
  const before = new Map(previous.map((step) => [step.id, step.status]));
  return next
    .filter((step) => (step.status === 'done' || step.status === 'error') && before.get(step.id) !== step.status)
    .map((step) => `${step.status === 'done' ? 'Готово' : 'Ошибка'}: ${step.title}`)
    .join(' · ');
}

const plurals = new Intl.PluralRules('ru');
const stepsWord = (count: number) => (plurals.select(count) === 'one' ? 'шага' : 'шагов');

/* ---------- Steps ---------- */

const statusText: Record<TraceStepStatus, string> = { done: 'готово', error: 'ошибка', running: 'идёт', pending: 'ожидает' };

// The check draws itself in 150ms while the icon lands on the bouncy spring.
const landed =
  'transition-[scale] duration-(--duration-slow) [transition-timing-function:var(--ease-spring-10)] starting:scale-50 [&_path]:[stroke-dasharray:9] [&_path]:transition-[stroke-dashoffset] [&_path]:duration-(--duration-quick) [&_path]:ease-out starting:[&_path]:[stroke-dashoffset:9]';

function StepIcon({ status }: { status: TraceStepStatus }) {
  return (
    <span data-slot="trace-status-icon" data-status={status} className="grid size-5 shrink-0 place-items-center">
      {status === 'done' ? (
        <CircleCheck aria-hidden className={cn('size-5 stroke-[1.5] text-success', landed)} />
      ) : status === 'error' ? (
        <CircleX aria-hidden className="size-5 stroke-[1.5] text-danger" />
      ) : status === 'running' ? (
        <Spinner inherit className="text-accent" />
      ) : (
        <svg aria-hidden viewBox="0 0 24 24" className="size-5 text-fg-4">
          <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2.5 3.5" />
        </svg>
      )}
    </span>
  );
}

const mono = 'font-mono text-overline font-medium';

function TraceStep({ step, last }: { step: TraceStepData; last: boolean }) {
  const call = [step.tool, step.detail].filter(Boolean).join(' · ');
  const { progress } = step;
  return (
    <li
      data-slot="trace-step"
      data-id={step.id}
      data-status={step.status}
      className="flex gap-3 transition-[opacity,translate] duration-(--duration-base) ease-out starting:translate-y-(--shift-md) starting:opacity-0"
    >
      <div className={cn('flex w-5 shrink-0 flex-col items-center', !last && 'gap-1 pb-1')}>
        <StepIcon status={step.status} />
        {last ? null : <span data-slot="trace-rail" aria-hidden className="w-px flex-1 bg-border" />}
      </div>
      <div className={cn('flex min-w-0 flex-1 flex-col', step.status === 'running' && progress ? 'gap-1.5' : 'gap-0.5', !last && 'pb-4')}>
        <p className={cn('text-body-sm font-medium', step.status === 'pending' ? 'text-fg-3' : 'text-fg-1')}>
          {step.title} <VisuallyHidden>{statusText[step.status]}</VisuallyHidden>
        </p>
        {step.status === 'error' ? (
          <div className="flex flex-wrap items-center gap-x-2">
            {call ? <p className={cn(mono, 'text-danger-soft-fg')}>{call}</p> : null}
            {step.onRetry ? (
              <Button variant="link" size="xs" onClick={step.onRetry}>
                Повторить
              </Button>
            ) : null}
          </div>
        ) : step.status === 'running' && progress ? (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span
              role="progressbar"
              aria-label={step.title}
              aria-valuemin={0}
              aria-valuemax={progress.max}
              aria-valuenow={progress.value}
              className="flex h-1 w-40 max-w-full shrink-0 overflow-hidden rounded-full bg-fill-2"
            >
              <span
                className="rounded-full bg-accent transition-[width] duration-(--duration-slow) ease-standard"
                style={{ width: `${progress.max > 0 ? Math.min(progress.value / progress.max, 1) * 100 : 0}%` }}
              />
            </span>
            <p className={cn(mono, 'text-fg-3 tabular-nums')}>{[step.tool, `${progress.value} из ${progress.max}`].filter(Boolean).join(' · ')}</p>
          </div>
        ) : step.status === 'pending' && step.needsApproval ? (
          <p className="flex items-center gap-1.5 text-caption font-medium text-warning-soft-fg">
            <Shield aria-hidden className="size-3 shrink-0 stroke-2" />
            Понадобится ваше подтверждение
          </p>
        ) : call ? (
          <p className={cn(mono, 'text-fg-3')}>{call}</p>
        ) : null}
      </div>
    </li>
  );
}

/* ---------- Trace ---------- */

export type TraceVariant = 'card' | 'inline';

const stopIcon = <span aria-hidden className="size-2.5 rounded-[2px] bg-current" />;

function StatusIcon({ status }: { status: 'running' | 'done' | 'stopped' }) {
  return (
    <span data-slot="trace-status-icon" data-status={status} className="grid size-4 shrink-0 place-items-center">
      {status === 'running' ? (
        <svg aria-hidden viewBox="0 0 16 16" fill="none" strokeWidth="1.75" className="size-4 animate-spinner">
          <circle cx="8" cy="8" r="6.25" stroke="var(--color-fill-3)" />
          <path d="M8 1.75A6.25 6.25 0 0 1 14.25 8" stroke="var(--color-accent)" strokeLinecap="round" />
        </svg>
      ) : status === 'done' ? (
        <CircleCheck aria-hidden className={cn('size-4 stroke-[1.75] text-success', landed)} />
      ) : (
        <span aria-hidden className="size-[9px] rounded-[2px] bg-fg-3" />
      )}
    </span>
  );
}

const statusLabel = { running: 'В процессе', done: 'Готово', stopped: 'Остановлено' } as const;

export interface TraceProps extends Omit<ComponentProps<'div'>, 'children' | 'title'> {
  steps: readonly TraceStepData[];
  /** card — the whole run with its header · inline — a status line in a turn that opens the steps. */
  variant?: TraceVariant;
  /** Card header: who works. */
  title?: ReactNode;
  /** Card header: the task, before «3 из 5 шагов». */
  task?: string;
  /** Timer or total: «0:42» in the card, «6 с» / «за 14 с» on the line. */
  time?: ReactNode;
  /** The user stopped the agent: no «Остановить», the line says «Остановлено». */
  stopped?: boolean;
  /** «Остановить» while steps run. */
  onStop?: () => void;
  /** Inline: the steps are shown. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Under the steps: TraceApproval. */
  children?: ReactNode;
}

/**
 * What the agent does, step by step: an icon on a rail, the step in the words of the task, the tool call small
 * and mono. Finished and failed steps are announced. The inline variant is the «Готово за 14 с» line of a turn.
 */
export function Trace({
  steps,
  variant = 'card',
  title = 'Агент Норды',
  task,
  time,
  stopped = false,
  onStop,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  className,
  children,
  ...props
}: TraceProps) {
  const listId = useId();
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const progress = traceProgress(steps);
  const status = stopped ? 'stopped' : progress.status;
  // steps seen at the last render: the difference is what gets announced
  const [previous, setPrevious] = useState(steps);
  const [said, setSaid] = useState('');
  if (previous !== steps) {
    setPrevious(steps);
    const text = traceAnnouncement(previous, steps);
    if (text) setSaid(text);
  }

  const list = (
    <ol id={listId} aria-label="Шаги агента" className="flex flex-col">
      {steps.map((step, index) => (
        <TraceStep key={step.id} step={step} last={index === steps.length - 1} />
      ))}
    </ol>
  );

  if (variant === 'inline') {
    return (
      <div data-slot="trace" data-variant="inline" data-status={status} className={cn('flex flex-col gap-3', className)} {...props}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen(!open)}
          className="kv-pressable -mx-1.5 inline-flex h-6 w-fit items-center gap-2 rounded-full px-1.5 text-body-xs text-fg-2 hover:bg-fill-1 active:bg-fill-2"
        >
          <StatusIcon status={status} />
          {statusLabel[status]}
          {time ? <span className="text-caption text-fg-3 tabular-nums">{time}</span> : null}
          <ChevronRight
            aria-hidden
            className={cn('-ml-0.5 size-3.5 stroke-[1.75] text-fg-3 transition-transform duration-(--duration-quick) ease-standard', open && 'rotate-90')}
          />
        </button>
        {open ? <div className="transition-opacity duration-(--duration-base) ease-out starting:opacity-0">{list}</div> : null}
        {children}
        <Announce>{said}</Announce>
      </div>
    );
  }

  return (
    <div
      data-slot="trace"
      data-variant="card"
      data-status={status}
      className={cn('flex flex-col gap-5 rounded-xl bg-surface-1 px-6 pt-5 pb-6 shadow-raised', className)}
      {...props}
    >
      {/* in a narrow column the timer and «Остановить» wrap under the title instead of squeezing it */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <AgentAvatar size={32} />
        <div className="flex min-w-40 flex-1 flex-col">
          <p className="text-body-sm font-semibold text-fg-1">{title}</p>
          <p className="text-body-xs text-fg-3">{[task, `${progress.finished} из ${progress.total} ${stepsWord(progress.total)}`].filter(Boolean).join(' · ')}</p>
        </div>
        {time ? <span className="text-caption text-fg-3 tabular-nums">{time}</span> : null}
        {onStop && status === 'running' ? (
          <Button variant="secondary" size="sm" leadingIcon={stopIcon} onClick={onStop}>
            Остановить
          </Button>
        ) : null}
      </div>
      {list}
      {children}
      <Announce>{said}</Announce>
    </div>
  );
}

/* ---------- Approval ---------- */

export type TraceDecision = 'approved' | 'rejected';

export interface TraceApprovalProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** The question: «Отправить письмо 18 клиентам?». */
  title: ReactNode;
  /** What the agent will not do without you: «Агент подготовил письмо и не отправит его без вашего решения.» */
  description?: ReactNode;
  badge?: ReactNode;
  /** TraceApprovalDetail rows on surface-2: «Тема», «Кому». */
  details?: ReactNode;
  onApprove: () => void;
  onReject: () => void;
  approveLabel?: string;
  rejectLabel?: string;
  /** Link on the right: «Изменить письмо». */
  edit?: ReactNode;
  /** After the choice the card folds into one line. */
  decision?: TraceDecision;
  /** After the decision word: «18 писем отправлено в 14:12». */
  result?: ReactNode;
  /** The decision is on its way: a spinner on «Разрешить», «Отклонить» waits. */
  pending?: boolean;
}

/** Whatever changes client data or writes to people waits for an explicit «Разрешить». */
export function TraceApproval({
  title,
  description,
  badge = 'Нужно подтверждение',
  details,
  onApprove,
  onReject,
  approveLabel = 'Разрешить',
  rejectLabel = 'Отклонить',
  edit,
  decision,
  result,
  pending = false,
  className,
  ...props
}: TraceApprovalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const root = useRef<HTMLDivElement>(null);
  const height = useRef(0);

  // the card folds into the line: height from the card to the line, 200ms ease-standard
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const from = height.current;
    const to = element.offsetHeight;
    height.current = to;
    if (!from || from === to || typeof element.animate !== 'function') return;
    const style = getComputedStyle(element);
    element.animate([{ height: `${from}px`, overflow: 'hidden' }, { height: `${to}px`, overflow: 'hidden' }], {
      duration: parseFloat(style.getPropertyValue('--duration-base')) || 200,
      easing: style.getPropertyValue('--ease-standard').trim() || 'ease',
    });
  }, [decision]);

  if (decision) {
    const approved = decision === 'approved';
    return (
      <div
        ref={root}
        data-slot="trace-approval"
        data-decision={decision}
        className={cn('flex items-center gap-2.5 text-body-sm text-fg-1', className)}
        {...props}
      >
        {approved ? (
          <CircleCheck aria-hidden className={cn('size-4 shrink-0 stroke-[1.75] text-success', landed)} />
        ) : (
          <CircleX aria-hidden className="size-4 shrink-0 stroke-[1.75] text-fg-3" />
        )}
        <p>
          {approved ? 'Разрешено' : 'Отклонено'}
          {result ? <span className="text-fg-3"> · {result}</span> : null}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={root}
      data-slot="trace-approval"
      role="group"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn('flex flex-col gap-5 rounded-xl bg-surface-1 p-6 shadow-raised', className)}
      {...props}
    >
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-warning-soft text-warning-soft-fg">
          <Shield aria-hidden className="size-5 stroke-[1.5]" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p id={titleId} className="text-body-md font-semibold text-fg-1">
              {title}
            </p>
            {badge ? <Badge tone="warning">{badge}</Badge> : null}
          </div>
          {description ? (
            <p id={descriptionId} className="text-body-sm text-fg-2">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {details ? <div className="flex flex-col gap-2.5 rounded-lg bg-surface-2 px-4 py-3.5">{details}</div> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button leadingIcon={<Check aria-hidden />} loading={pending} onClick={onApprove}>
          {approveLabel}
        </Button>
        <Button variant="secondary" disabled={pending} onClick={onReject}>
          {rejectLabel}
        </Button>
        {edit ? <div className="ml-auto">{edit}</div> : null}
      </div>
    </div>
  );
}

export interface TraceApprovalDetailProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** «Тема», «Кому». */
  label: ReactNode;
  children: ReactNode;
}

/** A row of the approval details: the label in a 44 column, the value 14/20. */
export function TraceApprovalDetail({ label, className, children, ...props }: TraceApprovalDetailProps) {
  return (
    <div data-slot="trace-approval-detail" className={cn('flex items-baseline gap-3', className)} {...props}>
      <span className="w-control-lg shrink-0 text-caption font-medium text-fg-3">{label}</span>
      <div className="min-w-0 flex-1 text-body-sm text-fg-1">{children}</div>
    </div>
  );
}
