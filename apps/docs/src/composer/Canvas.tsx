import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { ATTRIBUTES, FOCUSABLE } from '../components/ForcedState';
import { getSpec } from './catalog';
import { hitTest, type Box, type Drop } from './drop';
import { boxOf, nodeBoxes, nodeElement } from './measure';
import { ROOT_ID, findNode, walk, type ComposerNode } from './model';
import { CanvasModeContext, NodeView } from './render';

export const FRAME_DRAG_ID = 'canvas-frame';
export const HANDLE_DRAG_ID = 'canvas-selection';

/** Screen heights of the emulated viewports. */
const FRAME_HEIGHT: Record<number, number> = { 402: 874, 768: 1024, 1440: 900 };
const PAD = 40;

export interface CanvasProps {
  root: ComposerNode;
  selected: string;
  editing: boolean;
  dragging: boolean;
  /** Where the dragged node would land, in viewport coordinates. */
  drop: Drop | null;
  viewport: number;
  /** Percent, or `fit` to the canvas width. */
  zoom: number | 'fit';
  contentRef: RefObject<HTMLDivElement | null>;
  onSelect(id: string): void;
  /** ↑ / ↓ on the focused canvas: previous / next node in document order. */
  onStep(delta: -1 | 1): void;
  /** Shown over an empty page in edit mode (start from a template). */
  empty: ReactNode;
}

function place(element: HTMLElement | null, box: Box | null): void {
  if (!element) return;
  element.hidden = box === null;
  if (!box) return;
  element.style.transform = `translate(${box.left}px, ${box.top}px)`;
  element.style.width = `${box.width}px`;
  element.style.height = `${box.height}px`;
}

/**
 * The live tree in a frame of the chosen viewport width. In edit mode the tree is inert: the frame does
 * hit-testing itself, so clicks select nodes and drags move them instead of operating the components.
 */
