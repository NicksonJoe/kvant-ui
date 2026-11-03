import { Popover as BasePopover } from '@base-ui/react/popover';
import { Check, ChevronDown, ChevronRight, CircleAlert, Search, X } from 'lucide-react';
import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { mergedRows, positioner } from '../lib/recipes';
import { CheckboxMark, checkboxMarkRow } from './checkbox';
import { fieldShell, fieldSizes } from './input';
import { Popover, PopoverTrigger } from './popover';
import { Spinner } from './spinner';

export interface TreeSelectNode {
  id: string;
  label: string;
  children?: readonly TreeSelectNode[];
  /** Children exist but are not loaded yet: expanding calls `onLoadChildren`. */
  hasChildren?: boolean;
  /** Children are being fetched: a spinner in the chevron slot, «загружаем…» on the right. */
  loading?: boolean;
  /** Children failed to load: a row under the node with the reason and «Повторить». */
  error?: string;
  /** Cannot be picked (no rights); its branch still expands, its descendants are off too. */
  disabled?: boolean;
}

interface Entry {
  node: TreeSelectNode;
  level: number;
  parent: string | null;
  /** Leaves under the node (the node itself when it has none) that can be picked. */
  leaves: readonly string[];
  off: boolean;
}

/** Flat index of the whole tree in display order. */
function indexTree(nodes: readonly TreeSelectNode[], level = 1, parent: string | null = null, parentOff = false, into = new Map<string, Entry>()) {
  for (const node of nodes) {
    const off = parentOff || Boolean(node.disabled);
    const entry: Entry = { node, level, parent, leaves: [], off };
    into.set(node.id, entry);
    if (node.children?.length) {
      indexTree(node.children, level + 1, node.id, off, into);
      entry.leaves = node.children.flatMap((child) => into.get(child.id)?.leaves ?? []);
    } else if (!off) entry.leaves = [node.id];
  }
  return into;
}

const isBranch = (node: TreeSelectNode) => Boolean(node.children?.length) || Boolean(node.hasChildren);
const lower = (text: string) => text.toLocaleLowerCase('ru');
const TYPEAHEAD_MS = 500;

/** The matched part in bold: «<mark>Сер</mark>гиев Посад». */
function highlight(label: string, query: string): ReactNode {
  const at = query ? lower(label).indexOf(lower(query)) : -1;
  if (at < 0) return label;
  return (
    <>
      {label.slice(0, at)}
      <mark className="bg-transparent font-semibold text-inherit">{label.slice(at, at + query.length)}</mark>
      {label.slice(at + query.length)}
    </>
  );
}

interface TreeSelectBase {
  nodes: readonly TreeSelectNode[];
  placeholder?: string;
  /** Search field at the top of the list: matches stay with their ancestors (fg-3) expanded. */
  searchable?: boolean;
  /** Branches open on first show, before anything is picked. */
  defaultExpanded?: readonly string[];
  /** A branch with `hasChildren` and no `children` was expanded, or «Повторить» was pressed. */
  onLoadChildren?: (node: TreeSelectNode) => void;
  disabled?: boolean;
  /** Standalone invalid state; inside <Field error> it is set for you. */
  invalid?: boolean;
  'aria-label': string;
  /** Field class (set the width here). */
  className?: string;
}

export type TreeSelectProps = TreeSelectBase &
  (
    | { multiple?: false; value?: string | null; defaultValue?: string | null; onValueChange?: (id: string | null) => void }
    | {
        multiple: true;
        /** Picked leaves; a branch counts as picked when all its leaves are. */
        value?: readonly string[];
        defaultValue?: readonly string[];
        onValueChange?: (ids: string[]) => void;
        /** Footer text; default «Выбрано: N». */
        summary?: (leaves: readonly TreeSelectNode[]) => ReactNode;
      }
  );

/** Width of «+N» with its gap, kept free while chips overflow. */
const MORE_WIDTH = 40;

/**
 * Select-looking trigger over a tree. Single: any node is picked, the field shows its path. Multiple: checkboxes,
 * a parent checks all its children, the field shows the topmost fully picked nodes as chips and «+N».
 * Keys: ↑↓ rows, → expand / first child, ← collapse / parent, Space marks, Enter picks and closes (single), * opens siblings.
 */
