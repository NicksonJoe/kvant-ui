import { Plus } from 'lucide-react';
import { useEffect, useRef, useState, type ComponentProps, type DragEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface KanbanColumn {
  id: string;
  title: string;
  /** Stage dot: a chart-N token, e.g. `var(--color-chart-1)`. */
  color?: string;
  /** WIP limit: over it the counter turns into «5 / 4» in warning. */
  limit?: number;
  /** Right side of the header, usually the column sum: «1,9 млн ₽». */
  summary?: ReactNode;
}

/** Cards by column id, in display order. */
export type KanbanItems<T> = Readonly<Record<string, readonly T[]>>;

interface Target {
  column: string;
  index: number;
}

/** Moves one card; `index` counts positions in the target column before the move. */
export function moveKanbanItem<T extends { id: string }>(items: KanbanItems<T>, id: string, to: Target): KanbanItems<T> {
  const from = Object.keys(items).find((column) => items[column]?.some((item) => item.id === id));
  if (from === undefined) return items;
  const source = items[from] ?? [];
  const fromIndex = source.findIndex((item) => item.id === id);
  const moving = source[fromIndex];
  if (moving === undefined) return items;
  const index = from === to.column && fromIndex < to.index ? to.index - 1 : to.index;
  const rest = source.filter((item) => item.id !== id);
  const target = from === to.column ? rest : [...(items[to.column] ?? [])];
  target.splice(Math.min(Math.max(0, index), target.length), 0, moving);
  return { ...items, [from]: rest, [to.column]: target };
}

export interface KanbanProps<T extends { id: string }> extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  columns: readonly KanbanColumn[];
  items: KanbanItems<T>;
  onItemsChange: (items: KanbanItems<T>) => void;
  renderCard: (item: T) => ReactNode;
  /** Card name for screen readers and move announcements. */
  getLabel: (item: T) => string;
  onCardClick?: (item: T) => void;
  /** Shows «Добавить» at the bottom of every column. */
  onAdd?: (columnId: string) => void;
}

/**
 * Stages left to right with cards. Cards move by drag and drop or from the keyboard:
 * Alt+← → to the neighbouring column, Alt+↑ ↓ within one. Every move is announced.
 */
