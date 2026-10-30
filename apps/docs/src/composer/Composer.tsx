import { DndContext, PointerSensor, useSensor, useSensors, type Announcements, type DragStartEvent } from '@dnd-kit/core';
import { useEffect, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'react-router';
import { Button, Sheet, SheetBody, SheetContent, SheetHeader, toast } from '@/kvant';
import { BlockDialog } from './BlockDialog';
import { Canvas, FRAME_DRAG_ID, HANDLE_DRAG_ID } from './Canvas';
import { acceptsChildren, createNode, getSpec } from './catalog';
import { ComposerBar, type Viewport, type Zoom } from './ComposerBar';
import { hitTest, inside, resolveDrop, type Drop, type Point } from './drop';
import { ExportPanel } from './ExportPanel';
import { composerReducer, initialState } from './history';
import { ImportDialog } from './ImportDialog';
import { Inspector, nodeLabel } from './Inspector';
import { loadDraft, saveDraft, useSavedBlocks } from './library';
import { dropZones, nodeBoxes } from './measure';
import {
  CHILDREN,
  ROOT_ID,
  ancestors,
  duplicateNode,
  emptyRoot,
  findNode,
  flatten,
  insertNode,
  locate,
  moveNode,
  removeNode,
  setProps,
  setState,
  shiftNode,
  walk,
  type ComposerNode,
  type Place,
} from './model';
import { Palette, isDragData, type PaletteEntry } from './Palette';
import { decodeShare, encodeShare } from './serialize';
import { TEMPLATES, type Template } from './templates';

interface Start {
  root: ComposerNode;
  selected: string;
  notice: string | null;
}

/** A share link (#doc=…) wins, then `?c=<component>` from a docs page, then the saved draft. */
function openStart(componentId: string | null): Start {
  let notice: string | null = null;
  const shared = /^#doc=([\w-]+)$/.exec(window.location.hash)?.[1];
  if (shared) {
    try {
      return { root: decodeShare(shared), selected: ROOT_ID, notice };
    } catch (error) {
      notice = error instanceof Error ? error.message : 'Ссылка повреждена';
    }
  }
  if (componentId && getSpec(componentId)) {
    const node = createNode(componentId);
    return { root: { ...emptyRoot(), slots: { [CHILDREN]: [node] } }, selected: node.id, notice };
  }
  return { root: loadDraft() ?? emptyRoot(), selected: ROOT_ID, notice };
}

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => true,
  );
}

function hasCard(node: ComposerNode): boolean {
  let found = false;
  walk(node, (item) => {
    if (item.type === 'card') found = true;
  });
  return found;
}

/** Kvant rule: cards are never nested. */
function nestsCard(root: ComposerNode, parentId: string, node: ComposerNode): boolean {
  const parent = findNode(root, parentId);
  return hasCard(node) && [...ancestors(root, parentId), ...(parent ? [parent] : [])].some((item) => item.type === 'card');
}

/** Click in the palette: into the selected container, otherwise right after the selected node. */
function insertionPlace(root: ComposerNode, selected: string): Place {
  const target = findNode(root, selected) ?? root;
  const spec = getSpec(target.type);
  if (spec && acceptsChildren(spec)) return { parentId: target.id, slot: CHILDREN, index: target.slots[CHILDREN]?.length ?? 0 };
  const place = locate(root, target.id);
  return place ? { ...place, index: place.index + 1 } : { parentId: ROOT_ID, slot: CHILDREN, index: root.slots[CHILDREN]?.length ?? 0 };
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [role="menu"], [role="listbox"]') !== null;
}

function pointOf(event: Event | null): Point | null {
  return event instanceof MouseEvent ? { x: event.clientX, y: event.clientY } : null;
}

const announcements: Announcements = {
  onDragStart: () => 'Перетаскивание началось',
  onDragOver: () => undefined,
  onDragEnd: () => 'Перетаскивание закончено',
  onDragCancel: () => 'Перетаскивание отменено',
};

