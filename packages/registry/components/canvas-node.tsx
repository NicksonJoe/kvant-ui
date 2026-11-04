import { Toolbar as BaseToolbar } from '@base-ui/react/toolbar';
import {
  Briefcase,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  ExternalLink,
  GitBranch,
  Group,
  Hourglass,
  LoaderCircle,
  Minus,
  Pin,
  Plus,
  Repeat,
  RotateCw,
  Sparkles,
  StickyNote,
  Table,
  Timer,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Kbd } from './badge';
import type { CanvasNodeKind, CanvasRunStatus } from './canvas-types';
import { Avatar, AvatarGroup } from './card';
import { Tooltip } from './popover';

/* ---------- Kinds ---------- */

interface KindLook {
  label: string;
  /** chart-N token of the family: trigger 5, action 1, logic 4, AI 7, data 3. */
  color: string;
  /** Tile tint and icon colour; literal classes so Tailwind sees them. */
  tile: string;
  icon: LucideIcon;
}

const KINDS: Record<CanvasNodeKind, KindLook> = {
  trigger: { label: 'Триггер', color: 'var(--color-chart-5)', tile: 'bg-chart-5/14 text-chart-5', icon: Zap },
  action: { label: 'Действие', color: 'var(--color-chart-1)', tile: 'bg-chart-1/14 text-chart-1', icon: Briefcase },
  condition: { label: 'Условие', color: 'var(--color-chart-4)', tile: 'bg-chart-4/16 text-chart-4', icon: GitBranch },
  loop: { label: 'Цикл', color: 'var(--color-chart-4)', tile: 'bg-chart-4/16 text-chart-4', icon: Repeat },
  wait: { label: 'Пауза', color: 'var(--color-chart-4)', tile: 'bg-chart-4/16 text-chart-4', icon: Hourglass },
  agent: { label: 'Агент', color: 'var(--color-chart-7)', tile: 'bg-chart-7/14 text-chart-7', icon: Sparkles },
  data: { label: 'Данные', color: 'var(--color-chart-3)', tile: 'bg-chart-3/16 text-chart-3', icon: Table },
  group: { label: 'Группа', color: 'var(--color-chart-3)', tile: 'bg-chart-3/16 text-chart-3', icon: Group },
  note: { label: 'Заметка', color: 'var(--color-warning)', tile: 'bg-warning-soft text-warning-soft-fg', icon: StickyNote },
};

/** Every node kind, in palette order. */
export const CANVAS_NODE_KINDS = Object.keys(KINDS) as readonly CanvasNodeKind[];

/** Russian name of a step kind: «Триггер», «Действие»… */
export function canvasKindLabel(kind: CanvasNodeKind): string {
  return KINDS[kind].label;
}

/** Family colour of a step kind as a CSS value, e.g. for edges or a minimap. */
export function canvasKindColor(kind: CanvasNodeKind): string {
  return KINDS[kind].color;
}

const plurals = new Intl.PluralRules('ru');
function counted(count: number, [one, few, many]: readonly [string, string, string]): string {
  const rule = plurals.select(count);
  return `${count} ${rule === 'one' ? one : rule === 'few' ? few : many}`;
}
const RETRIES = ['повтор', 'повтора', 'повторов'] as const;
const STEPS = ['шаг', 'шага', 'шагов'] as const;

/** Integration logo: brand background and mark instead of the kind icon. */
export interface CanvasServiceLogo {
  /** Service name for screen readers: «Telegram», «1С». */
  name: string;
  /** Brand background, any CSS colour. */
  background: string;
  /** Mark colour (`currentColor` of the content). */
  color?: string;
  /** SVG or a short wordmark: «1С». */
  content: ReactNode;
}

export type CanvasNodeTileSize = 24 | 28 | 32;

export interface CanvasNodeTileProps {
  kind: CanvasNodeKind;
  /** Own icon of the step (16px in a 32 tile); default — the kind icon. */
  icon?: ReactNode;
  logo?: CanvasServiceLogo;
  size?: CanvasNodeTileSize;
  /** Circle for collapsed pills and group chips. */
  round?: boolean;
  className?: string;
}

