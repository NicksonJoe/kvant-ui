import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import {
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import { IconButton } from './button';
import { CanvasNodeTile } from './canvas-node';
import { MenuItem, MenuSeparator, ContextMenuContent } from './menu';
import { matchesCanvasStep, type CanvasStepGroup, type CanvasStepTemplate } from './step-palette';

const panel =
  'flex flex-col overflow-hidden rounded-md bg-overlay text-fg-1 shadow-[0_0_0_1px_var(--color-border),0_12px_32px_color-mix(in_oklab,var(--color-fg-1)_12%,transparent)]';
const sectionLabel = 'px-2 pt-2.5 pb-1 text-overline font-medium tracking-overline text-fg-3 uppercase first:pt-1.5';

/** Wraps every case-insensitive occurrence of the query in <mark>. */
function highlight(text: string, query: string, markClass: string): ReactNode {
  const needle = query.trim().toLocaleLowerCase('ru');
  if (!needle) return text;
  const lower = text.toLocaleLowerCase('ru');
  const parts: ReactNode[] = [];
  let from = 0;
  for (let at = lower.indexOf(needle); at !== -1; at = lower.indexOf(needle, from)) {
    if (at > from) parts.push(text.slice(from, at));
    parts.push(
      <mark key={at} className={cn('bg-transparent', markClass)}>
        {text.slice(at, at + needle.length)}
      </mark>,
    );
    from = at + needle.length;
  }
  if (from < text.length) parts.push(text.slice(from));
  return parts;
}

/* ---------- Tab insert ---------- */

/** Next step Norda proposes, with the reason in one line. */
export interface CanvasStepSuggestion {
  template: CanvasStepTemplate;
  reason: string;
}

export interface CanvasInsertOptions {
  /** ⇧↵: insert and open the step in the inspector. */
  open: boolean;
}

export interface CanvasInsertMenuProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Steps of the palette; each row shows its group on the right. */
  groups: readonly CanvasStepGroup[];
  /** «Норда предлагает» on top: what usually comes next here. */
  suggestions?: readonly CanvasStepSuggestion[];
  /** Ready chains of steps: «Уведомить и ждать ответа · 3 шага». */
  templates?: readonly CanvasStepTemplate[];
  /** Where the step goes, in the field: «после «Создать сделку»». */
  context?: string;
  onInsert: (template: CanvasStepTemplate, options: CanvasInsertOptions) => void;
  /** Esc or focus leaving the menu: close without inserting. */
  onClose: () => void;
  /** Accessible name of the field; default «Вставить шаг». */
  label?: string;
}

interface Entry {
  key: string;
  template: CanvasStepTemplate;
  hint?: string;
  reason?: string;
}

/**
 * Tab insert at the focus point: after the selected step with an edge, on empty space under the pointer.
 * The field keeps focus; ↑↓ move the highlight, ↵ inserts, ⇧↵ inserts and opens, Esc closes.
 * Focus goes back to where it was before the menu opened once the host unmounts it.
 */