interface Drag {
  label: string;
  node: ComposerNode;
  /** The node is already on the canvas (a move, not an insert). */
  moving: boolean;
}

/** Playground: palette, live canvas and inspector over one document with undo, export and share. */
export function Composer() {
  const [search] = useSearchParams();
  const [start] = useState(() => openStart(search.get('c')));
  const [state, dispatch] = useReducer(composerReducer, start, (value) => ({ ...initialState(value.root), selected: value.selected }));
  const { root, selected, past, future } = state;
  const selectedNode = findNode(root, selected) ?? root;

  // phones start with the phone frame
  const [viewport, setViewport] = useState<Viewport>(() => (window.matchMedia('(min-width: 768px)').matches ? '768' : '402'));
  const [zoom, setZoom] = useState<Zoom>('fit');
  const [preview, setPreview] = useState(false);
  const [codeOpen, setCodeOpen] = useState(true);
  const [dialog, setDialog] = useState<'block' | 'import' | null>(null);
  const [sheet, setSheet] = useState<'palette' | 'inspector' | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [drop, setDrop] = useState<Drop | null>(null);
  const [blocks, saveBlock, removeBlock] = useSavedBlocks();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const contentRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const lastDrop = useRef(0);
  const noticed = useRef(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const change = (next: ComposerNode, select?: string, merge?: string) => dispatch({ type: 'change', root: next, select, merge });
  const select = (id: string) => dispatch({ type: 'select', id });

  // the URL carried the start document once; later reloads open the draft
  useEffect(() => {
    if (window.location.hash || window.location.search) window.history.replaceState(window.history.state, '', window.location.pathname);
    if (start.notice && !noticed.current) {
      noticed.current = true;
      toast.add({ type: 'danger', title: 'Ссылка не открылась', description: `${start.notice}. Открыт черновик.` });
    }
  }, [start]);

  useEffect(() => saveDraft(root), [root]);

  const insert = (node: ComposerNode) => {
    const place = insertionPlace(root, selected);
    if (nestsCard(root, place.parentId, node)) {
      toast.add({ type: 'warning', title: 'Карточки не вкладываются', description: 'Блок добавлен на страницу.' });
      change(insertNode(root, { parentId: ROOT_ID, slot: CHILDREN, index: root.slots[CHILDREN]?.length ?? 0 }, node), node.id);
    } else {
      change(insertNode(root, place, node), node.id);
    }
  };

  const remove = () => {
    if (selected === ROOT_ID) return;
    change(removeNode(root, selected), locate(root, selected)?.parentId ?? ROOT_ID);
  };

  const duplicate = () => {
    if (selected === ROOT_ID) return;
    const result = duplicateNode(root, selected);
    change(result.root, result.id);
  };

  const shift = (delta: -1 | 1) => change(shiftNode(root, selected, delta));

  const step = (delta: -1 | 1) => {
    const order = flatten(root);
    const index = order.findIndex((node) => node.id === selected);
    const next = order[Math.max(0, Math.min(order.length - 1, index + delta))];
    if (next) select(next.id);
  };

  const startFrom = (template: Template) => change(insertNode(root, { parentId: ROOT_ID, slot: CHILDREN, index: 0 }, template.create()));

  // shortcuts work anywhere but in text fields, menus and dialogs; `code` keeps them on any keyboard layout
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || drag || dialog || isTyping(event.target)) return;
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.code === 'KeyZ') {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? 'redo' : 'undo' });
      } else if (mod && event.code === 'KeyY') {
        event.preventDefault();
        dispatch({ type: 'redo' });
      } else if (preview) {
        return;
      } else if (mod && event.code === 'KeyD') {
        event.preventDefault();
        duplicate();
      } else if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        event.preventDefault();
        shift(event.key === 'ArrowUp' ? -1 : 1);
      } else if (!mod && (event.key === 'Delete' || event.key === 'Backspace')) {
        event.preventDefault();
        remove();
      } else if (event.key === 'Escape' && selected !== ROOT_ID) {
        select(locate(root, selected)?.parentId ?? ROOT_ID);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // while dragging: the chip follows the pointer, the drop target follows the canvas under it
  useEffect(() => {
    if (!drag) return;
    const onMove = (event: PointerEvent) => {
      const point = { x: event.clientX, y: event.clientY };
      const chip = chipRef.current;
      if (chip) chip.style.transform = `translate(${point.x + 14}px, ${point.y + 14}px)`;
      const content = contentRef.current;
      const area = content?.closest('[data-canvas-viewport]')?.getBoundingClientRect();
      const visible = area ? inside({ left: area.left, top: area.top, width: area.width, height: area.height }, point) : false;
      const next = content && visible ? resolveDrop(point, dropZones(content, root, drag.node)) : null;
      setDrop((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [drag, root]);

  const onDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    const origin = pointOf(event.activatorEvent);
    let node: ComposerNode | undefined;
    let moving = true;
    if (event.active.id === FRAME_DRAG_ID) {
      const content = contentRef.current;
      const id = content && origin ? hitTest(origin, nodeBoxes(content, root)) : null;
      node = id && id !== ROOT_ID ? findNode(root, id) : undefined;
    } else if (event.active.id === HANDLE_DRAG_ID) {
      node = selected === ROOT_ID ? undefined : selectedNode;
    } else if (isDragData(data) && data.create) {
      node = data.create();
      moving = false;
    }
    if (!node) return;
    if (chipRef.current && origin) chipRef.current.style.transform = `translate(${origin.x + 14}px, ${origin.y + 14}px)`;
    setDrag({ label: moving ? nodeLabel(node) : isDragData(data) ? data.label : nodeLabel(node), node, moving });
    if (moving) select(node.id);
  };

  const finishDrag = (apply: boolean) => {
    if (apply && drag && drop) {
      if (drag.moving) change(moveNode(root, drag.node.id, drop.place), drag.node.id);
      else if (!nestsCard(root, drop.place.parentId, drag.node)) change(insertNode(root, drop.place, drag.node), drag.node.id);
    }
    if (drag) lastDrop.current = performance.now();
    setDrag(null);
    setDrop(null);
  };

  const insertFromPalette = (entry: PaletteEntry) => {
    // a drop released over its own palette row also clicks it
    if (performance.now() - lastDrop.current < 300) return;
    insert(entry.create());
    setSheet(null);
  };

  const palette = <Palette templates={TEMPLATES} saved={blocks} onInsert={insertFromPalette} onRemoveSaved={removeBlock} />;
  const inspector = (
    <Inspector
      root={root}
      node={selectedNode}
      onSelect={select}
      onProps={(patch, merge) => change(setProps(root, selectedNode.id, patch), undefined, merge)}
      onState={(value) => change(setState(root, selectedNode.id, value))}
      onAdd={(slot, node) => change(insertNode(root, { parentId: selectedNode.id, slot, index: selectedNode.slots[slot]?.length ?? 0 }, node), node.id)}
      onShift={shift}
      onDuplicate={duplicate}
      onDelete={remove}
    />
  );
  const empty = (
    <div className="flex max-w-md flex-col items-center gap-4 text-center">
      <div className="flex flex-col gap-1">
        <p className="text-heading-xs font-semibold text-fg-1">Холст пуст</p>
        <p className="text-body-sm text-fg-3">Перетащите компоненты из палитры или начните с шаблона.</p>
      </div>
      <div className="grid w-full gap-2 sm:grid-cols-2">
        {TEMPLATES.map((template) => (
          <Button key={template.id} variant="secondary" onClick={() => startFrom(template)}>
            {template.title}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <DndContext
      sensors={sensors}
      autoScroll={false}
      accessibility={{ announcements, screenReaderInstructions: { draggable: 'Enter добавляет элемент на холст; мышью его можно перетащить в нужное место.' } }}
      onDragStart={onDragStart}
      onDragEnd={() => finishDrag(true)}
      onDragCancel={() => finishDrag(false)}
    >
      <a
        href="#content"
        className="sr-only z-50 rounded-full bg-surface-1 px-4 py-2 text-label-md shadow-overlay focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Перейти к холсту
      </a>
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <ComposerBar
          desktop={desktop}
          canUndo={past.length > 0}
          canRedo={future.length > 0}
          canClear={(root.slots[CHILDREN]?.length ?? 0) > 0}
          onUndo={() => dispatch({ type: 'undo' })}
          onRedo={() => dispatch({ type: 'redo' })}
          onClear={() => change({ ...root, slots: { ...root.slots, [CHILDREN]: [] } }, ROOT_ID)}
          viewport={viewport}
          onViewport={setViewport}
          zoom={zoom}
          onZoom={setZoom}
          preview={preview}
          onPreview={setPreview}
          onImport={() => setDialog('import')}
          onShare={() => void share(root)}
          onSaveBlock={() => setDialog('block')}
          onPalette={() => setSheet('palette')}
          onInspector={() => setSheet('inspector')}
        />
        <div className="flex min-h-0 flex-1">
          {desktop ? <aside className="flex w-64 shrink-0 flex-col border-r border-separator">{palette}</aside> : null}
          <main id="content" className="flex min-w-0 flex-1 flex-col">
            <Canvas
              root={root}
              selected={selected}
              editing={!preview}
              dragging={drag !== null}
              drop={drop}
              viewport={Number(viewport)}
              zoom={zoom === 'fit' ? 'fit' : Number(zoom)}
              contentRef={contentRef}
              onSelect={select}
              onStep={step}
              empty={empty}
            />
            <ExportPanel root={root} open={codeOpen} onOpenChange={setCodeOpen} onImport={() => setDialog('import')} />
          </main>
          {desktop ? (
            <aside aria-label="Инспектор" className="w-80 shrink-0 overflow-y-auto border-l border-separator">
              {inspector}
            </aside>
          ) : null}
        </div>
      </div>

      {desktop ? null : (
        <>
          <Sheet open={sheet === 'palette'} onOpenChange={(open) => setSheet(open ? 'palette' : null)}>
            <SheetContent side="left">
              <SheetHeader title="Палитра" description="Нажмите, чтобы добавить на холст" />
              <SheetBody className="flex min-h-0 flex-col p-0">{palette}</SheetBody>
            </SheetContent>
          </Sheet>
          <Sheet open={sheet === 'inspector'} onOpenChange={(open) => setSheet(open ? 'inspector' : null)}>
            <SheetContent side="right">
              <SheetHeader title="Инспектор" />
              <SheetBody className="p-0">{inspector}</SheetBody>
            </SheetContent>
          </Sheet>
        </>
      )}

      <BlockDialog open={dialog === 'block'} onOpenChange={(open) => setDialog(open ? 'block' : null)} root={root} onSave={saveBlock} />
      <ImportDialog open={dialog === 'import'} onOpenChange={(open) => setDialog(open ? 'import' : null)} onImport={(next) => change(next, ROOT_ID)} />

      <div
        ref={chipRef}
        hidden={!drag}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-50 rounded-full bg-accent px-3 py-1 text-caption font-medium text-accent-fg shadow-overlay"
      >
        {drag?.label}
      </div>
      <p className="sr-only" aria-live="polite">
        Выбрано: {nodeLabel(selectedNode)}
      </p>
    </DndContext>
  );
}

async function share(root: ComposerNode): Promise<void> {
  const url = `${window.location.origin}${window.location.pathname}#doc=${encodeShare(root)}`;
  try {
    await navigator.clipboard.writeText(url);
    toast.add({ type: 'success', title: 'Ссылка скопирована', description: 'В ней весь холст: откроется у любого, без входа.' });
  } catch {
    toast.add({ type: 'danger', title: 'Не удалось скопировать', description: 'Браузер не дал доступ к буферу обмена' });
  }
}
