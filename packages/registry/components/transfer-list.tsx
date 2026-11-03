import { ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight, CircleAlert, Lock, RotateCcw, Search, X } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { mergedRows } from '../lib/recipes';
import { Checkbox, CheckboxMark, checkboxMarkRow } from './checkbox';

export interface TransferItem {
  id: string;
  label: string;
  /** Right side, 12/16 fg-3: department, role. */
  description?: string;
  /** 28 px slot before the label, e.g. <Avatar size={28} />. */
  avatar?: ReactNode;
  /** Pinned (the owner): a lock instead of the checkbox, never moves. */
  locked?: boolean;
  /** Cannot be marked (invitation not accepted): .5. */
  disabled?: boolean;
}

export interface TransferListMessage {
  title: string;
  description?: string;
}

export interface TransferListProps {
  items: readonly TransferItem[];
  /** Ids in the right list. */
  value?: readonly string[];
  defaultValue?: readonly string[];
  /** The right list after a move, in its old order plus the moved ids. */
  onValueChange?: (ids: string[]) => void;
  /** Left and right list names; they also name the listboxes. */
  titles?: readonly [string, string];
  searchPlaceholder?: string;
  /** Rows visible in each list before it scrolls (44 each). */
  rows?: number;
  /** The right list is empty. */
  empty?: TransferListMessage;
  /** Description of a row that has just arrived on the right, 1.5 s. */
  movedText?: string;
  /** The left list is still loading: skeleton after 300 ms, buttons off. */
  loading?: boolean;
  /** The left list failed to load: the reason and «Повторить». */
  error?: TransferListMessage;
  onRetry?: () => void;
  disabled?: boolean;
  className?: string;
}

type Side = 0 | 1;
const ROW = 44;
const MOVED_MS = 1500;
const collator = new Intl.Collator('ru');
const sorted = (list: readonly TransferItem[]) =>
  [...list].sort((a, b) => Number(Boolean(b.locked)) - Number(Boolean(a.locked)) || collator.compare(a.label, b.label));
const movable = (item: TransferItem) => !item.locked && !item.disabled;
const lower = (text: string) => text.toLocaleLowerCase('ru');

function Notice({ icon, tone, title, description, children }: { icon?: ReactNode; tone?: 'danger'; title: string; description?: string; children?: ReactNode }) {
  return (
    <div data-slot="transfer-list-notice" className="flex h-full flex-col items-center justify-center gap-2.5 p-4 text-center">
      {icon ? (
        <span className={cn('grid size-10 place-items-center rounded-full [&_svg]:size-4.5 [&_svg]:stroke-[1.75]', tone === 'danger' ? 'bg-danger-soft text-danger-soft-fg' : 'bg-fill-1 text-fg-3')}>
          {icon}
        </span>
      ) : null}
      <span className="flex flex-col items-center gap-0.5">
        <span className="text-body-sm font-medium text-fg-1">{title}</span>
        {description ? <span className="text-caption text-fg-3">{description}</span> : null}
      </span>
      {children}
    </div>
  );
}

const moveButton =
  'kv-pressable relative flex w-16 shrink-0 items-center justify-center gap-1 rounded-full text-caption font-semibold tabular-nums disabled:opacity-50 [&_svg]:size-4 [&_svg]:stroke-2 @max-[767px]:[&_svg]:rotate-90';

/**
 * Two lists — what can be added and what is chosen — with a search and a counter each and buttons between them.
 * Mark rows and move them with the button, Enter or a double press; moved rows take their place by name and glow 1.5 s.
 * Keys: ↑↓ rows, Space marks, Shift+press marks a run, ⌘A marks the whole list.
 */