export function Kanban<T extends { id: string }>({
  columns,
  items,
  onItemsChange,
  renderCard,
  getLabel,
  onCardClick,
  onAdd,
  className,
  ...props
}: KanbanProps<T>) {
  const [dragged, setDragged] = useState<string | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const board = useRef<HTMLDivElement>(null);
  const refocus = useRef<string | null>(null);

  useEffect(() => {
    if (refocus.current === null) return;
    board.current?.querySelector<HTMLElement>(`[data-kanban-id="${CSS.escape(refocus.current)}"]`)?.focus();
    refocus.current = null;
  });

  const move = (item: T, to: Target) => {
    const next = moveKanbanItem(items, item.id, to);
    const column = columns.find((entry) => entry.id === to.column);
    const list = next[to.column] ?? [];
    const position = list.findIndex((entry) => entry.id === item.id) + 1;
    setAnnouncement(`«${getLabel(item)}» — в «${column?.title ?? to.column}», позиция ${position} из ${list.length}`);
    refocus.current = item.id;
    onItemsChange(next);
  };

  const drop = (column: string) => {
    const item = Object.values(items)
      .flat()
      .find((entry) => entry.id === dragged);
    if (item && target) move(item, target.column === column ? target : { column, index: items[column]?.length ?? 0 });
    setDragged(null);
    setTarget(null);
  };

  return (
    <div
      ref={board}
      data-slot="kanban"
      role="region"
      className={cn('flex items-start gap-3 overflow-x-auto rounded-2xl bg-surface-2 p-3', className)}
      {...props}
    >
      {columns.map((column, columnIndex) => {
        const cards = items[column.id] ?? [];
        const over = column.limit !== undefined && cards.length > column.limit;
        const slotAt = dragged !== null && target?.column === column.id ? target.index : null;
        const slot = <div aria-hidden className="h-14 shrink-0 rounded-md border-2 border-dashed border-accent bg-accent-soft" />;
        return (
          <section
            key={column.id}
            role="group"
            aria-label={`${column.title}, ${cards.length}`}
            data-slot="kanban-column"
            onDragOver={(event) => {
              if (dragged === null) return;
              event.preventDefault();
              if (event.target === event.currentTarget || !(event.target instanceof Element) || !event.target.closest('[data-kanban-id]')) {
                setTarget({ column: column.id, index: cards.length });
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              drop(column.id);
            }}
            className="flex w-[298px] min-w-[264px] shrink-0 flex-col gap-2"
          >
            <header className="flex h-9 items-center gap-2 px-1">
              {column.color ? <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: column.color }} /> : null}
              <h3 className="truncate text-label-md font-semibold text-fg-1">{column.title}</h3>
              <span
                className={cn(
                  'rounded-full px-1.5 text-caption tabular-nums',
                  over ? 'bg-warning-soft font-semibold text-warning-soft-fg' : 'bg-fill-2 text-fg-2',
                )}
              >
                {column.limit !== undefined ? `${cards.length} / ${column.limit}` : cards.length}
              </span>
              {column.summary ? <span className="ml-auto text-body-xs text-fg-2 tabular-nums">{column.summary}</span> : null}
            </header>
            {cards.length === 0 && slotAt === null ? (
              <div className="flex flex-col items-center gap-1 rounded-md border border-dashed border-border px-4 py-6 text-center">
                <p className="text-label-sm font-medium text-fg-2">Здесь пока пусто</p>
                <p className="text-caption text-fg-3">Перетащите сделку сюда</p>
              </div>
            ) : null}
            {cards.map((item, index) => (
              <div key={item.id} className="contents">
                {slotAt === index ? slot : null}
                <div
                  role="button"
                  tabIndex={0}
                  draggable
                  data-kanban-id={item.id}
                  aria-roledescription="карточка"
                  aria-label={getLabel(item)}
                  data-dragging={dragged === item.id || undefined}
                  onClick={() => onCardClick?.(item)}
                  onDragStart={(event: DragEvent<HTMLDivElement>) => {
                    event.dataTransfer?.setData('text/plain', item.id);
                    setDragged(item.id);
                  }}
                  onDragEnd={() => {
                    setDragged(null);
                    setTarget(null);
                  }}
                  onDragOver={(event) => {
                    if (dragged === null) return;
                    const rect = event.currentTarget.getBoundingClientRect();
                    setTarget({ column: column.id, index: event.clientY > rect.top + rect.height / 2 ? index + 1 : index });
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onCardClick?.(item);
                      return;
                    }
                    if (!event.altKey) return;
                    const side = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
                    const step = { ArrowUp: -1, ArrowDown: 2 }[event.key];
                    const neighbour = side !== undefined ? columns[columnIndex + side] : undefined;
                    if (neighbour) {
                      event.preventDefault();
                      move(item, { column: neighbour.id, index: items[neighbour.id]?.length ?? 0 });
                    } else if (step !== undefined && index + step >= 0 && index + step <= cards.length) {
                      event.preventDefault();
                      move(item, { column: column.id, index: index + step });
                    }
                  }}
                  className="rounded-xl outline-offset-2 transition-opacity duration-(--duration-quick) data-dragging:opacity-40"
                >
                  {renderCard(item)}
                </div>
              </div>
            ))}
            {slotAt !== null && slotAt >= cards.length ? slot : null}
            {onAdd ? (
              <button
                type="button"
                onClick={() => onAdd(column.id)}
                className="flex h-9 items-center gap-1.5 rounded-md px-2 text-label-sm font-medium text-fg-2 hover:bg-fill-1 hover:text-fg-1"
              >
                <Plus aria-hidden className="size-4 stroke-[1.75]" />
                Добавить
              </button>
            ) : null}
          </section>
        );
      })}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

export type KanbanCardProps = ComponentProps<'article'>;

/** Card surface: surface-1, r12, p12, raised shadow; lifts a little on hover. */
export function KanbanCard({ className, ...props }: KanbanCardProps) {
  return (
    <article
      data-slot="kanban-card"
      className={cn('flex flex-col gap-2 rounded-xl bg-surface-1 p-3 text-fg-1 shadow-raised transition-shadow duration-(--duration-quick) hover:shadow-overlay', className)}
      {...props}
    />
  );
}