/** Tinted square of a step kind (14–16 % of chart-N) or a service logo on its brand colour. */
export function CanvasNodeTile({ kind, icon, logo, size = 32, round = false, className }: CanvasNodeTileProps) {
  const look = KINDS[kind];
  const Icon = look.icon;
  return (
    <span
      data-slot="canvas-node-tile"
      role={logo ? 'img' : undefined}
      aria-label={logo?.name}
      aria-hidden={logo ? undefined : true}
      className={cn(
        'inline-grid shrink-0 place-items-center font-extrabold [&_svg]:stroke-2',
        round ? 'rounded-full' : size === 24 ? 'rounded-xs' : 'rounded-sm',
        size === 32 ? 'size-8 text-caption [&_svg]:size-4' : size === 28 ? 'size-7 text-overline [&_svg]:size-3.5' : 'size-6 text-[10px] [&_svg]:size-3.5',
        !logo && look.tile,
        className,
      )}
      style={logo ? { backgroundColor: logo.background, color: logo.color } : undefined}
    >
      {logo ? logo.content : (icon ?? <Icon />)}
    </span>
  );
}

/* ---------- Node card ---------- */

export const CANVAS_NODE_SIZES = ['full', 'compact', 'collapsed'] as const;
export type CanvasNodeSize = (typeof CANVAS_NODE_SIZES)[number];

/** Someone in the node right now. */
export interface CanvasPerson {
  name: string;
  /** Presence colour, any CSS colour: `var(--color-chart-2)`. */
  color: string;
  /** Edits the node: ring in their colour and the «Ирина правит» tag. */
  editing?: boolean;
}

export type CanvasAgentStepState = 'done' | 'running' | 'pending';

export interface CanvasAgentStep {
  label: string;
  state: CanvasAgentStepState;
}

/** Last result of the step: one line, value and when. */
export interface CanvasNodePreview {
  value: ReactNode;
  time?: string;
}

const STATUS_LABELS: Record<CanvasRunStatus, string> = {
  idle: '',
  waiting: 'Ждёт',
  running: 'Выполняется',
  done: 'Готово',
  error: 'Ошибка',
  warning: 'Не настроен',
  skipped: 'Пропущен',
};

const STATUS_CHIPS: Record<CanvasRunStatus, string> = {
  idle: 'bg-fill-1 text-fg-2',
  waiting: 'bg-fill-2 text-fg-2',
  // a light band runs over the chip while the step works; reduced motion stops it (--animate-shimmer: none)
  running:
    'bg-accent-soft text-accent-soft-fg bg-[linear-gradient(90deg,transparent_0%,color-mix(in_oklab,var(--color-surface-1)_45%,transparent)_50%,transparent_100%)] bg-size-[200%_100%] bg-no-repeat animate-shimmer',
  done: 'bg-success-soft text-success-soft-fg',
  error: 'bg-danger-soft text-danger-soft-fg',
  warning: 'bg-warning-soft text-warning-soft-fg',
  skipped: 'bg-fill-2 text-fg-3',
};

const cornerBadge = 'absolute -top-[7px] -right-[7px] grid size-[18px] place-items-center rounded-full';

function StatusBadge({ status }: { status: CanvasRunStatus }) {
  const label = STATUS_LABELS[status];
  if (status === 'idle') return null;
  const ring = 'shadow-[0_0_0_2px_var(--color-surface-1)]';
  const look: Record<Exclude<CanvasRunStatus, 'idle'>, { className: string; mark: ReactNode }> = {
    running: {
      className: 'bg-surface-1 text-accent shadow-[0_0_0_1px_var(--color-border)]',
      mark: <LoaderCircle className="size-3 animate-spinner stroke-[3]" />,
    },
    waiting: { className: 'bg-surface-1 text-fg-3 shadow-[0_0_0_1px_var(--color-border)]', mark: <Clock className="size-3 stroke-[2.5]" /> },
    done: { className: cn('bg-success text-success-fg', ring), mark: <Check className="size-2.5 stroke-[3.5]" /> },
    error: { className: cn('bg-danger text-danger-fg', ring), mark: <span className="text-[11px]/none font-extrabold">!</span> },
    warning: { className: cn('bg-warning text-warning-fg', ring), mark: <span className="text-[11px]/none font-extrabold">!</span> },
    skipped: { className: cn('bg-fill-3 text-fg-2', ring), mark: <Minus className="size-2.5 stroke-[3.5]" /> },
  };
  const { className, mark } = look[status];
  return (
    <span data-slot="canvas-node-status" role="img" aria-label={label} className={cn(cornerBadge, className)}>
      {mark}
    </span>
  );
}