export function TransferList({
  items,
  value,
  defaultValue = [],
  onValueChange,
  titles = ['Доступные', 'Выбранные'],
  searchPlaceholder = 'Поиск',
  rows = 6,
  empty = { title: 'Пока ничего не выбрано', description: 'Отметьте строки слева и перенесите сюда' },
  movedText = 'Только что добавлено',
  loading = false,
  error,
  onRetry,
  disabled = false,
  className,
}: TransferListProps) {
  const [own, setOwn] = useState<readonly string[]>(defaultValue);
  const chosen = value ?? own;
  const [checked, setChecked] = useState<readonly string[]>([]);
  const [queries, setQueries] = useState<readonly [string, string]>(['', '']);
  const [moved, setMoved] = useState<readonly string[]>([]);
  const [focused, setFocused] = useState<string | null>(null);
  const anchor = useRef<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const inRight = new Set(chosen);
  const lists: readonly [TransferItem[], TransferItem[]] = [sorted(items.filter((item) => !inRight.has(item.id))), sorted(items.filter((item) => inRight.has(item.id)))];
  const blocked: readonly [boolean, boolean] = [disabled || loading || Boolean(error), disabled];
  const shown = (side: Side) => {
    const q = lower(queries[side].trim());
    return q ? lists[side].filter((item) => lower(`${item.label} ${item.description ?? ''}`).includes(q)) : lists[side];
  };
  const marked = (side: Side) => lists[side].filter((item) => checked.includes(item.id));

  const move = (side: Side, ids: readonly string[]) => {
    if (ids.length === 0 || blocked[side]) return;
    const next = side === 0 ? [...chosen, ...ids] : chosen.filter((id) => !ids.includes(id));
    setOwn(next);
    onValueChange?.(next);
    setChecked(checked.filter((id) => !ids.includes(id)));
    setMoved(ids);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMoved([]), MOVED_MS);
  };

  const toggle = (item: TransferItem, side: Side, event?: MouseEvent) => {
    if (!movable(item) || blocked[side]) return;
    const list = shown(side);
    if (event?.shiftKey && anchor.current) {
      const from = list.findIndex((row) => row.id === anchor.current);
      const to = list.findIndex((row) => row.id === item.id);
      if (from >= 0 && to >= 0) {
        const run = list.slice(Math.min(from, to), Math.max(from, to) + 1).filter(movable).map((row) => row.id);
        setChecked([...checked.filter((id) => !run.includes(id)), ...run]);
        return;
      }
    }
    anchor.current = item.id;
    setChecked(checked.includes(item.id) ? checked.filter((id) => id !== item.id) : [...checked, item.id]);
  };

  const markAll = (side: Side, on: boolean) => {
    const ids = shown(side).filter(movable).map((item) => item.id);
    setChecked(on ? [...checked.filter((id) => !ids.includes(id)), ...ids] : checked.filter((id) => !ids.includes(id)));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>, item: TransferItem, side: Side) => {
    const list = shown(side);
    const index = list.indexOf(item);
    const go = (next: TransferItem | undefined) => {
      if (!next) return;
      setFocused(next.id);
      rowRefs.current.get(next.id)?.focus();
    };
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      go({ ArrowDown: list[index + 1], ArrowUp: list[index - 1], Home: list[0], End: list.at(-1) }[event.key]);
    } else if (event.key === ' ') {
      event.preventDefault();
      toggle(item, side);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const ids = marked(side).map((row) => row.id);
      move(side, ids.length > 0 ? ids : movable(item) ? [item.id] : []);
    } else if (event.key.toLowerCase() === 'a' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      const all = shown(side).filter(movable);
      markAll(side, !all.every((row) => checked.includes(row.id)));
    }
  };

  const panel = (side: Side) => {
    const title = titles[side];
    const list = shown(side);
    const total = lists[side].length;
    const options = list.filter(movable);
    const count = options.filter((item) => checked.includes(item.id)).length;
    const all = options.length > 0 && count === options.length;
    const busy = side === 0 && loading;
    const failed = side === 0 && !loading && error !== undefined;
    const q = queries[side].trim();
    const tabStop = list.find((item) => item.id === focused) ?? list[0];
    const counter = busy ? null : failed ? '—' : count > 0 ? `${count} из ${list.length} отмечено` : q ? `${list.length} из ${total}` : String(total);
    return (
      <div
        data-slot="transfer-list-panel"
        className={cn('flex min-w-0 flex-1 flex-col overflow-clip rounded-xl shadow-raised', disabled ? 'bg-surface-2 opacity-50' : 'bg-surface-1')}
      >
        <div data-slot="transfer-list-header" className="flex h-control-xl shrink-0 items-center gap-3 border-b border-separator px-4">
          <Checkbox
            aria-label={`Отметить все: ${title}`}
            checked={all}
            indeterminate={count > 0 && !all}
            disabled={blocked[side] || options.length === 0}
            onCheckedChange={() => markAll(side, !all)}
          />
          <span className="min-w-0 flex-1 truncate text-body-sm font-semibold text-fg-1">{title}</span>
          {counter === null ? (
            <span aria-hidden className="h-2 w-10 shrink-0 rounded-[4px] bg-fill-2 [animation:kv-skeleton-delay_1ms_300ms_backwards]" />
          ) : (
            <span className="shrink-0 text-caption text-fg-3 tabular-nums">{counter}</span>
          )}
        </div>
        {busy || failed ? null : (
          <div className="px-3 py-2">
            <label className="flex h-8 items-center gap-2 rounded-full bg-fill-1 px-3 text-body-xs focus-within:bg-surface-1 focus-within:shadow-[inset_0_0_0_2px_var(--color-ring)]">
              <Search aria-hidden className="size-3.5 shrink-0 stroke-2 text-fg-3" />
              <input
                type="search"
                aria-label={`Поиск: ${title}`}
                value={queries[side]}
                disabled={disabled}
                placeholder={searchPlaceholder}
                onChange={(event) => setQueries(side === 0 ? [event.currentTarget.value, queries[1]] : [queries[0], event.currentTarget.value])}
                className="h-full min-w-0 flex-1 bg-transparent text-fg-1 outline-none placeholder:text-fg-3 [&::-webkit-search-cancel-button]:hidden"
              />
              {queries[side] ? (
                <button
                  type="button"
                  aria-label="Очистить"
                  onClick={() => setQueries(side === 0 ? ['', queries[1]] : [queries[0], ''])}
                  className="grid size-5 shrink-0 place-items-center rounded-full bg-fill-2 text-fg-2 hover:bg-fill-3 [&_svg]:size-2.5 [&_svg]:stroke-[2.5]"
                >
                  <X aria-hidden />
                </button>
              ) : null}
            </label>
          </div>
        )}
        <div
          role="listbox"
          aria-label={title}
          aria-multiselectable
          aria-busy={busy || undefined}
          aria-disabled={disabled || undefined}
          className="flex flex-col overflow-y-auto overscroll-contain px-1 pb-2"
          // Loading and errors hide the search, the list takes its 48 so both lists stay one height.
          style={{ height: rows * ROW + 8 + (busy || failed ? 48 : 0) }}
        >
          {busy ? (
            <div aria-hidden className="flex flex-col py-2 [animation:kv-skeleton-delay_1ms_300ms_backwards]">
              {[140, 112, 156].map((width) => (
                <span key={width} className="flex h-control-lg shrink-0 items-center gap-3 px-3">
                  <span className="size-[18px] rounded-xs bg-fill-2" />
                  <span className="size-7 rounded-full bg-fill-2" />
                  <span className="h-2.5 rounded-[5px] bg-fill-2" style={{ width }} />
                </span>
              ))}
            </div>
          ) : failed ? (
            <Notice icon={<CircleAlert aria-hidden />} tone="danger" title={error.title} description={error.description}>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="kv-pressable mt-0.5 flex h-8 items-center gap-1.5 rounded-full bg-fill-2 px-3.5 text-body-xs font-medium text-fg-1 hover:bg-fill-3 [&_svg]:size-3.5 [&_svg]:stroke-2"
                >
                  <RotateCcw aria-hidden />
                  Повторить
                </button>
              ) : null}
            </Notice>
          ) : list.length === 0 ? (
            q ? (
              <Notice title="Ничего не нашлось" description="Возможно, это уже в другом списке — проверьте там" />
            ) : side === 1 ? (
              <Notice icon={<ArrowLeft aria-hidden className="@max-[767px]:rotate-90" />} title={empty.title} description={empty.description} />
            ) : (
              <Notice icon={<ArrowRight aria-hidden className="@max-[767px]:rotate-90" />} title="Здесь пусто" description="Всё уже перенесено" />
            )
          ) : (
            list.map((item) => {
              const isChecked = checked.includes(item.id);
              const off = !movable(item) || blocked[side];
              const fresh = moved.includes(item.id);
              return (
                <div
                  key={item.id}
                  ref={(node) => {
                    if (node) rowRefs.current.set(item.id, node);
                    else rowRefs.current.delete(item.id);
                  }}
                  role="option"
                  aria-label={item.label}
                  aria-selected={isChecked}
                  aria-disabled={off || undefined}
                  data-moved={fresh || undefined}
                  tabIndex={disabled ? -1 : item === tabStop ? 0 : -1}
                  onFocus={() => setFocused(item.id)}
                  onClick={(event) => toggle(item, side, event)}
                  onDoubleClick={() => (off ? undefined : move(side, [item.id]))}
                  onKeyDown={(event) => onKeyDown(event, item, side)}
                  className={cn(
                    'flex h-control-lg shrink-0 cursor-default items-center gap-3 overflow-hidden rounded-md px-3 text-body-sm select-none focus-visible:-outline-offset-2',
                    '[transition:background-color_var(--duration-quick)_var(--ease-hover),height_var(--duration-quick)_var(--ease-standard),opacity_var(--duration-quick)_var(--ease-standard)]',
                    'data-moved:starting:h-0 data-moved:starting:opacity-0',
                    fresh ? 'bg-success-soft' : isChecked ? 'bg-accent-soft' : !off && 'hover:bg-fill-1 active:bg-fill-3',
                    !off && checkboxMarkRow,
                    mergedRows,
                    item.disabled && '[&>*]:opacity-50',
                  )}
                >
                  {item.locked ? (
                    <span data-slot="transfer-list-lock" className="grid size-[18px] shrink-0 place-items-center text-fg-3">
                      <Lock aria-hidden className="size-3.5 stroke-[1.75]" />
                    </span>
                  ) : (
                    <CheckboxMark checked={isChecked} disabled={item.disabled || disabled} />
                  )}
                  {item.avatar ? <span className="flex size-7 shrink-0 items-center justify-center">{item.avatar}</span> : null}
                  <span className="min-w-0 flex-1 truncate text-fg-1">{item.label}</span>
                  {fresh && side === 1 ? (
                    <span className="max-w-1/2 shrink-0 truncate text-caption font-medium text-success-soft-fg">{movedText}</span>
                  ) : item.description ? (
                    <span className="max-w-1/2 shrink-0 truncate text-caption text-fg-3">{item.description}</span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const forward = marked(0).length;
  const back = marked(1).length;
  const badge = (n: number) => (n > 99 ? '99+' : n > 0 ? String(n) : null);

  return (
    <div data-slot="transfer-list" className={cn('@container', className)}>
      {/* Side by side from 768 of its own width; narrower, the lists stack and the arrows turn down and up. */}
      <div className="flex flex-col items-stretch gap-4 @min-[768px]:flex-row @min-[768px]:items-center @min-[768px]:gap-8">
        {panel(0)}
        <div data-slot="transfer-list-actions" className="flex shrink-0 items-center justify-center gap-2 @min-[768px]:flex-col">
          <button
            type="button"
            aria-label="Перенести отмеченные вправо"
            disabled={blocked[0] || forward === 0}
            onClick={() => move(0, marked(0).map((item) => item.id))}
            className={cn(moveButton, 'h-control-md', forward > 0 ? 'bg-accent text-accent-fg shadow-accent-control hover:bg-accent-hover active:bg-accent-pressed' : 'bg-fill-2 text-fg-1')}
          >
            <ArrowRight aria-hidden />
            {badge(forward)}
          </button>
          <button
            type="button"
            aria-label="Вернуть отмеченные влево"
            disabled={blocked[1] || back === 0}
            onClick={() => move(1, marked(1).map((item) => item.id))}
            className={cn(moveButton, 'h-control-md', back > 0 ? 'bg-accent text-accent-fg shadow-accent-control hover:bg-accent-hover active:bg-accent-pressed' : 'bg-fill-2 text-fg-1')}
          >
            <ArrowLeft aria-hidden />
            {badge(back)}
          </button>
          <span aria-hidden className="h-6 w-px shrink-0 bg-separator @min-[768px]:h-px @min-[768px]:w-6" />
          <button
            type="button"
            aria-label="Перенести все вправо"
            disabled={blocked[0] || !shown(0).some(movable)}
            onClick={() => move(0, shown(0).filter(movable).map((item) => item.id))}
            className={cn(moveButton, 'h-control-sm text-fg-2 hover:not-disabled:bg-fill-1 active:not-disabled:bg-fill-2 [&_svg]:stroke-[1.75]')}
          >
            <ChevronsRight aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Вернуть все влево"
            disabled={blocked[1] || !shown(1).some(movable)}
            onClick={() => move(1, shown(1).filter(movable).map((item) => item.id))}
            className={cn(moveButton, 'h-control-sm text-fg-2 hover:not-disabled:bg-fill-1 active:not-disabled:bg-fill-2 [&_svg]:stroke-[1.75]')}
          >
            <ChevronsLeft aria-hidden />
          </button>
        </div>
        {panel(1)}
      </div>
    </div>
  );
}