export function Canvas({ root, selected, editing, dragging, drop, viewport, zoom, contentRef, onSelect, onStep, empty }: CanvasProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const hovered = useRef<string | null>(null);
  const [available, setAvailable] = useState(0);

  const { setNodeRef: setFrameNode, listeners: frameListeners } = useDraggable({ id: FRAME_DRAG_ID, disabled: !editing });
  const {
    setNodeRef: setHandleNode,
    listeners: handleListeners,
    attributes: handleAttributes,
  } = useDraggable({ id: HANDLE_DRAG_ID, disabled: !editing || selected === ROOT_ID });
  const mode = useMemo(() => ({ editing, dragging }), [editing, dragging]);
  const scale = zoom === 'fit' ? (available > 0 ? Math.min(1, (available - PAD * 2) / viewport) : 1) : zoom / 100;
  const spec = getSpec(findNode(root, selected)?.type ?? root.type);

  /** Outlines, the selection chip and the drop indicator follow the DOM; drawn imperatively, no re-render. */
  const draw = useCallback(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;
    const origin = section.getBoundingClientRect();
    const local = (box: Box | null): Box | null => box && { ...box, left: box.left - origin.left, top: box.top - origin.top };
    const show = editing && !dragging;
    // the page is the frame itself: no outline for it
    const selectedBox = show && selected !== ROOT_ID ? local(boxOf(nodeElement(content, selected))) : null;
    const hover = hovered.current;
    place(selectedRef.current, selectedBox);
    place(hoverRef.current, show && hover && hover !== selected && hover !== ROOT_ID ? local(boxOf(nodeElement(content, hover))) : null);
    place(lineRef.current, editing && drop?.line ? local(drop.line) : null);
    place(zoneRef.current, editing && drop && !drop.line ? local(drop.zone) : null);
    const chip = chipRef.current;
    if (chip) {
      chip.hidden = !selectedBox;
      if (selectedBox) chip.style.transform = `translate(${selectedBox.left}px, ${selectedBox.top < 28 ? selectedBox.top + 4 : selectedBox.top - 26}px)`;
    }
  }, [contentRef, editing, dragging, selected, drop]);

  useLayoutEffect(() => draw(), [draw, root, viewport, scale]);

  useEffect(() => {
    const scroll = scrollRef.current;
    const content = contentRef.current;
    if (!scroll || !content || typeof ResizeObserver === 'undefined') return;
    const sizes = new ResizeObserver(() => {
      setAvailable(scroll.clientWidth);
      draw();
    });
    sizes.observe(scroll);
    sizes.observe(content);
    return () => sizes.disconnect();
  }, [contentRef, draw]);

  // forced hover / pressed / focus from the inspector, on the node's first interactive element
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const applied: [Element, string][] = [];
    walk(root, (node) => {
      const element = node.state ? nodeElement(content, node.id) : null;
      if (!element || !node.state) return;
      const target = element.matches(FOCUSABLE) ? element : (element.querySelector(FOCUSABLE) ?? element.firstElementChild ?? element);
      target.setAttribute(ATTRIBUTES[node.state], '');
      applied.push([target, ATTRIBUTES[node.state]]);
    });
    return () => applied.forEach(([element, attribute]) => element.removeAttribute(attribute));
  }, [root, contentRef]);

  const hitAt = (x: number, y: number): string | null => {
    const content = contentRef.current;
    return content ? hitTest({ x, y }, nodeBoxes(content, root)) : null;
  };

  return (
    <section ref={sectionRef} data-canvas-viewport aria-label="Холст" className="relative min-h-0 flex-1 overflow-hidden">
      <div ref={scrollRef} onScroll={draw} className="docs-stage absolute inset-0 overflow-auto">
        <div className="flex w-max min-w-full flex-col items-center gap-3" style={{ padding: PAD }}>
          <span className="font-mono text-caption text-fg-3 tabular-nums">
            {viewport} px · {Math.round(scale * 100)} %
          </span>
          <div
            ref={setFrameNode}
            role="application"
            aria-label="Холст: ↑ ↓ — выбрать элемент, ⌥↑ ⌥↓ — переставить, ⌘D — дублировать, ⌫ — удалить"
            tabIndex={editing ? 0 : -1}
            {...frameListeners}
            onPointerDownCapture={(event) => {
              if (editing && event.button === 0) onSelect(hitAt(event.clientX, event.clientY) ?? ROOT_ID);
            }}
            onPointerMove={(event) => {
              if (!editing || dragging) return;
              const id = hitAt(event.clientX, event.clientY);
              if (id === hovered.current) return;
              hovered.current = id;
              draw();
            }}
            onPointerLeave={() => {
              hovered.current = null;
              draw();
            }}
            onKeyDown={(event) => {
              if (!editing || event.altKey || event.metaKey || event.ctrlKey) return;
              if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
              event.preventDefault();
              onStep(event.key === 'ArrowUp' ? -1 : 1);
            }}
            className="relative shrink-0 rounded-2xl bg-background shadow-raised outline-none focus-visible:shadow-[0_0_0_2px_var(--color-ring)]"
            style={{ width: viewport, zoom: scale }}
          >
            <div ref={contentRef} inert={editing} className="flex flex-col p-6" style={{ minHeight: FRAME_HEIGHT[viewport] ?? 800 }}>
              <CanvasModeContext value={mode}>
                <NodeView node={root} />
              </CanvasModeContext>
            </div>
            {editing && !dragging && (root.slots.children?.length ?? 0) === 0 ? (
              // the start screen is live while the tree is inert; its clicks must not start a canvas drag
              <div className="absolute inset-x-0 top-0 flex justify-center px-6 pt-24" onPointerDown={(event) => event.stopPropagation()}>
                {empty}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div ref={hoverRef} hidden className="absolute top-0 left-0 rounded-[3px] shadow-[0_0_0_1px_var(--color-accent)] opacity-60" />
        <div ref={selectedRef} hidden className="absolute top-0 left-0 rounded-[3px] shadow-[0_0_0_2px_var(--color-accent)]" />
        <div ref={zoneRef} hidden className="absolute top-0 left-0 rounded-md bg-accent-soft opacity-70 shadow-[inset_0_0_0_2px_var(--color-accent)]" />
        <div ref={lineRef} hidden className="absolute top-0 left-0 rounded-full bg-accent shadow-[0_0_0_2px_var(--color-background)]" />
      </div>
      <div ref={chipRef} hidden className="absolute top-0 left-0 z-10 flex h-6 items-center rounded-full bg-accent pr-2 pl-0.5 text-caption font-medium text-accent-fg shadow-raised">
        <button
          ref={setHandleNode}
          type="button"
          {...handleAttributes}
          {...handleListeners}
          aria-roledescription="перетаскиваемый элемент"
          aria-label={`Перетащить «${spec?.title ?? ''}»`}
          className="grid size-5 cursor-grab touch-none place-items-center rounded-full hover:bg-[oklch(1_0_0/0.16)] active:cursor-grabbing"
        >
          <GripVertical aria-hidden className="size-3.5" />
        </button>
        <span className="max-w-48 truncate">{selected === ROOT_ID ? 'Страница' : spec?.title}</span>
      </div>
    </section>
  );
}
