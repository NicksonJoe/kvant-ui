import { ArrowRight, CircleAlert, CircleCheck, Download, History, Maximize2, Minimize2, MoreHorizontal, Plus, X } from 'lucide-react';
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { cn } from '../lib/cn';
import { useControllable } from '../lib/use-controllable';
import { Button, IconButton } from './button';
import { AgentAvatar } from './conversation';
import { CopyButton } from './copy-button';
import { Menu, MenuContent, MenuItem, MenuTrigger } from './menu';
import { Tooltip } from './popover';
import { Progress } from './progress';
import { SearchField } from './search-field';
import { Spinner } from './spinner';

const AGENT = 'Агент Норды';

/** Turns into a fixed corner element or stays in the flow (docs, previews, a custom layout). */
export type AgentPlacement = 'fixed' | 'inline';

/** Moves focus between the buttons of a list with ↑ ↓, wrapping around; Home and End jump to the ends. */
function moveFocus(event: KeyboardEvent<HTMLElement>, selector: string) {
  const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
  if (!step && event.key !== 'Home' && event.key !== 'End') return;
  const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(selector));
  const at = items.indexOf(document.activeElement as HTMLElement);
  if (at < 0) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (at + step + items.length) % items.length;
  items[next]?.focus();
}

/* ---------- Launcher ---------- */

export type AgentLauncherStatus = 'idle' | 'working' | 'unread';

export interface AgentLauncherProps extends Omit<ComponentProps<'button'>, 'children'> {
  /** working — ring runs around the face · unread — a red dot until the answer is read. */
  status?: AgentLauncherStatus;
  /** What the agent does, shown to the left while working and added to the name: «Готовлю отчёт…». */
  activity?: string;
  placement?: AgentPlacement;
}

const hint = 'rounded-full bg-fg-1 px-2.5 py-1.5 text-caption font-medium whitespace-nowrap text-surface-1 shadow-tooltip';

/**
 * Round 56 button of the agent in the bottom right corner (24 from the edges, 16 + safe area on a phone).
 * Hide it while the panel is open; ⌘J comes from {@link useAgentShortcut}.
 */
export function AgentLauncher({ status = 'idle', activity, placement = 'fixed', hidden, className, ...props }: AgentLauncherProps) {
  const working = status === 'working';
  const doing = activity?.replace(/[….]+$/, '').trim();
  const name = working ? `${AGENT}, ${doing ? doing.charAt(0).toLowerCase() + doing.slice(1) : 'работает'}` : status === 'unread' ? `${AGENT}, есть ответ` : AGENT;
  const button = (
    <button
      type="button"
      data-slot="agent-launcher"
      data-status={status}
      aria-label={name}
      aria-keyshortcuts="Meta+J Control+J"
      aria-busy={working || undefined}
      className={cn(
        'kv-pressable relative grid size-14 shrink-0 place-items-center rounded-full shadow-overlay [--kv-press-scale:var(--scale-enter)]',
        'transition-[translate,box-shadow] duration-(--duration-quick) ease-out hover:-translate-y-(--shift-xs) hover:shadow-modal dark:shadow-[0_0_0_1px_oklch(1_0_0/0.1),0_12px_32px_-8px_oklch(0_0_0/0.6)]',
        className,
      )}
      {...props}
    >
      <AgentAvatar size={56} />
      {working ? (
        <svg
          data-slot="agent-launcher-ring"
          aria-hidden
          viewBox="0 0 68 68"
          className="pointer-events-none absolute -inset-1.5 size-[68px] animate-[kv-spin_1200ms_linear_infinite] motion-reduce:animate-none in-[[data-reduce-motion]]:animate-none"
        >
          <circle cx="34" cy="34" r="33" fill="none" strokeWidth="2" className="stroke-accent-soft-hover dark:stroke-accent-soft" />
          <path d="M34 1 A33 33 0 0 1 67 34" fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-accent dark:stroke-ring" />
        </svg>
      ) : null}
      {status === 'unread' ? (
        <span
          data-slot="agent-launcher-dot"
          aria-hidden
          className="absolute top-[3px] left-[41px] size-3 rounded-full bg-danger shadow-[0_0_0_2px_var(--color-background)] transition-[scale] duration-300 ease-spring-10 starting:scale-0"
        />
      ) : null}
    </button>
  );
  return (
    <div
      data-slot="agent-launcher-root"
      hidden={hidden}
      className={cn(
        'flex items-center gap-2',
        placement === 'fixed' && 'fixed right-6 bottom-6 z-30 max-sm:right-4 max-sm:bottom-[calc(16px+env(safe-area-inset-bottom))]',
      )}
    >
      {working && activity ? (
        <span aria-hidden className={cn(hint, 'transition-opacity duration-(--duration-quick) ease-out starting:opacity-0')}>
          {activity}
        </span>
      ) : null}
      {working ? (
        button
      ) : (
        <Tooltip content={AGENT} shortcut="⌘J" side="left" sideOffset={8}>
          {button}
        </Tooltip>
      )}
      <span role="status" className="sr-only">
        {status === 'unread' ? `${AGENT}: ответ готов` : ''}
      </span>
    </div>
  );
}

