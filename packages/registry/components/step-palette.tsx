import { GripVertical } from 'lucide-react';
import { useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { CANVAS_NODE_KINDS, CanvasNodeTile, type CanvasServiceLogo } from './canvas-node';
import type { CanvasNodeKind } from './canvas-types';
import { SearchField } from './search-field';

/** DataTransfer type of a step dragged from the palette; the payload is JSON `CanvasStepDragPayload`. */
export const CANVAS_STEP_MIME = 'application/x-kvant-step';

/** A step the user can add: one row of the palette or the insert menu. */
export interface CanvasStepTemplate {
  id: string;
  kind: CanvasNodeKind;
  title: string;
  /** Own icon instead of the kind icon. */
  icon?: ReactNode;
  logo?: CanvasServiceLogo;
  /** Extra words the search matches: service names, synonyms. */
  keywords?: readonly string[];
}

export interface CanvasStepGroup {
  id: string;
  /** «Триггеры», «Действия», «Логика», «AI и данные». */
  title: string;
  items: readonly CanvasStepTemplate[];
}

export interface CanvasStepDragPayload {
  kind: CanvasNodeKind;
  templateId: string;
}

const KIND_SET = new Set<string>(CANVAS_NODE_KINDS);

/** The step dropped on the canvas, or null when the drop is not a palette step (files, text, foreign JSON). */
export function readCanvasStepDrag(data: DataTransfer): CanvasStepDragPayload | null {
  const raw = data.getData(CANVAS_STEP_MIME);
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const { kind, templateId } = value as Record<string, unknown>;
    if (typeof kind !== 'string' || !KIND_SET.has(kind) || typeof templateId !== 'string') return null;
    return { kind: kind as CanvasNodeKind, templateId };
  } catch {
    return null;
  }
}

/** Case-insensitive match on the title and keywords. */
export function matchesCanvasStep(template: CanvasStepTemplate, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase('ru');
  if (!needle) return true;
  return [template.title, ...(template.keywords ?? [])].some((text) => text.toLocaleLowerCase('ru').includes(needle));
}

export interface StepPaletteProps extends Omit<ComponentProps<'div'>, 'children'> {
  groups: readonly CanvasStepGroup[];
  /** Click or Enter on a step: put it on the canvas (after the selected step or in the centre). */
  onInsert: (template: CanvasStepTemplate) => void;
  /** Key that focuses the search from anywhere on the page; default «/». */
  shortcut?: string;
}

const itemSelector = '[data-slot=step-palette-item]';

/** Left palette of the editor: search with «/», steps by family; drag a step onto the canvas or press Enter. */
export function StepPalette({ groups, onInsert, shortcut = '/', className, ...props }: StepPaletteProps) {
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const visible = groups
    .map((group) => ({ ...group, items: group.items.filter((item) => matchesCanvasStep(item, query)) }))
    .filter((group) => group.items.length > 0);

  const items = () => [...(listRef.current?.querySelectorAll<HTMLElement>(itemSelector) ?? [])];
  const move = (event: KeyboardEvent<HTMLElement>, step: 1 | -1) => {
    const all = items();
    if (all.length === 0) return;
    event.preventDefault();
    const index = all.indexOf(document.activeElement as HTMLElement);
    const next = index === -1 ? (step === 1 ? 0 : all.length - 1) : Math.min(all.length - 1, Math.max(0, index + step));
    all[next]?.focus();
  };

  return (
    <div data-slot="step-palette" className={cn('flex flex-col gap-4 p-3', className)} {...props}>
      <SearchField
        aria-label="Найти шаг"
        placeholder="Найти шаг"
        shortcut={shortcut}
        value={query}
        onValueChange={setQuery}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') move(event, 1);
          if (event.key !== 'Enter') return;
          const first = visible[0]?.items[0];
          if (!first) return;
          event.preventDefault();
          onInsert(first);
        }}
      />
      <div
        ref={listRef}
        className="flex min-h-0 flex-col gap-4 overflow-y-auto"
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') move(event, 1);
          if (event.key === 'ArrowUp') move(event, -1);
        }}
      >
        {visible.length === 0 ? <p className="px-2 text-body-xs text-fg-3">Ничего не нашлось</p> : null}
        {visible.map((group) => (
          <div key={group.id} role="group" aria-labelledby={`${id}-${group.id}`} className="flex flex-col gap-0.5">
            <div id={`${id}-${group.id}`} className="px-2 pb-1 text-overline font-medium tracking-overline text-fg-3 uppercase">
              {group.title}
            </div>
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                draggable
                data-slot="step-palette-item"
                data-kind={item.kind}
                onClick={() => onInsert(item)}
                onDragStart={(event) => {
                  const payload: CanvasStepDragPayload = { kind: item.kind, templateId: item.id };
                  event.dataTransfer.setData(CANVAS_STEP_MIME, JSON.stringify(payload));
                  event.dataTransfer.setData('text/plain', item.title);
                  event.dataTransfer.effectAllowed = 'copy';
                }}
                className={cn(
                  'group flex h-8 shrink-0 cursor-grab items-center gap-2.5 rounded-sm px-2 text-left text-body-xs text-fg-1 active:cursor-grabbing',
                  'transition-colors duration-(--duration-micro) ease-hover hover:bg-fill-2 focus-visible:bg-fill-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                )}
              >
                <CanvasNodeTile kind={item.kind} icon={item.icon} logo={item.logo} size={24} />
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                <GripVertical
                  aria-hidden
                  className="size-3.5 shrink-0 text-fg-4 opacity-0 transition-opacity duration-(--duration-micro) group-hover:opacity-100 group-focus-visible:opacity-100"
                />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