export function CanvasInsertMenu({
  groups,
  suggestions = [],
  templates = [],
  context,
  onInsert,
  onClose,
  label = 'Вставить шаг',
  className,
  ...props
}: CanvasInsertMenuProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId();
  // read during render: by the first effect autoFocus has already moved focus into the field
  const [returnFocus] = useState(() => (typeof document === 'undefined' ? null : document.activeElement));

  const sections: { key: string; title: string; entries: Entry[] }[] = [
    {
      key: 'suggested',
      title: 'Норда предлагает',
      entries: suggestions
        .filter((suggestion) => matchesCanvasStep(suggestion.template, query))
        .map((suggestion) => ({ key: `s-${suggestion.template.id}`, template: suggestion.template, reason: suggestion.reason })),
    },
    {
      key: 'steps',
      title: 'Шаги',
      entries: groups.flatMap((group) =>
        group.items.filter((item) => matchesCanvasStep(item, query)).map((item) => ({ key: `i-${item.id}`, template: item, hint: group.title })),
      ),
    },
    {
      key: 'templates',
      title: 'Шаблоны',
      entries: templates.filter((item) => matchesCanvasStep(item, query)).map((item) => ({ key: `t-${item.id}`, template: item })),
    },
  ].filter((section) => section.entries.length > 0);
  const flat = sections.flatMap((section) => section.entries);
  const current = Math.min(active, flat.length - 1);
  const optionId = (index: number) => `${id}-o${index}`;

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected=true]')?.scrollIntoView({ block: 'nearest' });
  }, [current]);

  // a layout cleanup runs before the menu leaves the DOM, while it still knows whether it held the focus
  useLayoutEffect(() => {
    const root = rootRef.current;
    return () => {
      const active = document.activeElement;
      const held = active === null || active === document.body || root?.contains(active) === true;
      if (!held || !(returnFocus instanceof HTMLElement)) return;
      // StrictMode runs this cleanup with the menu still mounted: give the focus back only once the menu is gone
      queueMicrotask(() => {
        if (root?.isConnected || !returnFocus.isConnected) return;
        const now = document.activeElement;
        if (now === null || now === document.body) returnFocus.focus();
      });
    };
  }, [returnFocus]);

  const insert = (index: number, open: boolean) => {
    const entry = flat[index];
    if (entry) onInsert(entry.template, { open });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive(Math.min(flat.length - 1, Math.max(0, current + step)));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      insert(current, event.shiftKey);
    }
  };

  const onRootKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  const onRootBlur = (event: FocusEvent<HTMLDivElement>) => {
    // switching windows blurs too: the menu waits for the user to come back
    if (event.currentTarget.contains(event.relatedTarget) || (event.relatedTarget === null && !document.hasFocus())) return;
    onClose();
  };

  let index = -1;
  return (
    <div
      ref={rootRef}
      data-slot="canvas-insert-menu"
      className={cn(panel, 'w-100', className)}
      onKeyDown={onRootKeyDown}
      onBlur={onRootBlur}
      // a press on the panel itself must not pull the focus out of the field
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget.querySelector('input')) event.preventDefault();
      }}
      {...props}
    >
      <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-separator px-3.5">
        <Search aria-hidden className="size-4 shrink-0 stroke-[1.75] text-fg-2" />
        <input
          // the menu opens on Tab exactly to type into it
          autoFocus
          role="combobox"
          aria-label={label}
          aria-expanded
          aria-autocomplete="list"
          aria-controls={`${id}-list`}
          aria-activedescendant={flat.length > 0 ? optionId(current) : undefined}
          placeholder="Найти шаг"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-body-sm text-fg-1 caret-accent outline-none placeholder:text-fg-3"
        />
        {context ? <span className="h-5 shrink-0 truncate rounded-[5px] bg-fill-2 px-1.5 text-overline/5 font-medium text-fg-3">{context}</span> : null}
      </div>
      <div ref={listRef} id={`${id}-list`} role="listbox" aria-label={label} className="flex max-h-90 flex-col overflow-y-auto p-1.5">
        {flat.length === 0 ? <p className="px-2 py-3 text-body-xs text-fg-3">Ничего не нашлось</p> : null}
        {sections.map((section) => (
          <div key={section.key} role="group" aria-labelledby={`${id}-${section.key}`}>
            <div id={`${id}-${section.key}`} className={sectionLabel}>
              {section.title}
            </div>
            {section.entries.map((entry) => {
              index += 1;
              const own = index;
              const selected = own === current;
              const suggested = entry.reason !== undefined;
              return (
                <div
                  key={entry.key}
                  id={optionId(own)}
                  role="option"
                  aria-selected={selected}
                  onMouseMove={() => setActive(own)}
                  // keep focus in the field
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => insert(own, event.shiftKey)}
                  className={cn(
                    'flex shrink-0 cursor-pointer items-center gap-2.5 px-2',
                    suggested ? 'h-control-lg rounded-[10px]' : 'h-control-md rounded-sm',
                    selected && 'bg-fill-2',
                  )}
                >
                  <CanvasNodeTile kind={entry.template.kind} icon={entry.template.icon} logo={entry.template.logo} size={suggested ? 28 : 24} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className={cn('truncate text-body-xs text-fg-1', suggested && 'font-medium')}>
                      {highlight(entry.template.title, query, 'font-bold text-fg-1')}
                    </span>
                    {entry.reason ? <span className="truncate text-caption text-fg-3">{entry.reason}</span> : null}
                  </div>
                  {entry.hint ? <span className="shrink-0 text-caption text-fg-3">{entry.hint}</span> : null}
                  {suggested && selected ? (
                    <span aria-hidden className="shrink-0 font-mono text-overline text-fg-3">
                      ↵
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div aria-hidden className="flex h-control-md shrink-0 items-center gap-3.5 border-t border-separator px-3.5 text-overline text-fg-3">
        <span>↑↓ выбор</span>
        <span>↵ вставить</span>
        <span>⇧↵ вставить и открыть</span>
        <span>Esc</span>
      </div>
    </div>
  );
}

/* ---------- Context menus ---------- */

interface MenuAction {
  key: string;
  label: string;
  shortcut: string;
  onClick?: () => void;
}

function MenuActions({ groups }: { groups: readonly (readonly MenuAction[])[] }) {
  const shown = groups.map((group) => group.filter((action) => action.onClick)).filter((group) => group.length > 0);
  return shown.map((group, at) => (
    <div key={group[0]?.key} className="contents">
      {at > 0 ? <MenuSeparator /> : null}
      {group.map((action) => (
        <MenuItem key={action.key} shortcut={action.shortcut} onClick={action.onClick}>
          {action.label}
        </MenuItem>
      ))}
    </div>
  ));
}

export interface CanvasPaneMenuContentProps {
  onInsertStep?: () => void;
  onAddNote?: () => void;
  onPaste?: () => void;
  onSelectAll?: () => void;
  onLayout?: () => void;
  onFit?: () => void;
}

/** Right click on empty canvas, inside `<ContextMenu>`; an action without a handler is not shown. */
export function CanvasPaneMenuContent({ onInsertStep, onAddNote, onPaste, onSelectAll, onLayout, onFit }: CanvasPaneMenuContentProps) {
  return (
    <ContextMenuContent>
      <MenuActions
        groups={[
          [
            { key: 'insert', label: 'Вставить шаг', shortcut: 'Tab', onClick: onInsertStep },
            { key: 'note', label: 'Стикер', shortcut: 'S', onClick: onAddNote },
            { key: 'paste', label: 'Вставить', shortcut: '⌘V', onClick: onPaste },
          ],
          [
            { key: 'select-all', label: 'Выделить всё', shortcut: '⌘A', onClick: onSelectAll },
            { key: 'layout', label: 'Разложить граф', shortcut: '⇧L', onClick: onLayout },
            { key: 'fit', label: 'Вписать', shortcut: '⇧1', onClick: onFit },
          ],
        ]}
      />
    </ContextMenuContent>
  );
}

export interface CanvasNodeMenuContentProps {
  /** The step is off: the item reads «Включить». */
  disabled?: boolean;
  /** Data is pinned: the item reads «Открепить данные». */
  pinned?: boolean;
  onRunFrom?: () => void;
  onTogglePinned?: () => void;
  onDuplicate?: () => void;
  onGroup?: () => void;
  onToggleDisabled?: () => void;
  /** «Удалить…»: open the confirmation, then the 7 s undo bar. */
  onDelete?: () => void;
}

/** Right click on a step, inside `<ContextMenu>`; «Удалить…» stays last after a separator. */
export function CanvasNodeMenuContent({
  disabled = false,
  pinned = false,
  onRunFrom,
  onTogglePinned,
  onDuplicate,
  onGroup,
  onToggleDisabled,
  onDelete,
}: CanvasNodeMenuContentProps) {
  return (
    <ContextMenuContent>
      <MenuActions
        groups={[
          [
            { key: 'run', label: 'Запустить отсюда', shortcut: '⇧↵', onClick: onRunFrom },
            { key: 'pin', label: pinned ? 'Открепить данные' : 'Закрепить данные', shortcut: 'P', onClick: onTogglePinned },
            { key: 'duplicate', label: 'Дублировать', shortcut: '⌘D', onClick: onDuplicate },
            { key: 'group', label: 'Сгруппировать', shortcut: '⌘G', onClick: onGroup },
            { key: 'disable', label: disabled ? 'Включить' : 'Отключить', shortcut: 'D', onClick: onToggleDisabled },
          ],
        ]}
      />
      {onDelete ? (
        <>
          <MenuSeparator />
          <MenuItem destructive shortcut="⌫" onClick={onDelete}>
            Удалить…
          </MenuItem>
        </>
      ) : null}
    </ContextMenuContent>
  );
}

/* ---------- ⌘F search ---------- */

export type CanvasSearchResultKind = 'step' | 'setting' | 'note';

export interface CanvasSearchResult {
  /** Usually the node id: the canvas moves the camera there. */
  id: string;
  kind: CanvasSearchResultKind;
  title: string;
  /** Where it matched: «Шаг · Действия», «Настройка «Ответственный»: менеджер по очереди». */
  detail?: string;
}

type SearchFilter = 'all' | CanvasSearchResultKind;

const FILTERS: readonly { value: SearchFilter; label: string }[] = [
  { value: 'all', label: 'Всё' },
  { value: 'step', label: 'Шаги' },
  { value: 'setting', label: 'Настройки' },
  { value: 'note', label: 'Стикеры' },
];

export interface CanvasGraphSearchProps extends Omit<ComponentProps<'div'>, 'children' | 'results'> {
  query: string;
  onQueryChange: (query: string) => void;
  /** Matches for the query, found by the host over names, settings and data of the steps. */
  results: readonly CanvasSearchResult[];
  /** Move the camera to the match and light it up; called for the first match and on every step. */
  onNavigate: (result: CanvasSearchResult) => void;
  /** Esc in the field. */
  onClose: () => void;
}

/** ⌘F panel floating top centre: field, «2 из 5» with ↑↓, kind chips, list of matches. ↵ next, ⇧↵ previous. */
export function CanvasGraphSearch({ query, onQueryChange, results, onNavigate, onClose, className, ...props }: CanvasGraphSearchProps) {
  const [filter, setFilter] = useState<SearchFilter>('all');
  const id = useId();
  const chipsRef = useRef<HTMLDivElement>(null);
  const shown = filter === 'all' ? results : results.filter((result) => result.kind === filter);
  const shownKey = shown.map((result) => result.id).join('\n');
  // the position belongs to one set of matches: a new set starts from its first one
  const [position, setPosition] = useState({ key: shownKey, index: 0 });
  const current = position.key === shownKey ? Math.min(position.index, shown.length - 1) : 0;

  const followFirst = useEffectEvent(() => {
    const first = shown[0];
    if (first) onNavigate(first);
  });
  useEffect(() => followFirst(), [shownKey]);

  const go = (index: number) => {
    const result = shown[index];
    if (!result) return;
    setPosition({ key: shownKey, index });
    onNavigate(result);
  };
  const step = (by: 1 | -1) => go((current + by + shown.length) % shown.length);

  const counts: Record<SearchFilter, number> = {
    all: results.length,
    step: results.filter((result) => result.kind === 'step').length,
    setting: results.filter((result) => result.kind === 'setting').length,
    note: results.filter((result) => result.kind === 'note').length,
  };
  const chips = FILTERS.filter((chip) => chip.value === 'all' || counts[chip.value] > 0);

  return (
    <div data-slot="canvas-graph-search" className={cn(panel, 'w-96', className)} {...props}>
      <div className="flex h-control-lg shrink-0 items-center gap-2 border-b border-separator pr-1.5 pl-3">
        <Search aria-hidden className="size-4 shrink-0 stroke-[1.75] text-fg-2" />
        <input
          autoFocus
          type="search"
          aria-label="Найти на графе"
          aria-controls={`${id}-list`}
          placeholder="Найти на графе"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (shown.length > 0) step(event.shiftKey ? -1 : 1);
            } else if (event.key === 'Escape') {
              event.preventDefault();
              onClose();
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-body-sm text-fg-1 caret-accent outline-none placeholder:text-fg-3 [&::-webkit-search-cancel-button]:appearance-none"
        />
        <span role="status" className="shrink-0 text-caption text-fg-3 tabular-nums">
          {query ? (shown.length > 0 ? `${current + 1} из ${shown.length}` : 'Нет совпадений') : ''}
        </span>
        <IconButton aria-label="Предыдущая находка" size="sm" icon={<ChevronUp />} disabled={shown.length === 0} onClick={() => step(-1)} />
        <IconButton aria-label="Следующая находка" size="sm" icon={<ChevronDown />} disabled={shown.length === 0} onClick={() => step(1)} />
      </div>
      {results.length > 0 ? (
        <>
          <div
            ref={chipsRef}
            role="radiogroup"
            aria-label="Где искать"
            className="flex flex-wrap gap-1.5 px-3 pt-2.5 pb-1.5"
            onKeyDown={(event) => {
              if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
              event.preventDefault();
              const at = chips.findIndex((chip) => chip.value === filter);
              const next = chips[(at + (event.key === 'ArrowRight' ? 1 : -1) + chips.length) % chips.length];
              if (!next) return;
              setFilter(next.value);
              chipsRef.current?.querySelector<HTMLElement>(`[data-value=${next.value}]`)?.focus();
            }}
          >
            {chips.map((chip) => {
              const checked = chip.value === filter;
              return (
                <button
                  key={chip.value}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  data-value={chip.value}
                  tabIndex={checked ? 0 : -1}
                  onClick={() => setFilter(chip.value)}
                  className={cn(
                    'h-6 cursor-pointer rounded-full px-2 text-caption font-medium transition-colors duration-(--duration-micro) ease-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    checked ? 'bg-fg-1 text-surface-1' : 'bg-fill-2 text-fg-1 hover:bg-fill-3',
                  )}
                >
                  {chip.label} {counts[chip.value]}
                </button>
              );
            })}
          </div>
          <div id={`${id}-list`} role="listbox" aria-label="Находки" className="flex max-h-72 flex-col overflow-y-auto px-1.5 pt-1 pb-1.5">
            {shown.map((result, index) => (
              <div
                key={result.id}
                role="option"
                aria-selected={index === current}
                onClick={() => go(index)}
                className={cn('flex cursor-pointer flex-col gap-0.5 rounded-sm p-2 hover:bg-fill-1', index === current && 'bg-fill-2 hover:bg-fill-2')}
              >
                <span className="truncate text-body-xs font-medium text-fg-1">{highlight(result.title, query, 'font-bold text-warning-soft-fg')}</span>
                {result.detail ? <span className="truncate text-caption text-fg-3">{highlight(result.detail, query, 'font-medium text-fg-1')}</span> : null}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ---------- History ---------- */

export interface CanvasHistoryEntry {
  id: string;
  /** What changed: «Разложил граф · 6 шагов». */
  title: string;
  /** Who: «Анна», «Вы», «Норда». */
  author: string;
  /** When: «12 мин назад». */
  time: string;
}

export interface CanvasHistoryPanelProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Newest first. */
  entries: readonly CanvasHistoryEntry[];
  /** Point the graph is at now. */
  currentId?: string;
  /** Right side of the header: «сегодня». */
  period?: string;
  /** «Вернуть сюда»: roll the graph back to this point; the rollback itself becomes a new entry. */
  onRestore: (entry: CanvasHistoryEntry) => void;
  /** Default «История». */
  title?: string;
}

/** Change history of the graph: who, what, when; any point can be restored. ⌘Z / ⇧⌘Z undo only your own steps. */
export function CanvasHistoryPanel({ entries, currentId, period, onRestore, title = 'История', className, ...props }: CanvasHistoryPanelProps) {
  return (
    <div data-slot="canvas-history" className={cn(panel, 'w-96', className)} {...props}>
      <div className="flex h-control-lg shrink-0 items-center justify-between border-b border-separator px-3.5">
        <span className="text-body-sm font-semibold text-fg-1">{title}</span>
        {period ? <span className="text-caption text-fg-3">{period}</span> : null}
      </div>
      <ol aria-label={title} className="flex max-h-96 flex-col overflow-y-auto p-1.5">
        {entries.map((entry) => {
          const isCurrent = entry.id === currentId;
          return (
            <li
              key={entry.id}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'group flex h-control-lg shrink-0 items-center gap-2.5 rounded-sm px-2',
                isCurrent ? 'bg-accent-soft' : 'hover:bg-fill-2 focus-within:bg-fill-2',
              )}
            >
              <span aria-hidden className={cn('size-2 shrink-0 rounded-full', isCurrent ? 'bg-accent' : 'bg-fg-4')} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className={cn('truncate text-body-xs text-fg-1', isCurrent && 'font-medium')}>{entry.title}</span>
                <span className="truncate text-caption text-fg-3">
                  {entry.author} · {entry.time}
                </span>
              </div>
              {isCurrent ? null : (
                <button
                  type="button"
                  aria-label={`Вернуть сюда: ${entry.title}`}
                  onClick={() => onRestore(entry)}
                  className="h-6 shrink-0 cursor-pointer rounded-xs bg-surface-1 px-2 text-caption font-medium text-fg-1 opacity-0 shadow-[0_0_0_1px_var(--color-border)] transition-opacity duration-(--duration-micro) group-hover:opacity-100 hover:bg-fill-1 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring pointer-coarse:opacity-100"
                >
                  Вернуть сюда
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