/** ⌘J on macOS, Ctrl+J elsewhere: opens and closes the agent from anywhere in the app. */
export function useAgentShortcut(onToggle: () => void): void {
  const toggle = useEffectEvent(onToggle);
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.shiftKey || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'j') return;
      event.preventDefault();
      toggle();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

/* ---------- Panel ---------- */

export type AgentPanelSize = 'floating' | 'docked';

export interface AgentPanelProps extends Omit<ComponentProps<'aside'>, 'title'> {
  onClose: () => void;
  /** Workspace chip next to the name: «Студия Север». */
  workspace?: string;
  /** floating — card 420 × 680 in the corner · docked — 560 at full height, the page narrows by 576. */
  size?: AgentPanelSize;
  /** Shows «Развернуть» / «Свернуть в карточку». Remember the size between sessions. */
  onSizeChange?: (size: AgentPanelSize) => void;
  /** History replaces the body; the composer stays and starts a new conversation. */
  historyOpen?: boolean;
  /** Shows the history button. */
  onHistoryChange?: (open: boolean) => void;
  /** PromptInput at the bottom, 12 from the edges. */
  composer?: ReactNode;
  /** Where focus goes on close: the launcher. Default — the element focused before the panel opened. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  placement?: AgentPlacement;
}

const sizes: Record<AgentPlacement, Record<AgentPanelSize, string>> = {
  fixed: {
    floating: 'fixed right-6 bottom-6 z-30 h-[min(680px,100dvh-48px)] w-[420px] rounded-[28px]',
    // below 1200 the docked panel is a card again: the page would be too narrow next to it
    docked: 'fixed right-6 bottom-6 z-30 h-[min(680px,100dvh-48px)] w-[420px] rounded-[28px] min-[1200px]:top-2 min-[1200px]:right-2 min-[1200px]:bottom-2 min-[1200px]:h-auto min-[1200px]:w-[560px] min-[1200px]:rounded-3xl',
  },
  inline: {
    floating: 'h-[680px] w-[420px] max-w-full rounded-[28px]',
    docked: 'h-[784px] w-[560px] max-w-full rounded-3xl',
  },
};

const phone = '(max-width: 639px)';
const subscribePhone = (onChange: () => void) => {
  const query = window.matchMedia?.(phone);
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
};
const usePhone = () =>
  useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia?.(phone).matches ?? false,
    () => false,
  );

const focusable = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * The agent next to the page, not over it: the page keeps working. Not a modal — focus is free, F6 jumps between
 * the page and the panel; on a phone it covers the screen and becomes a modal dialog.
 */
export function AgentPanel({
  onClose,
  workspace,
  size = 'floating',
  onSizeChange,
  historyOpen = false,
  onHistoryChange,
  composer,
  returnFocusRef,
  placement = 'fixed',
  'aria-label': label = AGENT,
  className,
  children,
  onKeyDown,
  ...props
}: AgentPanelProps) {
  const root = useRef<HTMLElement>(null);
  const footer = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const modal = usePhone() && placement === 'fixed';
  const [before] = useState(() => (typeof document === 'undefined' ? null : document.activeElement));
  const back = useEffectEvent(() => {
    const target = returnFocusRef?.current ?? before;
    if (target instanceof HTMLElement && target.isConnected) target.focus();
  });

  useLayoutEffect(() => {
    const field = footer.current?.querySelector<HTMLElement>('textarea, input');
    (field ?? root.current)?.focus();
  }, []);
  // a passive cleanup runs after the commit has shown the launcher again; a layout one would find it still hidden
  useEffect(() => () => back(), []);

  const onF6 = useEffectEvent((event: globalThis.KeyboardEvent) => {
    if (event.key !== 'F6' || event.defaultPrevented) return;
    event.preventDefault();
    if (root.current?.contains(document.activeElement)) back();
    else (footer.current?.querySelector<HTMLElement>('textarea, input') ?? root.current)?.focus();
  });
  useEffect(() => {
    const listener = (event: globalThis.KeyboardEvent) => onF6(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    // keys from menus and tooltips reach here through the React tree; only the panel's own DOM closes it
    if (event.defaultPrevented || !(event.target instanceof Node) || !event.currentTarget.contains(event.target)) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'Tab' && modal) {
      const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(focusable));
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };

  const docked = size === 'docked';
  return (
    <aside
      ref={root}
      data-slot="agent-panel"
      data-size={size}
      role={modal ? 'dialog' : 'complementary'}
      aria-modal={modal || undefined}
      aria-label={label}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex flex-col overflow-hidden bg-overlay text-fg-1 shadow-overlay outline-none',
        'origin-bottom-right [transition:opacity_var(--duration-base)_var(--ease-out),scale_var(--duration-base)_var(--ease-out),width_var(--duration-slow)_var(--ease-fluid),height_var(--duration-slow)_var(--ease-fluid)] starting:scale-(--scale-enter) starting:opacity-0',
        sizes[placement][size],
        placement === 'fixed' && 'max-sm:inset-0 max-sm:h-dvh max-sm:w-full max-sm:rounded-none',
        className,
      )}
      {...props}
    >
      <header
        data-slot="agent-panel-header"
        className={cn('flex h-14 shrink-0 items-center gap-2 pr-3 pl-4 shadow-[inset_0_-1px_0_transparent] transition-shadow duration-(--duration-quick)', scrolled && 'shadow-[inset_0_-1px_0_var(--color-separator)]')}
      >
        <h2 className="text-body-sm font-semibold">{label}</h2>
        {workspace ? (
          <span data-slot="agent-panel-workspace" className="inline-flex h-[22px] min-w-0 items-center truncate rounded-full bg-fill-2 px-2 text-caption font-medium text-fg-2">
            {workspace}
          </span>
        ) : null}
        <span className="flex-1" />
        <div className="flex shrink-0 items-center gap-0.5">
          {onHistoryChange ? (
            <Tooltip content="История разговоров" side="bottom">
              <IconButton
                size="sm"
                aria-label="История разговоров"
                aria-pressed={historyOpen}
                icon={<History />}
                className={cn(historyOpen && 'bg-fill-2 [&>svg]:text-fg-1')}
                onClick={() => onHistoryChange(!historyOpen)}
              />
            </Tooltip>
          ) : null}
          {onSizeChange ? (
            <Tooltip content={docked ? 'Свернуть в карточку' : 'Развернуть'} side="bottom">
              <IconButton
                size="sm"
                aria-label={docked ? 'Свернуть в карточку' : 'Развернуть'}
                icon={docked ? <Minimize2 /> : <Maximize2 />}
                onClick={() => onSizeChange(docked ? 'floating' : 'docked')}
              />
            </Tooltip>
          ) : null}
          <Tooltip content="Закрыть" shortcut="Esc" side="bottom">
            <IconButton size="sm" aria-label="Закрыть" icon={<X />} onClick={onClose} />
          </Tooltip>
        </div>
      </header>
      <div
        data-slot="agent-panel-body"
        className="flex min-h-0 flex-1 flex-col"
        onScrollCapture={(event) => setScrolled(event.target instanceof HTMLElement && event.target.scrollTop > 0)}
      >
        {children}
      </div>
      {composer ? (
        <div ref={footer} data-slot="agent-panel-footer" className="shrink-0 px-3 pb-3">
          {composer}
        </div>
      ) : null}
    </aside>
  );
}

