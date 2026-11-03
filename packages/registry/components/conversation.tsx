import { ArrowDown, CircleAlert } from 'lucide-react';
import { Fragment, useEffectEvent, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Alert } from './alert';
import { Button } from './button';
import type { MessageDirection } from './message';
import { Tooltip } from './popover';
import { Skeleton } from './progress';
import { ScrollArea } from './scroll-area';
import { Spinner } from './spinner';

/* ---------- Pure logic: days, groups, words ---------- */

const MINUTE = 60_000;
/** Messages of one author further apart than this start a new group. */
const GROUP_WINDOW = 5 * MINUTE;

type Forms = readonly [one: string, few: string, many: string];
const plurals = new Intl.PluralRules('ru');
const pick = (count: number, [one, few, many]: Forms) => {
  const rule = plurals.select(count);
  return rule === 'one' ? one : rule === 'few' ? few : many;
};
const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
const toDate = (date: Date | string) => (typeof date === 'string' ? new Date(date) : date);

/** Day line of the feed: «Сегодня, 29 октября» · «Вчера» · «3 октября» · «30 декабря 2025». */
export function formatDay(date: Date, now: Date = new Date()): string {
  const day = startOfDay(date);
  if (day === startOfDay(now)) return `Сегодня, ${dayMonth.format(date)}`;
  // calendar days, not 24 hours: a DST day is 23 or 25 hours long
  if (day === new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime()) return 'Вчера';
  return date.getFullYear() === now.getFullYear() ? dayMonth.format(date) : `${dayMonth.format(date)} ${date.getFullYear()}`;
}

/** «1 новое сообщение» · «2 новых сообщения» · «5 новых сообщений». */
export function newMessagesLabel(count: number): string {
  return `${count} ${pick(count, ['новое сообщение', 'новых сообщения', 'новых сообщений'])}`;
}

export interface ConversationMessage {
  id: string;
  /** Who wrote it: messages of one author in a row make a group. */
  author: string;
  direction: MessageDirection;
  date: Date | string;
}

export type ConversationEntry<T extends ConversationMessage> =
  | { type: 'day'; key: string; label: string }
  | { type: 'unread'; key: string; label: string }
  | { type: 'group'; key: string; author: string; direction: MessageDirection; messages: readonly T[] };

export interface GroupMessagesOptions {
  /** «Сегодня» and «Вчера» are counted from it (default: now). */
  now?: Date;
  /** First unread message: the «N новых сообщений» line goes above it. */
  unreadFrom?: string;
}

/**
 * Feed entries from messages in time order: a day line before each day, the unread line, and groups of one author
 * in a row (5 minutes apart at most). Render a group as MessageGroup, the lines as ChatDivider.
 */
export function groupMessages<T extends ConversationMessage>(
  messages: readonly T[],
  { now = new Date(), unreadFrom }: GroupMessagesOptions = {},
): ConversationEntry<T>[] {
  const entries: ConversationEntry<T>[] = [];
  const unreadAt = unreadFrom === undefined ? -1 : messages.findIndex((message) => message.id === unreadFrom);
  let group: { type: 'group'; key: string; author: string; direction: MessageDirection; messages: T[] } | null = null;
  let lastDay = Number.NaN;
  let lastTime = Number.NaN;
  messages.forEach((message, index) => {
    const date = toDate(message.date);
    const day = startOfDay(date);
    let fresh = group === null || group.author !== message.author || group.direction !== message.direction || date.getTime() - lastTime > GROUP_WINDOW;
    if (day !== lastDay) {
      entries.push({ type: 'day', key: `day-${day}`, label: formatDay(date, now) });
      fresh = true;
    }
    if (index === unreadAt) {
      entries.push({ type: 'unread', key: 'unread', label: newMessagesLabel(messages.length - index) });
      fresh = true;
    }
    if (fresh || group === null) {
      group = { type: 'group', key: message.id, author: message.author, direction: message.direction, messages: [] };
      entries.push(group);
    }
    group.messages.push(message);
    lastDay = day;
    lastTime = date.getTime();
  });
  return entries;
}

