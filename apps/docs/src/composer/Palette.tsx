import { useDraggable } from '@dnd-kit/core';
import {
  Bookmark,
  Columns3,
  Component as ComponentIcon,
  LayoutGrid,
  LayoutTemplate,
  PanelTop,
  RectangleHorizontal,
  Rows3,
  Search,
  Shapes,
  Type,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { IconButton, Input, Tooltip } from '@/kvant';
import { COMPONENT_GROUPS, LAYOUT_GROUP, createNode, type NodeSpec } from './catalog';
import { blockContent, type SavedBlock } from './library';
import type { ComposerNode } from './model';
import { parseDoc } from './serialize';
import type { Template } from './templates';

/** What a drag carries: a factory for new nodes, or the id of a node already on the canvas. */
export interface DragData {
  label: string;
  create?: () => ComposerNode;
  nodeId?: string;
}

export function isDragData(value: unknown): value is DragData {
  return typeof value === 'object' && value !== null && 'label' in value && typeof value.label === 'string';
}

export interface PaletteEntry {
  id: string;
  title: string;
  /** Second line for blocks; components show only the title. */
  hint?: string;
  keywords: string;
  icon: LucideIcon;
  create(): ComposerNode;
  /** «Мои блоки» can be removed from the library. */
  onRemove?: () => void;
}

const PRIMITIVE_ICONS: Record<string, LucideIcon> = {
  stack: Rows3,
  row: Columns3,
  grid: LayoutGrid,
  card: RectangleHorizontal,
  section: PanelTop,
  text: Type,
  icon: Shapes,
};

function specEntry(spec: NodeSpec): PaletteEntry {
  return {
    id: spec.type,
    title: spec.title,
    keywords: spec.keywords,
    icon: PRIMITIVE_ICONS[spec.type] ?? ComponentIcon,
    create: () => createNode(spec.type),
  };
}

interface Group {
  id: string;
  title: string;
  entries: readonly PaletteEntry[];
}

export interface PaletteProps {
  templates: readonly Template[];
  saved: readonly SavedBlock[];
  onInsert(entry: PaletteEntry): void;
  onRemoveSaved(name: string): void;
}

/** Everything that can go on the canvas: layout, blocks, then the library in documentation order. Click adds, drag places. */
export function Palette({ templates, saved, onInsert, onRemoveSaved }: PaletteProps) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLocaleLowerCase('ru');

  const groups: Group[] = [
    { id: LAYOUT_GROUP.id, title: LAYOUT_GROUP.title, entries: LAYOUT_GROUP.specs.map(specEntry) },
    {
      id: 'blocks',
      title: 'Блоки',
      entries: templates.map((template) => ({
        id: `template:${template.id}`,
        title: template.title,
        hint: template.description,
        keywords: template.id,
        icon: LayoutTemplate,
        create: template.create,
      })),
    },
    {
      id: 'saved',
      title: 'Мои блоки',
      entries: saved.map((block) => ({
        id: `saved:${block.name}`,
        title: block.title,
        hint: block.description || block.name,
        keywords: block.name,
        icon: Bookmark,
        create: () => blockContent(parseDoc(block.file)),
        onRemove: () => onRemoveSaved(block.name),
      })),
    },
    ...COMPONENT_GROUPS.map((group) => ({ id: group.id, title: group.title, entries: group.specs.map(specEntry) })),
  ];

  const visible = groups
    .map((group) => ({
      ...group,
      entries: group.entries.filter((entry) => !needle || `${entry.title} ${entry.keywords}`.toLocaleLowerCase('ru').includes(needle)),
    }))
    .filter((group) => group.entries.length > 0);

  return (
    <nav aria-label="Палитра" className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 p-3 pb-2">
        <Input
          size="sm"
          aria-label="Найти компонент или блок"
          placeholder="Найти"
          prefix={<Search />}
          value={query}
          onValueChange={setQuery}
          onClear={() => setQuery('')}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        {visible.length === 0 ? <p className="px-3 py-6 text-body-sm text-fg-3">Ничего не нашлось. Попробуйте по-английски: button, card.</p> : null}
        {visible.map((group) => (
          <section key={group.id} aria-labelledby={`palette-${group.id}`} className="flex flex-col gap-0.5">
            <h2 id={`palette-${group.id}`} className="px-3 pt-4 pb-1.5 text-caption font-medium text-fg-3">
              {group.title}
            </h2>
            {group.entries.map((entry) => (
              <PaletteItem key={entry.id} entry={entry} onInsert={onInsert} />
            ))}
          </section>
        ))}
      </div>
    </nav>
  );
}

function PaletteItem({ entry, onInsert }: { entry: PaletteEntry; onInsert(entry: PaletteEntry): void }) {
  const data: DragData = { label: entry.title, create: entry.create };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `palette:${entry.id}`, data });
  const Icon = entry.icon;

  return (
    <div className="group relative flex items-center">
      <button
        ref={setNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-roledescription="элемент палитры"
        onClick={() => onInsert(entry)}
        className="flex min-h-8 w-full items-start gap-2.5 rounded-xl px-3 py-1.5 text-left text-label-sm font-medium text-fg-2 transition-colors duration-(--duration-micro) hover:bg-fill-1 hover:text-fg-1 data-[dragging=true]:opacity-50"
        data-dragging={isDragging}
      >
        <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-3" />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate">{entry.title}</span>
          {entry.hint ? <span className="line-clamp-2 text-caption font-regular text-fg-3">{entry.hint}</span> : null}
        </span>
      </button>
      {entry.onRemove ? (
        <Tooltip content="Удалить из библиотеки">
          <IconButton
            size="xs"
            aria-label={`Удалить «${entry.title}» из библиотеки`}
            icon={<X />}
            onClick={entry.onRemove}
            className="absolute top-1 right-1 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
          />
        </Tooltip>
      ) : null}
    </div>
  );
}