/* ---------- Empty state ---------- */

export interface AgentEmptyProps extends Omit<ComponentProps<'div'>, 'title' | 'onSelect'> {
  /** First name for the greeting: «Анна, чем помочь?». */
  name?: string;
  title?: ReactNode;
  /** What the agent knows here: «Знаю всё о «Студии Север»: клиентов, сделки, задачи и деньги.» */
  description?: ReactNode;
  /** Requests for this screen, most frequent first; up to four are shown. */
  suggestions?: readonly string[];
  /** Sends the request as an ordinary message of the user. */
  onSelect: (text: string) => void;
}

/** First screen of a conversation: greeting and up to four requests, pressed against the composer. */
export function AgentEmpty({ name, title, description, suggestions = [], onSelect, className, ...props }: AgentEmptyProps) {
  return (
    <div data-slot="agent-empty" className={cn('flex flex-1 flex-col justify-end gap-5 px-3 pt-6 pb-4', className)} {...props}>
      <div className="flex flex-col gap-2 px-3 transition-[opacity,translate] duration-(--duration-base) ease-out starting:translate-y-(--shift-md) starting:opacity-0">
        <h3 className="text-display-sm font-semibold tracking-[-0.012em] text-fg-1">{title ?? (name ? `${name}, чем помочь?` : 'Чем помочь?')}</h3>
        {description ? <p className="text-body-sm text-fg-2">{description}</p> : null}
      </div>
      {suggestions.length ? (
        <div role="group" aria-label="Подсказки" className="flex flex-col gap-0.5" onKeyDown={(event) => moveFocus(event, 'button')}>
          {suggestions.slice(0, 4).map((text, index) => (
            <button
              key={text}
              type="button"
              onClick={() => onSelect(text)}
              style={{ transitionDelay: `${(index + 1) * 40}ms` }}
              className={cn(
                'group kv-pressable flex h-10 shrink-0 items-center gap-2.5 rounded-md px-3 text-left text-body-sm text-fg-1 [--kv-press-scale:var(--scale-press-wide)] hover:bg-fill-2 active:bg-fill-3',
                '[transition:background-color_var(--duration-micro)_var(--ease-hover),opacity_var(--duration-base)_var(--ease-out),translate_var(--duration-base)_var(--ease-out),scale_var(--duration-fast)_var(--ease-out)] starting:translate-y-(--shift-md) starting:opacity-0',
              )}
            >
              <span aria-hidden className="w-4 shrink-0 text-fg-3 group-hover:text-accent-soft-fg group-active:text-accent-soft-fg">
                ↳
              </span>
              <span className="min-w-0 flex-1 truncate">{text}</span>
              <ArrowRight aria-hidden className="size-4 shrink-0 stroke-[1.75] text-fg-3 opacity-0 group-hover:opacity-100 group-active:opacity-100" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Status ---------- */

export interface AgentStatusProps extends Omit<ComponentProps<'p'>, 'children'> {
  state: 'working' | 'done';
  /** «6 с» while working, «за 14 с» when done. */
  time?: string;
}

/** One line over an answer instead of steps and tools: spinner + «В процессе» + timer, or a check + «Готово». */
export function AgentStatus({ state, time, className, ...props }: AgentStatusProps) {
  return (
    <p data-slot="agent-status" data-state={state} className={cn('flex items-center gap-2 text-body-xs text-fg-2', className)} {...props}>
      {state === 'working' ? <Spinner size={16} className="text-accent" /> : <CircleCheck aria-hidden className="size-4 shrink-0 stroke-[1.75] text-success" />}
      <span>{state === 'working' ? 'В процессе' : 'Готово'}</span>
      {time ? <span className="text-caption text-fg-3 tabular-nums">{time}</span> : null}
    </p>
  );
}

/* ---------- File ---------- */

const fileTones: Record<string, string> = {
  xlsx: 'bg-success-soft text-success-soft-fg',
  xls: 'bg-success-soft text-success-soft-fg',
  pdf: 'bg-danger-soft text-danger-soft-fg',
};

export type AgentFileStatus = 'ready' | 'preparing' | 'error';

export interface AgentFileCardProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** «Оборот · октябрь 2026.xlsx». */
  name: string;
  /** Extension on the 40 tile: xlsx green, pdf red, the rest neutral. */
  format: string;
  /** «3 листа · 18 КБ»; while preparing — what is being made: «Собираю лист «Воронка» · 2 из 3». */
  meta?: ReactNode;
  status?: AgentFileStatus;
  /** 0–100 while preparing. */
  progress?: number;
  /** Why it failed: «Банк не отдал выписку за 27–29 октября». */
  error?: ReactNode;
  onDownload?: () => void;
  /** Preview in a 560 sheet. */
  onOpen?: () => void;
  onRetry?: () => void;
  /** Second way out of an error: a ghost button «Собрать без них». */
  errorAction?: ReactNode;
}

/** A file the agent made: tile, name, meta and actions; preparing shows progress, an error says why and what helps. */
export function AgentFileCard({
  name,
  format,
  meta,
  status = 'ready',
  progress,
  error,
  onDownload,
  onOpen,
  onRetry,
  errorAction,
  className,
  ...props
}: AgentFileCardProps) {
  const extension = format.replace(/^\./, '').toLowerCase();
  const actions =
    status === 'ready' ? (
      <>
        {onDownload ? (
          <Button variant="secondary" size="sm" leadingIcon={<Download />} onClick={onDownload}>
            Скачать
          </Button>
        ) : null}
        {onOpen ? (
          <Button variant="ghost" size="sm" onClick={onOpen}>
            Открыть
          </Button>
        ) : null}
      </>
    ) : status === 'error' ? (
      <>
        {onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Повторить
          </Button>
        ) : null}
        {errorAction}
      </>
    ) : null;
  return (
    <div
      data-slot="agent-file"
      data-status={status}
      aria-busy={status === 'preparing' || undefined}
      className={cn(
        'flex flex-col gap-3 rounded-lg bg-surface-1 p-3 shadow-raised transition-[opacity,translate] duration-(--duration-base) ease-out starting:translate-y-(--shift-md) starting:opacity-0',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-sm font-mono text-[10px] leading-3 font-bold tracking-[0.02em]',
            status === 'preparing' ? 'bg-fill-1' : status === 'error' ? 'bg-danger-soft text-danger-soft-fg' : (fileTones[extension] ?? 'bg-fill-2 text-fg-2'),
          )}
        >
          {status === 'preparing' ? (
            <Spinner size={16} className="text-accent" />
          ) : status === 'error' ? (
            <CircleAlert className="size-4.5 stroke-[1.75]" />
          ) : (
            extension.toUpperCase()
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-body-sm font-medium text-fg-1">{name}</span>
          {status === 'error' && error ? (
            <span className="text-caption text-danger-soft-fg">{error}</span>
          ) : meta ? (
            <span className="text-caption text-fg-3">{meta}</span>
          ) : null}
        </div>
      </div>
      {status === 'preparing' && progress !== undefined ? (
        <div className="pr-1 pl-13">
          <Progress size="sm" value={progress} aria-label={`Готовность «${name}»`} />
        </div>
      ) : null}
      {actions && (status !== 'error' || onRetry || errorAction) ? <div className="flex flex-wrap items-center gap-2 pl-13">{actions}</div> : null}
    </div>
  );
}

/* ---------- Table in the chat ---------- */

export type AgentTableValue = string | number;

export interface AgentTableColumn<K extends string = string> {
  key: K;
  label: string;
  /** Numbers: tabular figures, aligned right. */
  numeric?: boolean;
}

export type AgentTableRow<K extends string = string> = Readonly<Record<K, AgentTableValue>>;

/** The table as tab-separated text: pasted into a spreadsheet it lands in cells as is. */
export function agentTableText<K extends string>(columns: readonly AgentTableColumn<K>[], rows: readonly AgentTableRow<K>[], total?: AgentTableRow<K>): string {
  const line = (cells: readonly AgentTableValue[]) => cells.map((cell) => String(cell).replace(/[\t\n]+/g, ' ')).join('\t');
  return [line(columns.map((column) => column.label)), ...[...rows, ...(total ? [total] : [])].map((row) => line(columns.map((column) => row[column.key])))].join('\n');
}

export interface AgentTableProps<K extends string> extends Omit<ComponentProps<'figure'>, 'title' | 'children'> {
  title: string;
  /** «на 29 октября · 6 сделок». */
  caption?: ReactNode;
  /** Up to 4 columns: a longer table goes as a file. */
  columns: readonly AgentTableColumn<K>[];
  /** Up to 8 rows. */
  rows: readonly AgentTableRow<K>[];
  /** Total row on fill-1, semibold. */
  total?: AgentTableRow<K>;
  /** One line of context under the table: «Оплачено в октябре — 310 000 ₽, одна сделка». */
  note?: ReactNode;
  /** The whole thing as a file. */
  onDownload?: () => void;
  downloadLabel?: string;
}

/** A short table right in the answer, copied as tab-separated text. */
export function AgentTable<K extends string>({ title, caption, columns, rows, total, note, onDownload, downloadLabel = 'Скачать XLSX', className, ...props }: AgentTableProps<K>) {
  const cells = (row: AgentTableRow<K>, strong: boolean) =>
    columns.map((column, index) => {
      const Cell = index === 0 ? 'th' : 'td';
      return (
        <Cell
          key={column.key}
          scope={index === 0 ? 'row' : undefined}
          className={cn(
            'h-9 px-4 text-left text-body-sm font-normal',
            column.numeric && 'text-right tabular-nums',
            column.numeric && index !== columns.length - 1 ? 'text-fg-2' : 'text-fg-1',
            strong && 'font-semibold text-fg-1',
          )}
        >
          {row[column.key]}
        </Cell>
      );
    });
  return (
    <figure data-slot="agent-table" className={cn('flex flex-col overflow-hidden rounded-lg bg-surface-1 shadow-raised', className)} {...props}>
      <figcaption className="flex items-center gap-3 py-3 pr-2 pl-4">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-body-sm font-semibold text-fg-1">{title}</span>
          {caption ? <span className="text-caption text-fg-3">{caption}</span> : null}
        </span>
        <CopyButton value={agentTableText(columns, rows, total)} aria-label="Копировать таблицу" />
      </figcaption>
      <table aria-label={title} className="w-full border-collapse">
        <thead>
          <tr className="h-8 border-t border-separator bg-surface-2">
            {columns.map((column) => (
              <th key={column.key} scope="col" className={cn('px-4 text-caption font-medium text-fg-3', column.numeric ? 'text-right' : 'text-left')}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-separator">
              {cells(row, false)}
            </tr>
          ))}
          {total ? <tr className="border-t border-separator bg-fill-1">{cells(total, true)}</tr> : null}
        </tbody>
      </table>
      {note || onDownload ? (
        <div className="flex items-center gap-3 border-t border-separator py-2 pr-2 pl-4">
          <span className="flex-1 text-caption text-fg-3">{note}</span>
          {onDownload ? (
            <Button variant="ghost" size="sm" leadingIcon={<Download />} onClick={onDownload}>
              {downloadLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </figure>
  );
}

/* ---------- History ---------- */

export type AgentConversationStatus = 'idle' | 'working' | 'waiting';

export interface AgentConversation {
  id: string;
  /** Given by the agent from the first request; can be renamed. */
  title: string;
  /** Time of the last reply. */
  date: Date;
  /** The last reply, one line. */
  preview?: string;
  /** working — «В процессе» and a timer instead of the reply · waiting — «Ждёт вашего решения», raised to the top of its group. */
  status?: AgentConversationStatus;
  /** Timer of a working conversation: «6 с». */
  elapsed?: string;
}

export interface AgentConversationGroup {
  label: string;
  items: AgentConversation[];
}

const DAY = 86_400_000;
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long' });
const clock = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function dayLabel(date: Date, now: Date): string {
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY);
  if (days <= 0) return 'Сегодня';
  if (days === 1) return 'Вчера';
  if (days < 7) return capital(weekday.format(date));
  const month = capital(monthName.format(date));
  return date.getFullYear() === now.getFullYear() ? month : `${month} ${date.getFullYear()}`;
}

/** Groups: Сегодня, Вчера, a weekday with the date for this week, then months. Newest first; waiting ones on top of their group. */
export function groupConversations(conversations: readonly AgentConversation[], now: Date = new Date()): AgentConversationGroup[] {
  const groups: AgentConversationGroup[] = [];
  const sorted = [...conversations].sort((a, b) => b.date.getTime() - a.date.getTime());
  for (const item of sorted) {
    const label = dayLabel(item.date, now);
    const group = groups.at(-1);
    if (group?.label === label) group.items.push(item);
    else groups.push({ label, items: [item] });
  }
  for (const group of groups) group.items.sort((a, b) => Number(b.status === 'waiting') - Number(a.status === 'waiting'));
  return groups;
}

export interface AgentHistoryProps extends Omit<ComponentProps<'div'>, 'onSelect'> {
  conversations: readonly AgentConversation[];
  /** The conversation now in the panel: fill-2, aria-current. */
  activeId?: string;
  onSelect: (id: string) => void;
  /** «Новый» in the header. */
  onNew?: () => void;
  onRename?: (id: string) => void;
  onDelete?: (id: string) => void;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  now?: Date;
}

/** Past conversations instead of the panel body: search, groups by day, the open one marked. */
export function AgentHistory({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  query: queryProp,
  defaultQuery = '',
  onQueryChange,
  now,
  className,
  ...props
}: AgentHistoryProps) {
  const [query, setQuery] = useControllable(queryProp, defaultQuery, onQueryChange);
  const needle = query.trim().toLocaleLowerCase('ru');
  const found = needle ? conversations.filter((item) => `${item.title} ${item.preview ?? ''}`.toLocaleLowerCase('ru').includes(needle)) : conversations;
  const groups = groupConversations(found, now);
  const menu = onRename || onDelete;

  return (
    <div
      data-slot="agent-history"
      className={cn('flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-2 transition-[opacity,translate] duration-(--duration-quick) ease-out starting:-translate-x-(--shift-md) starting:opacity-0', className)}
      {...props}
    >
      <div className="flex items-center gap-2 pt-1 pb-2 pl-3">
        <h3 className="flex-1 text-body-md font-semibold text-fg-1">История разговоров</h3>
        {onNew ? (
          <Button variant="ghost" size="sm" leadingIcon={<Plus />} onClick={onNew}>
            Новый
          </Button>
        ) : null}
      </div>
      <SearchField aria-label="Найти в разговорах" placeholder="Найти в разговорах" value={query} onValueChange={setQuery} />
      {groups.length ? (
        groups.map((group) => (
          <section key={group.label} aria-label={group.label} className="flex flex-col gap-0.5">
            <h4 className="px-3 pt-3 pb-1 text-caption font-medium text-fg-3">{group.label}</h4>
            {group.items.map((item) => {
              const working = item.status === 'working';
              return (
                <div key={item.id} data-slot="agent-history-row" className="group/row relative">
                  <button
                    type="button"
                    aria-current={item.id === activeId || undefined}
                    aria-busy={working || undefined}
                    onClick={() => onSelect(item.id)}
                    className="flex w-full flex-col gap-0.5 rounded-md px-3 py-2 text-left transition-colors duration-(--duration-micro) ease-hover hover:bg-fill-1 aria-[current=true]:bg-fill-2"
                  >
                    <span className={cn('flex items-center gap-2', menu && 'group-focus-within/row:pr-6 group-hover/row:pr-6')}>
                      <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-fg-1">{item.title}</span>
                      {working ? (
                        <Spinner size={16} className="size-3.5 text-accent" />
                      ) : (
                        <time
                          dateTime={item.date.toISOString()}
                          className={cn('shrink-0 text-caption text-fg-3 tabular-nums', menu && 'group-focus-within/row:hidden group-hover/row:hidden')}
                        >
                          {clock.format(item.date)}
                        </time>
                      )}
                    </span>
                    <span className="truncate text-body-xs text-fg-3">
                      {working ? (
                        <>
                          <span className="font-medium text-accent-soft-fg">В процессе</span>
                          {item.elapsed ? ` · ${item.elapsed}` : null}
                        </>
                      ) : item.status === 'waiting' ? (
                        <>
                          <span className="font-medium text-warning-soft-fg">Ждёт вашего решения</span>
                          {item.preview ? ` · ${item.preview}` : null}
                        </>
                      ) : (
                        item.preview
                      )}
                    </span>
                  </button>
                  {menu && !working ? (
                    <Menu>
                      <MenuTrigger
                        aria-label={`Действия: ${item.title}`}
                        className="absolute top-2 right-2 grid h-5 w-6 place-items-center rounded-xs text-fg-2 opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100 hover:bg-fill-2 focus-visible:opacity-100 aria-expanded:opacity-100"
                      >
                        <MoreHorizontal aria-hidden className="size-4 stroke-2" />
                      </MenuTrigger>
                      <MenuContent align="end">
                        {onRename ? <MenuItem onClick={() => onRename(item.id)}>Переименовать</MenuItem> : null}
                        {onDelete ? (
                          <MenuItem destructive onClick={() => onDelete(item.id)}>
                            Удалить
                          </MenuItem>
                        ) : null}
                      </MenuContent>
                    </Menu>
                  ) : null}
                </div>
              );
            })}
          </section>
        ))
      ) : (
        <p className="px-3 pt-6 text-center text-body-sm text-fg-3">{needle ? 'Ничего не нашлось' : 'Разговоров пока нет'}</p>
      )}
    </div>
  );
}