export type StreamBlock = { type: 'paragraph'; words: string[] } | { type: 'list'; items: string[][] };

const LIST_ITEM = /^\s*[-•*]\s+/;
const words = (line: string) => line.split(/\s+/).filter(Boolean);

/** Agent text as it comes: paragraphs split by a blank line, «- » lines make a list; a half-typed word stays. */
export function parseStream(text: string): StreamBlock[] {
  const blocks: StreamBlock[] = [];
  let open: StreamBlock | null = null;
  for (const line of text.split('\n')) {
    if (!line.trim()) {
      open = null;
    } else if (LIST_ITEM.test(line)) {
      const item = words(line.replace(LIST_ITEM, ''));
      if (open?.type === 'list') open.items.push(item);
      else {
        open = { type: 'list', items: [item] };
        blocks.push(open);
      }
    } else if (open?.type === 'paragraph') {
      open.words.push(...words(line));
    } else {
      open = { type: 'paragraph', words: words(line) };
      blocks.push(open);
    }
  }
  return blocks;
}

const blockWords = (block: StreamBlock) => (block.type === 'paragraph' ? block.words.length : block.items.reduce((sum, item) => sum + item.length, 0));

export function countWords(text: string): number {
  return parseStream(text).reduce((sum, block) => sum + blockWords(block), 0);
}

/* ---------- Agent face ---------- */

// Porcelain face with a highlight top left and an accent glow bottom right; graphite in the dark (Paper 70H-0, 10F8-0).
const face = cn(
  'bg-[radial-gradient(circle_farthest-corner_at_32%_26%,oklch(1_0_0),transparent_55%),radial-gradient(circle_farthest-corner_at_72%_80%,color-mix(in_oklab,var(--color-accent)_16%,transparent),transparent_62%),radial-gradient(circle_farthest-corner_at_50%_50%,oklch(0.971_0.004_258)_40%,oklch(0.921_0.008_258))]',
  'shadow-[inset_0_1px_0_oklch(1_0_0/0.9),0_0_0_1px_oklch(var(--ink)/0.1),0_1px_3px_oklch(var(--ink)/0.08)]',
  'dark:bg-[radial-gradient(circle_farthest-corner_at_32%_26%,oklch(1_0_0/0.1),transparent_55%),radial-gradient(circle_farthest-corner_at_72%_80%,color-mix(in_oklab,var(--color-accent)_16%,transparent),transparent_62%),radial-gradient(circle_farthest-corner_at_50%_50%,oklch(0.31_0.013_258)_40%,oklch(0.235_0.009_258))]',
  'dark:shadow-[inset_0_1px_0_oklch(1_0_0/0.1),0_0_0_1px_oklch(1_0_0/0.08),0_1px_3px_oklch(0_0_0/0.4)]',
);

export interface AgentAvatarProps extends Omit<ComponentProps<'span'>, 'children'> {
  /** 28 next to answers, 32 in card headers, 56 on the launcher button. */
  size?: 28 | 32 | 56;
  /** Name for the screen reader; without it the face is decorative. */
  label?: string;
}