export function TreeSelect(props: TreeSelectProps) {
  const { nodes, placeholder = 'Выберите', searchable = false, defaultExpanded = [], onLoadChildren, disabled = false, invalid, className } = props;
  const label = props['aria-label'];
  const multiple = props.multiple === true;
  const toList = (value: string | null | readonly string[] | undefined): readonly string[] =>
    value === null || value === undefined ? [] : typeof value === 'string' ? [value] : value;
  const [own, setOwn] = useState(() => toList(props.defaultValue));
  const selected = props.value === undefined ? own : toList(props.value);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<readonly string[]>(defaultExpanded);
  // Branches opened while the list is shown: only their rows grow in.
  const [growing, setGrowing] = useState<readonly string[]>([]);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const searchRef = useRef<HTMLInputElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const valueId = useId();

  const index = indexTree(nodes);
  const picked = new Set(selected);
  const ancestors = (id: string): string[] => {
    const parent = index.get(id)?.parent;
    return parent ? [...ancestors(parent), parent] : [];
  };

  const setValue = (next: readonly string[]) => {
    setOwn(next);
    if (props.multiple === true) props.onValueChange?.([...next]);
    else props.onValueChange?.(next[0] ?? null);
  };

  const checkState = (entry: Entry): boolean | 'mixed' => {
    const count = entry.leaves.filter((leaf) => picked.has(leaf)).length;
    return count === 0 ? false : count === entry.leaves.length ? true : 'mixed';
  };

  const toggleCheck = (entry: Entry) => {
    if (entry.off || entry.leaves.length === 0) return;
    const all = checkState(entry) === true;
    setValue(all ? selected.filter((id) => !entry.leaves.includes(id)) : [...selected, ...entry.leaves.filter((leaf) => !picked.has(leaf))]);
  };

  const choose = (entry: Entry) => {
    if (entry.off) return;
    if (multiple) return toggleCheck(entry);
    setValue([entry.node.id]);
    setOpen(false);
  };

  const expand = (ids: readonly string[], next: boolean) => {
    const set = new Set(expanded);
    for (const id of ids) {
      const node = index.get(id)?.node;
      if (!node || !isBranch(node)) continue;
      if (next && !set.has(id) && !node.children?.length && !node.loading) onLoadChildren?.(node);
      if (next) set.add(id);
      else set.delete(id);
    }
    setExpanded([...set]);
    if (next) setGrowing([...growing, ...ids]);
  };

  // Search: matches and their ancestors, the ancestors forced open.
  const q = query.trim();
  const matches = q ? [...index.values()].filter((entry) => lower(entry.node.label).includes(lower(q))) : [];
  const shownBySearch = new Set(matches.flatMap((entry) => [...ancestors(entry.node.id), entry.node.id]));
  const isOpen = (id: string) => (q ? shownBySearch.has(id) && matches.some((entry) => ancestors(entry.node.id).includes(id)) : expanded.includes(id));

  type Row = { entry: Entry; kind: 'node' | 'error' };
  const visible: Row[] = [];
  const walk = (list: readonly TreeSelectNode[]) => {
    for (const node of list) {
      const entry = index.get(node.id);
      if (!entry || (q && !shownBySearch.has(node.id))) continue;
      visible.push({ entry, kind: 'node' });
      if (!isOpen(node.id)) continue;
      if (node.error) visible.push({ entry, kind: 'error' });
      else if (node.children) walk(node.children);
    }
  };
  walk(nodes);
  const items = visible.filter((item) => item.kind === 'node').map((item) => item.entry);
  const tabStop = items.find((entry) => entry.node.id === focused) ?? items.find((entry) => picked.has(entry.node.id)) ?? items[0];

  const focusRow = (id: string | null | undefined) => {
    if (!id) return;
    setFocused(id);
    rows.current.get(id)?.focus();
  };

  /** Right side of a row: «загружаем…», leaves under a closed branch, or «N из M» / «все» when checking. */
  const countOf = (entry: Entry, opened: boolean): ReactNode => {
    const { node } = entry;
    if (node.loading) return 'загружаем…';
    if (!multiple) return isBranch(node) && !opened && node.children?.length ? entry.leaves.length : null;
    const state = checkState(entry);
    if (!isBranch(node) || state === false) return null;
    return state === true ? 'все' : `${entry.leaves.filter((leaf) => picked.has(leaf)).length} из ${entry.leaves.length}`;
  };

  const onOpenChange = (next: boolean, details: BasePopover.Root.ChangeEventDetails) => {
    // Esc first clears the search, then closes.
    if (!next && details.reason === 'escape-key' && query) {
      setQuery('');
      return;
    }
    if (next) {
      const first = selected[0];
      if (!multiple && first) setExpanded([...new Set([...expanded, ...ancestors(first)])]);
      setFocused(multiple ? null : (first ?? null));
      setGrowing([]);
    } else setQuery('');
    setOpen(next);
  };

  const onRowKeyDown = (event: KeyboardEvent<HTMLLIElement>, entry: Entry, position: number) => {
    const { node } = entry;
    const branch = isBranch(node);
    const opened = isOpen(node.id);
    const actions: Record<string, () => void> = {
      ArrowDown: () => focusRow(items[position + 1]?.node.id),
      ArrowUp: () => (position === 0 && searchable ? searchRef.current?.focus() : focusRow(items[position - 1]?.node.id)),
      Home: () => focusRow(items[0]?.node.id),
      End: () => focusRow(items.at(-1)?.node.id),
      ArrowRight: () => {
        if (branch && !opened) expand([node.id], true);
        else if (branch) focusRow(node.children?.[0]?.id);
      },
      ArrowLeft: () => {
        if (branch && opened && !q) expand([node.id], false);
        else focusRow(entry.parent);
      },
      Enter: () => choose(entry),
      ' ': () => choose(entry),
      '*': () => {
        const siblings = entry.parent ? (index.get(entry.parent)?.node.children ?? []) : nodes;
        expand(
          siblings.filter(isBranch).map((sibling) => sibling.id),
          true,
        );
      },
    };
    const action = actions[event.key];
    if (action) {
      event.preventDefault();
      action();
      return;
    }
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      const now = event.timeStamp;
      typed.current = { text: (now - typed.current.at < TYPEAHEAD_MS ? typed.current.text : '') + lower(event.key), at: now };
      const order = [...items.slice(position + 1), ...items.slice(0, position + 1)];
      focusRow(order.find((item) => lower(item.node.label).startsWith(typed.current.text))?.node.id);
    }
  };

  // Field content: the path (single) or chips of the topmost fully picked nodes (multiple).
  const single = !multiple && selected[0] ? index.get(selected[0]) : undefined;
  const chips: Entry[] = [];
  const collect = (list: readonly TreeSelectNode[]) => {
    for (const node of list) {
      const entry = index.get(node.id);
      if (!entry || entry.leaves.length === 0) continue;
      const state = checkState(entry);
      if (state === true) chips.push(entry);
      else if (state === 'mixed' && node.children) collect(node.children);
    }
  };
  if (multiple) collect(nodes);

  const chipsRef = useRef<HTMLSpanElement>(null);
  // How many chips fit on the line and where «+N» goes after the last of them.
  const [fit, setFit] = useState({ count: Number.POSITIVE_INFINITY, left: 0 });
  const chipKey = chips.map((entry) => entry.node.id).join();
  useLayoutEffect(() => {
    const box = chipsRef.current;
    if (!box) return;
    const measure = () => {
      const width = box.clientWidth;
      // No layout (jsdom, hidden tab): show them all.
      if (width === 0) return setFit({ count: Number.POSITIVE_INFINITY, left: 0 });
      const all = [...box.querySelectorAll<HTMLElement>('[data-slot=tree-select-chip]')];
      let count = 0;
      let left = 0;
      for (const [i, chip] of all.entries()) {
        const room = i === all.length - 1 ? width : width - MORE_WIDTH;
        if (chip.offsetLeft + chip.offsetWidth > room) break;
        count = i + 1;
        left = chip.offsetLeft + chip.offsetWidth + 4;
      }
      setFit({ count, left });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [chipKey]);
  const hidden = Math.max(0, chips.length - fit.count);
  const lastShown = chips.length - hidden - 1;

  const leaves = selected.flatMap((id) => {
    const node = index.get(id)?.node;
    return node ? [node] : [];
  });
  const total = index.size;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <div
        data-slot="tree-select"
        className={cn(
          fieldShell,
          fieldSizes.md,
          'cursor-default',
          chips.length > 0 && 'gap-1 pl-[5px]',
          'has-[[data-popup-open]]:border-ring has-[[data-popup-open]]:shadow-[0_0_0_1px_var(--color-ring)] has-[button:disabled]:bg-surface-2 has-[button:disabled]:opacity-50 has-[button:disabled]:hover:border-input',
          className,
        )}
      >
        <PopoverTrigger
          disabled={disabled}
          aria-label={label}
          aria-describedby={valueId}
          aria-invalid={invalid || undefined}
          className="absolute inset-0 rounded-[inherit] outline-none focus-visible:outline-none"
        />
        <span id={valueId} data-slot="tree-select-value" className="pointer-events-none relative flex min-w-0 flex-1 items-center">
          {multiple && chips.length > 0 ? (
            <span ref={chipsRef} className="relative flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
              {chips.map((entry, i) => (
                <span
                  key={entry.node.id}
                  data-slot="tree-select-chip"
                  className={cn(
                    'flex h-6 shrink-0 items-center gap-0.5 rounded-full bg-fill-2 pl-2.5 text-caption font-medium whitespace-nowrap text-fg-1',
                    disabled ? 'pr-2.5' : 'pr-1',
                    i > lastShown && 'invisible',
                  )}
                >
                  {entry.node.label}
                  {disabled ? null : (
                    <button
                      type="button"
                      aria-label={`Убрать: ${entry.node.label}`}
                      onClick={() => setValue(selected.filter((id) => !entry.leaves.includes(id)))}
                      className="pointer-events-auto grid size-4 place-items-center rounded-full text-fg-3 hover:bg-fill-3 hover:text-fg-1 [&_svg]:size-3 [&_svg]:stroke-2"
                    >
                      <X aria-hidden />
                    </button>
                  )}
                </span>
              ))}
              {hidden > 0 ? (
                <span
                  data-slot="tree-select-more"
                  className="absolute flex h-6 items-center rounded-full bg-fill-1 px-2 text-caption font-medium text-fg-2 tabular-nums"
                  style={{ left: fit.left }}
                >
                  +{hidden}
                </span>
              ) : null}
            </span>
          ) : single ? (
            <span className="truncate">
              {single.parent ? <span className="text-fg-3">{ancestors(single.node.id).map((id) => `${index.get(id)?.node.label ?? ''} / `).join('')}</span> : null}
              {single.node.label}
            </span>
          ) : (
            <span className="truncate text-fg-3">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          aria-hidden
          className="pointer-events-none relative text-fg-2! transition-transform duration-(--duration-quick) ease-out group-has-[[data-popup-open]]/field:rotate-180"
        />
      </div>
      <BasePopover.Portal>
        <BasePopover.Positioner side="bottom" align="start" sideOffset={4} className={positioner}>
          <BasePopover.Popup
            data-slot="tree-select-popup"
            initialFocus={() => (searchable ? searchRef.current : (tabStop && rows.current.get(tabStop.node.id)) || true)}
            className="kv-popup flex w-(--anchor-width) max-w-(--available-width) min-w-60 flex-col rounded-lg bg-overlay p-1 text-fg-1 shadow-overlay outline-none"
          >
            {searchable ? (
              <div className="mb-1 flex h-8 shrink-0 items-center gap-2 rounded-md bg-fill-1 px-2.5 text-body-sm">
                <Search aria-hidden className="size-3.5 shrink-0 stroke-2 text-fg-3" />
                <input
                  ref={searchRef}
                  type="search"
                  aria-label="Поиск"
                  value={query}
                  onChange={(event) => setQuery(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'ArrowDown') return;
                    event.preventDefault();
                    focusRow(items[0]?.node.id);
                  }}
                  placeholder="Поиск"
                  className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-3 [&::-webkit-search-cancel-button]:hidden"
                />
                {q ? (
                  <span className="shrink-0 text-caption text-fg-3 tabular-nums">
                    {matches.length} из {total}
                  </span>
                ) : null}
              </div>
            ) : null}
            <ul role="tree" aria-label={label} aria-multiselectable={multiple || undefined} className="flex max-h-80 flex-col overflow-y-auto overscroll-contain">
              {q && matches.length === 0 ? <li role="none" className="flex h-8 items-center px-2.5 text-body-sm text-fg-3">Ничего не найдено</li> : null}
              {visible.map(({ entry, kind }) => {
                const { node, level } = entry;
                const padding = { paddingLeft: 6 + (level - 1 + (kind === 'error' ? 1 : 0)) * 20 };
                if (kind === 'error') {
                  return (
                    <li key={`${node.id}-error`} role="none" data-slot="tree-select-error" style={padding} className="flex h-8 shrink-0 items-center gap-1.5 pr-1">
                      <span className="grid size-5 shrink-0 place-items-center text-danger-soft-fg">
                        <CircleAlert aria-hidden className="size-3.5 stroke-2" />
                      </span>
                      <span role="alert" className="min-w-0 flex-1 truncate text-body-xs text-danger-soft-fg">
                        {node.error}
                      </span>
                      <button
                        type="button"
                        onClick={() => onLoadChildren?.(node)}
                        className="kv-pressable h-6 shrink-0 rounded-full bg-fill-2 px-2.5 text-caption font-medium text-fg-1 hover:bg-fill-3"
                      >
                        Повторить
                      </button>
                    </li>
                  );
                }
                const position = items.indexOf(entry);
                const branch = isBranch(node);
                const opened = isOpen(node.id);
                const ancestor = Boolean(q) && !matches.includes(entry);
                const state = multiple ? checkState(entry) : false;
                const isPicked = !multiple && picked.has(node.id);
                const grows = entry.parent !== null && growing.includes(entry.parent);
                const meta = ancestor && !node.loading ? null : countOf(entry, opened);
                return (
                  <li
                    key={node.id}
                    ref={(element) => {
                      if (element) rows.current.set(node.id, element);
                      else rows.current.delete(node.id);
                    }}
                    role="treeitem"
                    aria-label={node.label}
                    aria-level={level}
                    aria-expanded={branch ? opened : undefined}
                    aria-selected={multiple ? undefined : isPicked}
                    aria-checked={multiple ? state : undefined}
                    aria-disabled={entry.off || undefined}
                    aria-busy={node.loading || undefined}
                    data-ancestor={ancestor ? '' : undefined}
                    data-grow={grows || undefined}
                    tabIndex={entry === tabStop ? 0 : -1}
                    onFocus={() => setFocused(node.id)}
                    onKeyDown={(event) => onRowKeyDown(event, entry, position)}
                    onClick={() => choose(entry)}
                    style={padding}
                    className={cn(
                      'group/row relative flex h-8 shrink-0 cursor-default items-center overflow-hidden rounded-md pr-2.5 text-body-sm select-none focus-visible:-outline-offset-2',
                      '[transition:background-color_var(--duration-micro)_var(--ease-hover),height_var(--duration-quick)_var(--ease-standard),opacity_var(--duration-quick)_var(--ease-standard)]',
                      'data-grow:starting:h-0 data-grow:starting:opacity-0',
                      multiple ? 'gap-2' : 'gap-1.5',
                      entry.off && '[&>:not([data-slot=tree-select-toggle])]:opacity-50',
                      isPicked ? 'bg-accent-soft font-medium text-accent-soft-fg' : cn('text-fg-1', !entry.off && 'hover:bg-fill-2 active:bg-fill-3'),
                      mergedRows,
                      multiple && !entry.off && checkboxMarkRow,
                    )}
                  >
                    <span
                      data-slot="tree-select-toggle"
                      data-testid="tree-select-toggle"
                      onClick={(event) => {
                        if (!branch) return;
                        event.stopPropagation();
                        if (!q) expand([node.id], !opened);
                      }}
                      className={cn('grid size-5 shrink-0 place-items-center', ancestor ? 'text-fg-4' : 'text-fg-3 group-hover/row:text-fg-2', isPicked && 'text-accent-soft-fg!')}
                    >
                      {node.loading ? (
                        <Spinner size={16} className="size-3.5" />
                      ) : branch ? (
                        <ChevronRight aria-hidden className={cn('size-3.5 stroke-2 transition-[rotate] duration-(--duration-fast) ease-out', opened && 'rotate-90')} />
                      ) : null}
                    </span>
                    {multiple ? <CheckboxMark checked={state} disabled={entry.off} /> : null}
                    <span className={cn('min-w-0 flex-1 truncate', ancestor && 'text-fg-3')}>{ancestor ? node.label : highlight(node.label, q)}</span>
                    {meta !== null ? <span className="shrink-0 text-caption text-fg-3 tabular-nums">{meta}</span> : null}
                    {isPicked ? <Check aria-hidden className="size-4 shrink-0 stroke-2" /> : null}
                  </li>
                );
              })}
            </ul>
            {multiple || q ? (
              <>
                <div aria-hidden className="flex h-[9px] shrink-0 items-center px-1.5">
                  <span className="h-px flex-1 bg-separator" />
                </div>
                <div className="flex h-7 shrink-0 items-center justify-between gap-2 px-2.5 text-caption">
                  {q ? (
                    <>
                      {multiple ? (
                        <button
                          type="button"
                          onClick={() => setValue([...selected, ...matches.flatMap((entry) => entry.leaves).filter((leaf, i, all) => !picked.has(leaf) && all.indexOf(leaf) === i)])}
                          className="font-medium text-accent-soft-fg hover:underline"
                        >
                          Выбрать все найденные
                        </button>
                      ) : (
                        <span />
                      )}
                      <span className="text-fg-4">Esc — сбросить поиск</span>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 truncate text-fg-3 tabular-nums">
                        {props.multiple === true && props.summary ? props.summary(leaves) : `Выбрано: ${leaves.length}`}
                      </span>
                      {selected.length > 0 ? (
                        <button type="button" onClick={() => setValue([])} className="shrink-0 font-medium text-accent-soft-fg hover:underline">
                          Сбросить
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              </>
            ) : null}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </Popover>
  );
}