const chipShell = 'flex h-6 min-w-0 shrink-0 items-center gap-1.5 rounded-xs px-2 text-caption font-medium [&_svg]:size-3 [&_svg]:shrink-0 [&_svg]:stroke-[2.4]';

function AgentSteps({ steps }: { steps: readonly CanvasAgentStep[] }) {
  const shown = steps.slice(0, 4);
  const rest = steps.length - shown.length;
  return (
    <ul aria-label="Шаги агента" className="flex flex-col gap-1.5 rounded-sm bg-fill-1 px-2.5 py-2">
      {shown.map((step) => (
        <li
          key={step.label}
          aria-current={step.state === 'running' ? 'step' : undefined}
          className={cn(
            'flex min-w-0 items-center gap-2 text-caption',
            step.state === 'running' ? 'font-medium text-fg-1' : step.state === 'done' ? 'text-fg-2' : 'text-fg-3',
          )}
        >
          {step.state === 'done' ? (
            <Check aria-hidden className="size-3 shrink-0 stroke-3 text-success" />
          ) : step.state === 'running' ? (
            <LoaderCircle aria-hidden className="size-3 shrink-0 animate-spinner stroke-3 text-accent" />
          ) : (
            <span aria-hidden className="size-3 shrink-0 rounded-full border-[2.5px] border-fg-4" />
          )}
          <span className="truncate">{step.label}</span>
          {step.state === 'done' ? <span className="sr-only">(готово)</span> : null}
        </li>
      ))}
      {rest > 0 ? <li className="pl-5 text-caption text-fg-3">ещё {rest}</li> : null}
    </ul>
  );
}

function People({ people }: { people: readonly CanvasPerson[] }) {
  return (
    <AvatarGroup
      data-slot="canvas-node-people"
      max={3}
      size={20}
      className="absolute right-3 -bottom-2.5 -space-x-1! text-[10px]"
    >
      {people.map((person) => (
        <Avatar key={person.name} name={person.name} size={20} className="text-surface-1!" style={{ backgroundColor: person.color }} />
      ))}
    </AvatarGroup>
  );
}

export interface CanvasNodeCardProps extends Omit<ComponentProps<'div'>, 'title' | 'children'> {
  kind: CanvasNodeKind;
  title: string;
  /** Second line under the title; default — the kind: «Триггер · Telegram», «Агент Норды». */
  subtitle?: string;
  /** full — editor card 208 (agent 240) · compact — 180, tile 28, no chip · collapsed — pill h40 with the title only. */
  size?: CanvasNodeSize;
  /** Own icon of the step instead of the kind icon. */
  icon?: ReactNode;
  logo?: CanvasServiceLogo;
  /** Gist of the settings in mono: «этап: Неразобранное», «budget ≥ 50 000». */
  summary?: ReactNode;
  /** Last value after the first run; shown instead of the summary. */
  preview?: CanvasNodePreview;
  /** Run state: corner badge 18 and, with statusText, the chip instead of the summary. */
  status?: CanvasRunStatus;
  /** «Выполняется · 1,2 с», «Сервис занят · Повторить», «Не выбран этап воронки». */
  statusText?: string;
  /** Makes the status chip a button: open the log, retry, go to the field. */
  onStatusClick?: () => void;
  /** Retry in progress: warning chip «Повтор 2 из 3 · через 10 с»; beats the status chip. */
  retrying?: string;
  /** Pinned data: the step does not run, it returns the saved output. «Закреплено · 3 поля». */
  pinned?: string;
  /** Configured retries: grey badge «3 повтора». */
  retries?: number;
  /** Configured timeout: badge «30 с». */
  timeout?: string;
  /** Error branch: badge «ветка «сбой»». */
  fallback?: string;
  /** Agent at work: up to 4 steps, the rest as «ещё N». */
  steps?: readonly CanvasAgentStep[];
  /** After an agent run: «1,2 с · 640 токенов». */
  usage?: string;
  /** Cost of the run: «0,4 ₽». */
  price?: string;
  /** Records that went through the output in the last run: pill 18 at the output port. */
  outputCount?: number;
  /** Changed after the last publication: warning dot in the top left corner. */
  changed?: boolean;
  /** true — selected (ring accent 2 + halo 6) · 'group' — one of several selected (accent 55 %). */
  selected?: boolean | 'group';
  /** Skipped at run: opacity 55 %. */
  disabled?: boolean;
  /** Who is in the node: avatars 20 on the bottom edge, up to three and «+N». */
  people?: readonly CanvasPerson[];
}