/** Face of the agent: two accent eyes on porcelain (light) or graphite (dark). */
export function AgentAvatar({ size = 32, label, className, style, ...props }: AgentAvatarProps) {
  return (
    <span
      data-slot="agent-avatar"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('inline-grid shrink-0 place-items-center rounded-full', face, className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <svg viewBox="0 0 28 28" width={size} height={size} aria-hidden className="text-accent dark:text-media-ring">
        <circle cx="10.4" cy="12.6" r="1.75" fill="currentColor" />
        <circle cx="17.6" cy="12.6" r="1.75" fill="currentColor" />
      </svg>
    </span>
  );
}

/* ---------- Conversation ---------- */

const ROWS = '[data-slot=message], [data-slot=conversation-turn]';
/** Closer to the bottom than this counts as «at the bottom». */
const NEAR_BOTTOM = 24;

export type ConversationVariant = 'chat' | 'agent';
export type ConversationHistoryStatus = 'idle' | 'loading' | 'error';

// chat: a client thread, groups 16 apart · agent: the agent panel, turns 20 apart (Paper 71K-0, YNE-0)
const layouts: Record<ConversationVariant, string> = {
  chat: 'gap-4 px-5 py-4',
  agent: 'gap-5 px-6 pt-4 pb-5',
};

const reducedMotion = () =>
  document.documentElement.hasAttribute('data-reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface ConversationProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Name of the log: «Переписка с Анной Северовой», «Агент Норды». */
  'aria-label': string;
  /** Messages, groups, ChatDivider lines, turns of the agent, TypingIndicator. */
  children: ReactNode;
  variant?: ConversationVariant;
  /** The agent is working or writing: aria-busy, so the screen reader waits for the whole answer. */
  busy?: boolean;
  /** Older messages exist above the first one. */
  hasOlder?: boolean;
  /** State of the older page: loading shows a spinner at the top, error offers «Повторить». */
  olderStatus?: ConversationHistoryStatus;
  /** Ask for the older page when the reader comes within a screen of the top; once until the rows or status change. */
  onLoadOlder?: () => void;
}

/**
 * The feed of a conversation: opens at the last message and sticks to the bottom while new ones come or an answer
 * streams in. Scrolled up, it stays where the reader is and offers «N новых сообщений»; older history loads at the
 * top without moving what is on screen. My own message always brings it back to the bottom.
 */
export function Conversation({
  'aria-label': label,
  variant = 'chat',
  busy = false,
  hasOlder = false,
  olderStatus = 'idle',
  onLoadOlder,
  className,
  children,
  ...props
}: ConversationProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const stuck = useRef(true);
  const lastTop = useRef(0);
  // the first row on screen and its offset from the top, to hold it there when content changes above
  const anchor = useRef<{ row: Element; offset: number } | null>(null);
  // the last row the reader saw at the bottom: rows after it are the new ones
  const lastSeen = useRef<Element | null>(null);
  const asked = useRef(false);
  const seen = useRef({ rows: 0, status: olderStatus });
  const latest = useRef({ hasOlder, olderStatus, onLoadOlder });
  const [away, setAway] = useState(false);
  const [fresh, setFresh] = useState(0);

  const rows = () => Array.from(content.current?.querySelectorAll(ROWS) ?? []);

  const remember = (element: HTMLElement) => {
    if (stuck.current) {
      anchor.current = null;
      lastSeen.current = rows().at(-1) ?? null;
      return;
    }
    const top = element.getBoundingClientRect().top;
    const row = rows().find((item) => item.getBoundingClientRect().bottom > top);
    anchor.current = row ? { row, offset: row.getBoundingClientRect().top - top } : null;
  };

  const loadIfNear = (element: HTMLElement) => {
    const { hasOlder: more, olderStatus: status, onLoadOlder: load } = latest.current;
    if (!more || status !== 'idle' || asked.current || !load || element.scrollTop >= element.clientHeight) return;
    asked.current = true;
    load();
  };

  const settle = () => {
    const element = viewport.current;
    if (!element) return;
    const all = rows();
    const from = lastSeen.current ? all.indexOf(lastSeen.current) : -1;
    const added = from >= 0 ? all.slice(from + 1) : [];
    if (added.some((row) => row.getAttribute('data-direction') === 'outgoing')) stuck.current = true;
    if (stuck.current) element.scrollTop = element.scrollHeight - element.clientHeight;
    else if (anchor.current?.row.isConnected) {
      const shift = anchor.current.row.getBoundingClientRect().top - element.getBoundingClientRect().top - anchor.current.offset;
      if (shift) element.scrollTop += shift;
    }
    lastTop.current = element.scrollTop;
    remember(element);
    setAway(!stuck.current);
    setFresh(stuck.current ? 0 : added.length);
    loadIfNear(element);
  };

  useLayoutEffect(() => {
    latest.current = { hasOlder, olderStatus, onLoadOlder };
    const count = rows().length;
    if (count !== seen.current.rows || olderStatus !== seen.current.status) asked.current = false;
    seen.current = { rows: count, status: olderStatus };
    settle();
  });

  const handleScroll = () => {
    const element = viewport.current;
    if (!element) return;
    const top = element.scrollTop;
    if (element.scrollHeight - element.clientHeight - top <= NEAR_BOTTOM) stuck.current = true;
    // only the reader scrolls up: growing content and our own jumps never lower scrollTop
    else if (top < lastTop.current - 1) stuck.current = false;
    lastTop.current = top;
    remember(element);
    setAway(!stuck.current);
    if (stuck.current) setFresh(0);
    loadIfNear(element);
  };

  const scrolled = useEffectEvent(handleScroll);
  const resized = useEffectEvent(settle);

  // images, a growing answer, a resized panel follow the same rules as a new render
  useLayoutEffect(() => {
    const element = viewport.current;
    const inner = content.current;
    if (!element || !inner) return undefined;
    const onScroll = () => scrolled();
    element.addEventListener('scroll', onScroll, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => resized());
    observer?.observe(element);
    observer?.observe(inner);
    return () => {
      element.removeEventListener('scroll', onScroll);
      observer?.disconnect();
    };
  }, []);

  const toBottom = () => {
    const element = viewport.current;
    if (!element) return;
    stuck.current = true;
    lastSeen.current = rows().at(-1) ?? null;
    setAway(false);
    setFresh(0);
    element.scrollTo({ top: element.scrollHeight - element.clientHeight, behavior: reducedMotion() ? 'auto' : 'smooth' });
    // the button is gone: focus goes to the feed, not to <body>
    element.focus({ preventScroll: true });
  };

  return (
    <div data-slot="conversation" data-variant={variant} className={cn('relative flex min-h-0 flex-col', className)} {...props}>
      <ScrollArea className="min-h-0 flex-1" viewportRef={viewport}>
        <div
          ref={content}
          role="log"
          aria-label={label}
          aria-live="polite"
          aria-busy={busy || olderStatus === 'loading' || undefined}
          className={cn('flex min-h-full flex-col justify-end [overflow-anchor:none]', layouts[variant])}
        >
          {hasOlder && olderStatus === 'loading' ? (
            <div data-slot="conversation-history" className="flex h-8 shrink-0 items-center justify-center gap-2 text-label-sm font-medium text-fg-3">
              <Spinner size={16} />
              Загружаем историю
            </div>
          ) : hasOlder && olderStatus === 'error' ? (
            <div data-slot="conversation-history" data-status="error" className="flex h-8 shrink-0 items-center justify-center gap-2 text-label-sm">
              <CircleAlert aria-hidden className="size-4 shrink-0 stroke-2 text-danger" />
              <span className="font-medium text-danger-soft-fg">История не загрузилась</span>
              <Button variant="link" size="sm" onClick={() => onLoadOlder?.()}>
                Повторить
              </Button>
            </div>
          ) : null}
          {children}
        </div>
      </ScrollArea>
      {away ? (
        <button
          type="button"
          data-slot="conversation-down"
          aria-label={fresh ? undefined : 'К последнему сообщению'}
          onClick={toBottom}
          className={cn(
            'kv-pressable absolute bottom-3 left-1/2 z-1 inline-flex -translate-x-1/2 items-center justify-center gap-1.5 rounded-full bg-overlay shadow-overlay hover:bg-control-hover active:bg-control-pressed [&_svg]:size-4 [&_svg]:stroke-[1.75]',
            'transition-[opacity,scale] duration-(--duration-quick) ease-out starting:scale-(--scale-enter) starting:opacity-0',
            fresh ? 'h-8 pr-3.5 pl-3 text-label-sm font-medium text-accent-soft-fg' : 'size-9 text-fg-2 [--kv-press-scale:var(--scale-press-icon)]',
          )}
        >
          <ArrowDown aria-hidden />
          {fresh ? newMessagesLabel(fresh) : null}
        </button>
      ) : null}
    </div>
  );
}

export interface ConversationTurnProps extends ComponentProps<'div'> {
  /** Who answers, for the screen reader on the face. */
  author?: string;
  /** Instead of the agent face 28. */
  avatar?: ReactNode;
}

/** A turn of the agent: no bubble — the face 28 and the answer at full width; rises 8px like a new message. */
export function ConversationTurn({ author = 'Агент Норды', avatar, className, children, ...props }: ConversationTurnProps) {
  return (
    <div
      data-slot="conversation-turn"
      className={cn(
        'flex items-start gap-3 transition-[opacity,translate] duration-(--duration-base) ease-out starting:translate-y-(--shift-md) starting:opacity-0',
        className,
      )}
      {...props}
    >
      {avatar ?? <AgentAvatar size={28} label={author} />}
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 pt-1">{children}</div>
    </div>
  );
}

/* ---------- Stream ---------- */

export type StreamState = 'thinking' | 'streaming' | 'done' | 'stopped' | 'error';

const caret = <span data-slot="stream-caret" aria-hidden="true" className="kv-caret ml-0.5 inline-block h-4 w-[7px] rounded-[2px] bg-accent align-[-3px]" />;

function StreamText({ blocks, typing }: { blocks: readonly StreamBlock[]; typing: boolean }) {
  // keys are word numbers in the whole answer: words already shown keep their node and never fade in again
  let index = 0;
  const line = (list: readonly string[], last: boolean) => (
    <>
      {list.map((word, at) => (
        <Fragment key={index++}>
          {at ? ' ' : null}
          <span data-slot="stream-word" className="transition-opacity duration-(--duration-quick) ease-out starting:opacity-0">
            {word}
          </span>
        </Fragment>
      ))}
      {typing && last ? caret : null}
    </>
  );
  return (
    <div data-slot="stream-text" className="flex flex-col gap-2.5 text-body-sm text-fg-1">
      {blocks.map((block, at) => {
        const last = at === blocks.length - 1;
        return block.type === 'paragraph' ? (
          <p key={at}>{line(block.words, last)}</p>
        ) : (
          <ul key={at} className="flex flex-col gap-1.5">
            {block.items.map((item, row) => (
              <li key={row} className="flex gap-2">
                <span aria-hidden className="flex h-5 w-4 shrink-0 items-center pl-1">
                  <span className="size-[5px] rounded-full bg-fg-3" />
                </span>
                <span className="min-w-0 flex-1">{line(item, last && row === block.items.length - 1)}</span>
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

const stopIcon = <span aria-hidden className="size-2.5 rounded-[2px] bg-current" />;

export interface StreamProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** thinking — before the first word · streaming · done · stopped by the user · error. */
  state: StreamState;
  /** The answer so far: paragraphs split by a blank line, «- » lines make a list. */
  text?: string;
  /** What the agent is doing before the first word: «Смотрю историю переписки с клиентом…». */
  thinking?: ReactNode;
  /** Name in «Норда пишет · 64 слова». */
  author?: string;
  onStop?: () => void;
  /** «Продолжить» after a stop. */
  onContinue?: () => void;
  /** «Повторить» after an error. */
  onRetry?: () => void;
  errorTitle?: ReactNode;
  /** What happened and what is kept: «Сервис перегружен. Черновик сохранён — повторите через минуту.» */
  error?: ReactNode;
  /** StreamAction buttons and a soft button; shown only once the answer is done, so they never jump under the hand. */
  actions?: ReactNode;
  /** Under the text: a file the agent made, a table. */
  children?: ReactNode;
}

/**
 * Answer of the agent as it is written: words fade in by batches where they will stay, a 7×16 accent caret blinks
 * after the last one, «Остановить» is there all the time. Thinking shows a spinner and three skeleton lines.
 */
export function Stream({
  state,
  text = '',
  thinking = 'Думаю…',
  author = 'Норда',
  onStop,
  onContinue,
  onRetry,
  errorTitle = 'Ответ не пришёл',
  error,
  actions,
  children,
  className,
  ...props
}: StreamProps) {
  const blocks = parseStream(text);
  const count = blocks.reduce((sum, block) => sum + blockWords(block), 0);
  return (
    <div data-slot="stream" data-state={state} className={cn('flex flex-col gap-2.5', className)} {...props}>
      {state === 'thinking' ? (
        <div data-slot="stream-thinking" className="flex flex-col gap-2.5">
          <p className="flex items-center gap-2 text-body-sm text-fg-3">
            <Spinner inherit size={16} className="text-accent" />
            {thinking}
          </p>
          <div className="flex flex-col gap-2 pl-6">
            <Skeleton className="w-full" />
            <Skeleton className="w-[82%]" />
            <Skeleton className="w-[56%]" />
          </div>
        </div>
      ) : null}
      {state !== 'thinking' && blocks.length ? <StreamText blocks={blocks} typing={state === 'streaming'} /> : null}
      {children}
      {state === 'streaming' ? (
        <div data-slot="stream-footer" className="flex items-center gap-2.5 pt-1.5">
          {onStop ? (
            <Button variant="secondary" size="sm" leadingIcon={stopIcon} onClick={onStop}>
              Остановить
            </Button>
          ) : null}
          <span className="text-caption text-fg-3 tabular-nums">
            {author} пишет · {count} {pick(count, ['слово', 'слова', 'слов'])}
          </span>
        </div>
      ) : null}
      {state === 'done' && actions ? (
        <div data-slot="stream-actions" className="flex items-center gap-0.5 pt-1.5 transition-opacity duration-(--duration-base) ease-out starting:opacity-0">
          {actions}
        </div>
      ) : null}
      {state === 'stopped' ? (
        <p data-slot="stream-footer" className="flex flex-wrap items-center gap-x-2 text-body-sm text-fg-3">
          <span aria-hidden className="grid size-4 shrink-0 place-items-center">
            <span className="size-[9px] rounded-[2px] bg-fg-3" />
          </span>
          <span>
            Ответ остановлен на {count} {pick(count, ['слове', 'словах', 'словах'])} ·
          </span>
          {onContinue ? (
            <Button variant="link" size="md" onClick={onContinue}>
              Продолжить
            </Button>
          ) : null}
        </p>
      ) : null}
      {state === 'error' ? (
        <Alert
          tone="danger"
          title={errorTitle}
          action={
            onRetry ? (
              <Button variant="ghost" size="xs" onClick={onRetry}>
                Повторить
              </Button>
            ) : null
          }
        >
          {error}
        </Alert>
      ) : null}
    </div>
  );
}

export interface StreamActionProps extends Omit<ComponentProps<'button'>, 'children'> {
  /** 16px Lucide icon: <Copy />, <RefreshCw />, <ThumbsUp />. */
  icon: ReactNode;
  /** Name and tooltip: «Скопировать». */
  label: string;
  /** For a two-state action (like): aria-pressed, fill-1 under the icon. */
  pressed?: boolean;
}

/** 28 ghost icon button under a finished answer, with a tooltip of the same name. */
export function StreamAction({ icon, label, pressed, className, ...props }: StreamActionProps) {
  return (
    <Tooltip content={label}>
      <button
        type="button"
        data-slot="stream-action"
        aria-label={label}
        aria-pressed={pressed}
        className={cn(
          'kv-pressable grid size-7 shrink-0 place-items-center rounded-full text-fg-2 [--kv-press-scale:var(--scale-press-icon)] hover:bg-fill-1 hover:text-fg-1 active:bg-fill-2 aria-pressed:bg-fill-1 aria-pressed:text-fg-1 [&_svg]:size-4 [&_svg]:stroke-[1.75]',
          className,
        )}
        {...props}
      >
        {icon}
      </button>
    </Tooltip>
  );
}