const RING = {
  rest: 'shadow-[0_0_0_1px_var(--color-hairline),0_1px_2px_color-mix(in_oklab,var(--color-fg-1)_5%,transparent)] hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg-1)_24%,transparent),0_4px_12px_color-mix(in_oklab,var(--color-fg-1)_8%,transparent)]',
  running: 'shadow-[0_0_0_1px_var(--color-border),0_1px_3px_color-mix(in_oklab,var(--color-fg-1)_6%,transparent)]',
  selected:
    'shadow-[0_0_0_2px_var(--color-accent),0_0_0_6px_color-mix(in_oklab,var(--color-accent)_14%,transparent),0_4px_12px_color-mix(in_oklab,var(--color-fg-1)_8%,transparent)]',
  group: 'shadow-[0_0_0_2px_color-mix(in_oklab,var(--color-accent)_55%,transparent),0_1px_3px_color-mix(in_oklab,var(--color-fg-1)_6%,transparent)]',
  // an error outranks the selection: both are rings, the red one is the one that must be seen
  error: 'shadow-[0_0_0_1.5px_var(--color-danger),0_0_0_5px_color-mix(in_oklab,var(--color-danger)_10%,transparent)]',
  editing: 'shadow-[0_0_0_2px_var(--kv-editor),0_1px_2px_color-mix(in_oklab,var(--color-fg-1)_5%,transparent)]',
};

/**
 * Content of one graph node: kind tile, title, one line of gist, run state and the signals around it.
 * Ports are drawn by the canvas around the box; the card leaves its edges free for them.
 */
export function CanvasNodeCard({
  kind,
  title,
  subtitle,
  size = 'full',
  icon,
  logo,
  summary,
  preview,
  status = 'idle',
  statusText,
  onStatusClick,
  retrying,
  pinned,
  retries,
  timeout,
  fallback,
  steps,
  usage,
  price,
  outputCount,
  changed = false,
  selected = false,
  disabled = false,
  people,
  className,
  style,
  ...props
}: CanvasNodeCardProps) {
  const editor = people?.find((person) => person.editing);
  const ring =
    status === 'error'
      ? RING.error
      : selected === true
        ? RING.selected
        : selected === 'group'
          ? RING.group
          : editor
            ? RING.editing
            : status === 'running'
              ? RING.running
              : RING.rest;
  const full = size === 'full';
  const width = size === 'compact' ? 180 : full ? (kind === 'agent' ? 240 : 208) : undefined;

  const statusChip = statusText ? (
    onStatusClick ? (
      <button
        type="button"
        onClick={onStatusClick}
        className={cn(chipShell, STATUS_CHIPS[status], 'cursor-pointer text-left hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring')}
      >
        <span className="truncate">{statusText}</span>
      </button>
    ) : (
      <div className={cn(chipShell, STATUS_CHIPS[status])}>
        <span className="truncate">{statusText}</span>
      </div>
    )
  ) : null;

  const chip = retrying ? (
    <div className={cn(chipShell, 'bg-warning-soft text-warning-soft-fg')}>
      <RotateCw aria-hidden />
      <span className="truncate">{retrying}</span>
    </div>
  ) : statusChip ? (
    statusChip
  ) : pinned ? (
    <div className={cn(chipShell, 'bg-fill-2 text-fg-1 [&_svg]:text-fg-2')}>
      <Pin aria-hidden />
      <span className="truncate">{pinned}</span>
    </div>
  ) : preview ? (
    <div className={cn(chipShell, 'bg-fill-1 font-normal')}>
      <span className="min-w-0 flex-1 truncate text-fg-1">{preview.value}</span>
      {preview.time ? <span className="shrink-0 text-overline text-fg-3">{preview.time}</span> : null}
    </div>
  ) : summary !== undefined ? (
    <div className={cn(chipShell, 'bg-fill-1 font-mono text-overline text-fg-2')}>
      <span className="truncate">{summary}</span>
    </div>
  ) : null;

  const badges: { key: string; icon?: ReactNode; text: string }[] = [];
  if (retries !== undefined) badges.push({ key: 'retries', icon: <RotateCw aria-hidden />, text: counted(retries, RETRIES) });
  if (timeout) badges.push({ key: 'timeout', icon: <Timer aria-hidden />, text: timeout });
  if (fallback) badges.push({ key: 'fallback', icon: <GitBranch aria-hidden />, text: fallback });

  return (
    <div
      data-slot="canvas-node"
      data-kind={kind}
      data-size={size}
      data-status={status}
      data-selected={selected === true ? 'single' : selected === 'group' ? 'group' : undefined}
      data-disabled={disabled || undefined}
      data-editing={editor ? '' : undefined}
      className={cn(
        'relative bg-surface-1 transition-[box-shadow,opacity] duration-(--duration-micro) ease-hover motion-reduce:transition-none',
        full ? 'flex flex-col gap-2.5 rounded-md p-3' : size === 'compact' ? 'flex items-center gap-2.5 rounded-md px-3 py-2.5' : 'inline-flex h-10 items-center gap-2 rounded-full pr-3.5 pl-1.5',
        ring,
        disabled && 'opacity-55',
        className,
      )}
      style={{ width, ...(editor ? ({ '--kv-editor': editor.color } as CSSProperties) : null), ...style }}
      {...props}
    >
      {editor ? (
        <span
          data-slot="canvas-node-editor"
          className="absolute bottom-[calc(100%+6px)] left-0 flex h-5 items-center rounded-[5px] px-1.5 text-overline font-semibold whitespace-nowrap text-surface-1"
          style={{ backgroundColor: editor.color }}
        >
          {editor.name} правит
        </span>
      ) : null}

      {size === 'collapsed' ? (
        <>
          <CanvasNodeTile kind={kind} icon={icon} logo={logo} size={28} round />
          <span className="truncate text-body-xs font-semibold text-fg-1">{title}</span>
        </>
      ) : (
        <div className="flex min-w-0 items-center gap-2.5">
          <CanvasNodeTile kind={kind} icon={icon} logo={logo} size={full ? 32 : 28} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-body-xs font-semibold text-fg-1">{title}</span>
            <span className="truncate text-caption text-fg-3">{subtitle ?? KINDS[kind].label}</span>
          </div>
        </div>
      )}

      {full ? (
        <>
          {chip}
          {steps && steps.length > 0 ? <AgentSteps steps={steps} /> : null}
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <span
                  key={badge.key}
                  className="inline-flex h-5 items-center gap-1 rounded-[5px] bg-fill-2 px-1.5 text-overline font-medium text-fg-2 [&_svg]:size-[11px] [&_svg]:stroke-[2.4]"
                >
                  {badge.icon}
                  {badge.text}
                </span>
              ))}
            </div>
          ) : null}
          {usage || price ? (
            <div className="flex justify-between gap-2 text-overline text-fg-3 tabular-nums">
              <span>{usage}</span>
              <span>{price}</span>
            </div>
          ) : null}
        </>
      ) : null}

      {changed ? (
        <span
          role="img"
          aria-label="Изменён после публикации"
          className="absolute top-0 left-0 size-2 rounded-full bg-warning shadow-[0_0_0_2px_var(--color-surface-1)]"
        />
      ) : null}
      <StatusBadge status={status} />
      {disabled ? <span className="sr-only">Выключен</span> : null}
      {outputCount !== undefined ? (
        <span
          aria-label={`Прошло через выход: ${outputCount}`}
          className={cn(
            'absolute left-[calc(100%+16px)] flex h-[18px] items-center rounded-full bg-fg-1 px-1.5 text-overline font-semibold text-surface-1 tabular-nums',
            full ? 'top-9' : 'top-1/2 -translate-y-1/2',
          )}
        >
          {outputCount}
        </span>
      ) : null}
      {people && people.length > 0 ? <People people={people} /> : null}
    </div>
  );
}

/* ---------- Special nodes ---------- */

export interface CanvasTableField {
  name: string;
  /** Type or the linked section: «uuid», «текст», «Клиенты», «₽». */
  type: string;
  key?: 'primary' | 'foreign';
  /** The field an edge is attached to or hovered: accent-soft row. */
  highlighted?: boolean;
}

export interface CanvasNodeTableProps extends Omit<ComponentProps<'div'>, 'title' | 'children'> {
  title: string;
  /** Right side of the header: «1 284 записи». */
  count?: string;
  fields: readonly CanvasTableField[];
  selected?: boolean;
}

/** Section table (database schema): header and one row h30 per field; the canvas puts a port at every row (data-field). */
export function CanvasNodeTable({ title, count, fields, selected = false, className, ...props }: CanvasNodeTableProps) {
  return (
    <div
      data-slot="canvas-node-table"
      data-selected={selected ? 'single' : undefined}
      className={cn('relative flex w-64 flex-col rounded-md bg-surface-1 pb-1', selected ? RING.selected : RING.rest, className)}
      {...props}
    >
      <div className="flex items-center gap-2.5 border-b border-separator p-3">
        <CanvasNodeTile kind="data" size={28} />
        <span className="min-w-0 flex-1 truncate text-body-xs font-semibold text-fg-1">{title}</span>
        {count ? <span className="shrink-0 text-caption text-fg-3">{count}</span> : null}
      </div>
      <table aria-label={title} className="w-full border-collapse">
        <tbody>
          {fields.map((field) => (
            <tr key={field.name} data-field={field.name} data-highlighted={field.highlighted || undefined} className="h-[30px] data-highlighted:bg-accent-soft">
              <td
                className={cn(
                  'w-7 pl-3 font-mono text-overline font-semibold',
                  field.highlighted ? 'text-accent-soft-fg' : field.key === 'primary' ? 'text-warning-soft-fg' : 'text-accent-soft-fg',
                )}
              >
                {field.key === 'primary' ? (
                  <abbr title="Первичный ключ" className="no-underline">
                    ID
                  </abbr>
                ) : field.key === 'foreign' ? (
                  <abbr title="Внешний ключ" className="no-underline">
                    FK
                  </abbr>
                ) : null}
              </td>
              <td className="max-w-0 truncate font-mono text-caption font-medium text-fg-1">{field.name}</td>
              <td className="pr-3 text-right font-mono text-overline whitespace-nowrap text-fg-3">{field.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface CanvasAddStepProps extends Omit<ComponentProps<'button'>, 'children'> {
  /** Default «Добавить шаг». */
  label?: string;
  /** Hint after the label; default «Tab». Pass null to hide. */
  shortcut?: string | null;
}

/** Dashed placeholder where the next step goes: on an empty graph and after the last step. */
export function CanvasAddStep({ label = 'Добавить шаг', shortcut = 'Tab', className, ...props }: CanvasAddStepProps) {
  return (
    <button
      type="button"
      data-slot="canvas-add-step"
      className={cn(
        'kv-pressable inline-flex h-control-lg w-52 cursor-pointer items-center justify-center gap-1.5 rounded-md border-[1.5px] border-dashed border-input text-body-xs font-medium text-fg-3',
        'transition-colors duration-(--duration-micro) ease-hover hover:border-fg-3 hover:bg-fill-1 hover:text-fg-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
      {...props}
    >
      <Plus aria-hidden className="size-3.5 stroke-2" />
      {label}
      {shortcut ? <Kbd className="bg-fill-2 shadow-none">{shortcut}</Kbd> : null}
    </button>
  );
}

export interface CanvasNoteProps extends ComponentProps<'div'> {
  author?: Omit<CanvasPerson, 'editing'>;
  /** «2 мин назад». */
  time?: string;
}

/** Sticky note on the canvas: warning-soft paper with a folded corner, text and author. */
export function CanvasNote({ author, time, className, children, ...props }: CanvasNoteProps) {
  return (
    <div
      data-slot="canvas-note"
      className={cn(
        'flex w-50 flex-col gap-2 rounded-md rounded-tl-[4px] bg-warning-soft p-3 shadow-[0_1px_3px_color-mix(in_oklab,var(--color-fg-1)_8%,transparent)]',
        className,
      )}
      {...props}
    >
      <div className="text-body-xs text-fg-1 wrap-anywhere">{children}</div>
      {author ? (
        <div className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="grid size-5 shrink-0 place-items-center rounded-full text-overline font-bold text-fg-1"
            style={{ backgroundColor: `color-mix(in oklab, ${author.color} 22%, transparent)` }}
          >
            {author.name.slice(0, 1)}
          </span>
          <span className="text-overline font-medium text-warning-soft-fg">{time ? `${author.name} · ${time}` : author.name}</span>
        </div>
      ) : null}
    </div>
  );
}

export interface CanvasNodePeekRow {
  label: string;
  value: ReactNode;
}

export interface CanvasNodePeekProps extends Omit<ComponentProps<'div'>, 'title'> {
  title: string;
  /** Right side of the header: «3 мин назад · 12 из 12». */
  meta?: string;
  rows: readonly CanvasNodePeekRow[];
  /** Footer link or button: «Открыть все 12 записей». */
  action?: ReactNode;
}

/** Last run of a step for a hover card on the node: input, output and a way to all records. */
export function CanvasNodePeek({ title, meta, rows, action, className, ...props }: CanvasNodePeekProps) {
  return (
    <div data-slot="canvas-node-peek" className={cn('flex w-[276px] flex-col text-caption', className)} {...props}>
      <div className="flex items-center justify-between gap-3 border-b border-separator px-3 py-2.5">
        <span className="font-semibold text-fg-1">{title}</span>
        {meta ? <span className="text-overline text-fg-3 tabular-nums">{meta}</span> : null}
      </div>
      <dl className="grid grid-cols-[60px_1fr] gap-x-0 gap-y-1 px-3 py-3">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-fg-3">{row.label}</dt>
            <dd className="text-fg-1">{row.value}</dd>
          </div>
        ))}
      </dl>
      {action ? <div className="border-t border-separator px-3 py-2.5">{action}</div> : null}
    </div>
  );
}

/* ---------- Toolbar over the selection ---------- */

export interface CanvasNodeToolbarProps extends Omit<BaseToolbar.Root.Props, 'className'> {
  'aria-label': string;
  className?: string;
}

/** Bar 8px above the selection: one node — run, copy, disable, comment, «…»; several — align and group; group — open, fold, colour. */
export function CanvasNodeToolbar({ className, ...props }: CanvasNodeToolbarProps) {
  return (
    <BaseToolbar.Root
      data-slot="canvas-node-toolbar"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-[10px] bg-surface-1 p-1 shadow-[0_0_0_1px_var(--color-border),0_4px_12px_color-mix(in_oklab,var(--color-fg-1)_10%,transparent)]',
        className,
      )}
      {...props}
    />
  );
}

export interface CanvasToolbarButtonProps extends Omit<BaseToolbar.Button.Props, 'className' | 'children'> {
  icon?: ReactNode;
  /** Accessible name and tooltip of an icon-only button. */
  label: string;
  /** Visible text: «Шаг», «Сгруппировать». */
  children?: ReactNode;
  shortcut?: string;
  className?: string;
}

export function CanvasToolbarButton({ icon, label, children, shortcut, className, ...props }: CanvasToolbarButtonProps) {
  const button = (
    <BaseToolbar.Button
      data-slot="canvas-toolbar-button"
      aria-label={children ? undefined : label}
      className={cn(
        'inline-flex h-7 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xs text-caption font-medium text-fg-1 select-none',
        'transition-colors duration-(--duration-micro) ease-hover hover:bg-fill-2 active:bg-fill-3 data-disabled:pointer-events-none data-disabled:opacity-50',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:stroke-2',
        children ? 'px-2' : 'w-7 [&_svg]:text-fg-2',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </BaseToolbar.Button>
  );
  return children ? (
    button
  ) : (
    <Tooltip content={label} shortcut={shortcut}>
      {button}
    </Tooltip>
  );
}

export function CanvasToolbarSeparator() {
  return <BaseToolbar.Separator className="mx-0.5 h-4 w-px shrink-0 bg-separator" />;
}

/* ---------- Groups ---------- */

export interface CanvasGroupFrameProps extends Omit<ComponentProps<'div'>, 'title'> {
  title: string;
  /** Steps inside: «3 шага». */
  count: number;
  /** Frame colour, any CSS colour; default chart-3. */
  color?: string;
  /** Folded into one node: a stack of three cards with the count. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Open as a separate graph with crumbs on top. */
  onOpen?: () => void;
}

/** Group of steps: tinted frame r16 with a header; folded — a stack of cards «Подпоток · 3 шага». Children are the steps. */
export function CanvasGroupFrame({
  title,
  count,
  color = 'var(--color-chart-3)',
  collapsed = false,
  onCollapsedChange,
  onOpen,
  className,
  style,
  children,
  ...props
}: CanvasGroupFrameProps) {
  const vars = { '--kv-group': color } as CSSProperties;
  const steps = counted(count, STEPS);
  const iconButton =
    'grid size-6 shrink-0 cursor-pointer place-items-center rounded-xs text-(--kv-group) transition-colors duration-(--duration-micro) ease-hover hover:bg-[color-mix(in_oklab,var(--kv-group)_14%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring [&_svg]:size-3.5 [&_svg]:stroke-[2.25]';

  if (collapsed) {
    return (
      <div data-slot="canvas-group" data-collapsed="" className={cn('relative w-52 pt-2', className)} style={{ ...vars, ...style }} {...props}>
        <span aria-hidden className="absolute top-0 left-2 h-16 w-48 rounded-md bg-surface-1 opacity-60 shadow-[0_0_0_1px_var(--color-border)]" />
        <span aria-hidden className="absolute top-1 left-1 h-[68px] w-50 rounded-md bg-surface-1 shadow-[0_0_0_1px_var(--color-border)]" />
        <div className={cn('relative flex items-center gap-2.5 rounded-md bg-surface-1 p-3', RING.rest)}>
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-sm text-body-xs font-bold text-fg-1"
            style={{ backgroundColor: 'color-mix(in oklab, var(--kv-group) 16%, transparent)' }}
          >
            {count}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-body-xs font-semibold text-fg-1">{title}</span>
            <span className="text-caption text-fg-3">Подпоток · {steps}</span>
          </div>
          {onCollapsedChange ? (
            <button type="button" aria-label={`Развернуть группу «${title}»`} aria-expanded={false} onClick={() => onCollapsedChange(false)} className={iconButton}>
              <ChevronDown className="-rotate-90" />
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      data-slot="canvas-group"
      role="group"
      aria-label={title}
      className={cn('flex flex-col gap-4 rounded-lg px-5 pt-3 pb-6', className)}
      style={{
        ...vars,
        backgroundColor: 'color-mix(in oklab, var(--kv-group) 7%, transparent)',
        boxShadow: 'inset 0 0 0 1.5px color-mix(in oklab, var(--kv-group) 40%, transparent)',
        ...style,
      }}
      {...props}
    >
      <div className="flex items-center gap-2">
        {onCollapsedChange ? (
          <button type="button" aria-label={`Свернуть группу «${title}»`} aria-expanded onClick={() => onCollapsedChange(true)} className={cn(iconButton, '-ml-1.5')}>
            <ChevronDown />
          </button>
        ) : null}
        <span className="truncate text-body-xs font-semibold text-fg-1">{title}</span>
        <span className="shrink-0 text-caption text-fg-2">{steps}</span>
        <span className="flex-1" />
        {onOpen ? (
          <Tooltip content="Открыть как граф">
            <button type="button" aria-label="Открыть как граф" onClick={onOpen} className={iconButton}>
              <ExternalLink />
            </button>
          </Tooltip>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export interface CanvasSubflowBreadcrumbsProps extends Omit<ComponentProps<'nav'>, 'children'> {
  /** The graph the group lives in: «Заявка → сделка». */
  parent: string;
  /** The opened group: «Обработка оплаты». */
  current: string;
  /** Back to the parent graph; Esc does the same unless something else handled it. */
  onBack: () => void;
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/** Crumbs over a group opened as its own graph, top left; Esc goes back. */
export function CanvasSubflowBreadcrumbs({ parent, current, onBack, className, ...props }: CanvasSubflowBreadcrumbsProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || isTyping(event.target)) return;
      onBack();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onBack]);

  return (
    <nav
      data-slot="canvas-subflow-breadcrumbs"
      aria-label="Путь"
      className={cn(
        'inline-flex h-control-md items-center gap-1.5 rounded-[10px] bg-surface-1 pr-1.5 pl-1 text-body-xs shadow-[0_0_0_1px_var(--color-border),0_2px_8px_color-mix(in_oklab,var(--color-fg-1)_6%,transparent)]',
        className,
      )}
      {...props}
    >
      <button
        type="button"
        aria-label={`Назад к «${parent}»`}
        onClick={onBack}
        className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-xs px-1.5 text-fg-3 transition-colors duration-(--duration-micro) ease-hover hover:bg-fill-1 hover:text-fg-1 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ChevronLeft aria-hidden className="size-3.5 stroke-2 text-fg-2" />
        {parent}
      </button>
      <span aria-hidden className="text-fg-4">
        /
      </span>
      <span aria-current="page" className="font-semibold text-fg-1">
        {current}
      </span>
      <Kbd className="ml-1.5 h-6 bg-fill-2 px-2 shadow-none">Esc</Kbd>
    </nav>
  );
}
