import { Lock, LockOpen, Map as MapIcon, Maximize2, Minimize2, Minus, Plus } from 'lucide-react';
import {
  createContext,
  memo,
  use,
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/cn';
import { useControllable } from '../lib/use-controllable';
import type {
  CanvasChange,
  CanvasConnection,
  CanvasEdge,
  CanvasEdgePath,
  CanvasGraph,
  CanvasNode,
  CanvasPoint,
  CanvasPort,
  CanvasPortSide,
  CanvasPortType,
  CanvasRunStatus,
  CanvasViewport,
} from './canvas-types';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from './menu';
import {
  absoluteRects,
  boundsOf,
  clamp,
  containsPoint,
  edgeGeometry,
  fitViewport,
  hiddenNodeIds,
  intersects,
  pointInPolygon,
  portPoint,
  sidePoint,
  snapRect,
  toGraph,
  toScreen,
  visibleEnd,
  zoomAt,
  type CanvasEdgeEnd,
  type CanvasGapMark,
  type CanvasGuide,
  type CanvasRect,
  type CanvasSize,
} from './node-canvas-geometry';
import { flowOrder, layoutGraph, type CanvasLayoutOptions } from './node-canvas-layout';
import { Tooltip } from './popover';
import { Announce, VisuallyHidden } from './visually-hidden';

/* ---------- Constants ---------- */

const INITIAL_VIEWPORT: CanvasViewport = { x: 0, y: 0, zoom: 1 };
/** «Вписать» leaves this much room around the graph for the corner panels. */
const FIT_PADDING = 48;
/** Pointer travel before a press becomes a drag. */
const DRAG_THRESHOLD = 3;
/** Edges, centres and equal gaps pull from this far, in screen px. */
const SNAP_PX = 6;
/** A dragged connection end jumps to a fitting port this close, in screen px. */
const MAGNET_PX = 24;
const NUDGE = 1;
const NUDGE_SHIFT = 20;
const ZOOM_STEP = 1.2;
const MOVE_MS = 240;
const MIN_WIDTH = 80;
const MIN_HEIGHT = 40;
/** From this many nodes only what is on screen is drawn and run packets give way to counters. */
const CULL_FROM = 200;
const CULL_MARGIN = 200;
const PACKETS = 4;
const PACKET_SECONDS = 1.6;

const NO_COUNTS: ReadonlyMap<string, number> = new Map();
const NO_PORTS: ReadonlySet<string> = new Set();
const NO_IDS: ReadonlySet<string> = new Set();

const TYPE_LABEL: Record<CanvasPortType, string> = {
  flow: 'поток',
  text: 'текст',
  number: 'число',
  date: 'дата',
  boolean: 'да/нет',
  object: 'объект',
  list: 'список',
  tool: 'инструмент',
  memory: 'память',
  knowledge: 'база знаний',
};

const STATUS_LABEL: Partial<Record<CanvasRunStatus, string>> = {
  waiting: 'ждёт',
  running: 'идёт',
  done: 'готово',
  error: 'ошибка',
  warning: 'предупреждение',
  skipped: 'пропущена',
};

/** Floating panel look from the board: surface-1, r12, hairline and a soft drop (p4 where it holds buttons). */
const PANEL_SURFACE = 'rounded-md bg-surface-1 shadow-[0_0_0_1px_var(--color-border),0_2px_8px_color-mix(in_oklch,var(--color-fg-1)_6%,transparent)]';

/* ---------- Types ---------- */

export type CanvasBackground = 'dots' | 'lines' | 'cross' | 'none';
/** select: drag on the empty canvas draws a selection frame · pan: it moves the view (the hand tool). */
export type CanvasTool = 'select' | 'pan';
/** How much a card shows at the current zoom: full from 60 %, compact 30–60 %, minimal (a colour bar) below. */
export type CanvasDetail = 'full' | 'compact' | 'minimal';

export interface CanvasNodeRenderState {
  selected: boolean;
  /** Moving under the pointer right now. */
  dragging: boolean;
  /** A search hit; the canvas also rings the node in warning. */
  highlighted: boolean;
  /** Nothing in the node can take the connection being dragged; the canvas fades it to 40 %. */
  dimmed: boolean;
  detail: CanvasDetail;
}

export interface CanvasInsertRequest {
  /** Graph point for the new step. */
  position: CanvasPoint;
  /** The port a connection was dropped from, or the selected step when Enter asked. */
  from?: { nodeId: string; portId?: string };
}

export interface CanvasSelection {
  nodes: string[];
  edges: string[];
}

export interface CanvasMoveOptions {
  /** Animation in ms; reduced motion makes every move instant. */
  duration?: number;
}

export interface CanvasFitOptions extends CanvasMoveOptions {
  /** Fit only these nodes (⇧2 «Вписать выделенное»). */
  nodeIds?: readonly string[];
  padding?: number;
}

export interface NodeCanvasApi {
  /** Whole graph or `nodeIds` in view, 48 px from the edges; 240 ms. */
  fitView: (options?: CanvasFitOptions) => void;
  /** Zoom around the centre of the canvas; instant by default. */
  zoomTo: (zoom: number, options?: CanvasMoveOptions) => void;
  zoomBy: (factor: number, options?: CanvasMoveOptions) => void;
  /** Brings a node to the centre, e.g. a ⌘F hit; 240 ms. */
  centerOnNode: (id: string, options?: CanvasMoveOptions & { zoom?: number }) => void;
  setViewport: (viewport: CanvasViewport, options?: CanvasMoveOptions) => void;
  getViewport: () => CanvasViewport;
  /** Graph point under a client (page) point: where a palette item was dropped. */
  screenToGraph: (point: CanvasPoint) => CanvasPoint;
  /** Lays out the graph or `nodeIds`, animates 240 ms, then reports one `layout` change; `fit` also fits the result in view. */
  layout: (options?: CanvasLayoutOptions & CanvasMoveOptions & { fit?: boolean }) => void;
}

export interface NodeCanvasProps<TData = unknown> {
  /** Name of the canvas for the screen reader: «Воркфлоу „Заявка → сделка“». */
  'aria-label': string;
  nodes: readonly CanvasNode<TData>[];
  edges: readonly CanvasEdge[];
  /** Every edit and selection, with why; pass `useCanvasHistory().change` for undo. Without it the canvas is view-only. */
  onGraphChange?: (graph: CanvasGraph<TData>, change: CanvasChange) => void;
  /** The card of a node; the canvas places, drags and resizes it and draws its ports. Keep the function stable. */
  renderNode: (node: CanvasNode<TData>, state: CanvasNodeRenderState) => ReactNode;
  /** Name of a node for announcements and edge labels; default: its id. */
  nodeLabel?: (node: CanvasNode<TData>) => string;
  /** Toolbar 8 px above the selected nodes: one step, several or a group. */
  renderNodeToolbar?: (nodes: readonly CanvasNode<TData>[]) => ReactNode;
  /** Toolbar above the middle of a single selected edge. */
  renderEdgeToolbar?: (edge: CanvasEdge) => ReactNode;
  viewport?: CanvasViewport;
  /** Start view; without it and `viewport` the canvas fits the graph once it has a size. */
  defaultViewport?: CanvasViewport;
  onViewportChange?: (viewport: CanvasViewport) => void;
  minZoom?: number;
  maxZoom?: number;
  /** Edge shape for the whole graph; an edge's own `path` wins. */
  edgePath?: CanvasEdgePath;
  background?: CanvasBackground;
  /** Grid step: background and snapping. */
  gridSize?: number;
  /** Snap dragged and resized nodes to the grid; ⌘ while dragging turns it off. */
  snapToGrid?: boolean;
  tool?: CanvasTool;
  /** View only: no ports, no moving, connecting or deleting; selection, pan and zoom stay. */
  readOnly?: boolean;
  /** Search hits: a warning ring on the node and a mark on the mini-map. */
  highlightedIds?: readonly string[];
  /** Extra rule on top of the built-in ones (directions, one edge per input, no duplicates); default: port types match. */
  isValidConnection?: (connection: CanvasConnection, graph: CanvasGraph<TData>) => boolean;
  /** Replaces adding the edge: e.g. to insert a converter step when types differ. */
  onConnect?: (connection: CanvasConnection) => void;
  /** «+» in the middle of a hovered edge, or + on a focused edge. */
  onInsertOnEdge?: (edge: CanvasEdge, position: CanvasPoint) => void;
  /** Enter on the canvas itself, double click on empty space, a connection dropped on empty space. */
  onRequestInsert?: (request: CanvasInsertRequest) => void;
  /** Empty state in the middle of the screen while the graph has no nodes; stop pointerdown in your own controls. */
  renderEmpty?: () => ReactNode;
  onSelectionChange?: (selection: CanvasSelection) => void;
  /** Delete / ⌫ asks first: resolve false to keep everything. */
  onBeforeDelete?: (selection: CanvasSelection) => boolean | Promise<boolean>;
  onUndo?: () => void;
  onRedo?: () => void;
  ref?: Ref<NodeCanvasApi>;
  /** Drawn in graph coordinates over the nodes: cursors, stickers, comments, CanvasPanel. Stop pointerdown in your own controls. */
  children?: ReactNode;
  /** Root: give the canvas a size. */
  className?: string;
}

interface CanvasContextValue {
  api: NodeCanvasApi;
  viewport: CanvasViewport;
  size: CanvasSize;
  nodes: readonly CanvasNode[];
  rects: ReadonlyMap<string, CanvasRect>;
  hidden: ReadonlySet<string>;
  highlighted: ReadonlySet<string>;
  minZoom: number;
  maxZoom: number;
  locked: boolean;
  readOnly: boolean;
  setLocked: (locked: boolean) => void;
  overlay: HTMLElement | null;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

/** The canvas around a component: its API, viewport, node rectangles and lock. For panels and graph-layer children. */
export function useNodeCanvas(): CanvasContextValue {
  const value = use(CanvasContext);
  if (!value) throw new Error('useNodeCanvas: render inside NodeCanvas');
  return value;
}

/* ---------- Helpers ---------- */

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';
const reducedNow = (): boolean => document.documentElement.hasAttribute('data-reduce-motion') || window.matchMedia(REDUCE_QUERY).matches;
function subscribeReduced(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
const useReducedMotion = (): boolean => useSyncExternalStore(subscribeReduced, reducedNow, () => false);

/** Runs `frame` with an ease-out progress 0…1 for `duration` ms; instant with reduced motion. Returns cancel. */
function animate(duration: number, frame: (progress: number) => void, done?: () => void): () => void {
  if (duration <= 0 || reducedNow()) {
    frame(1);
    done?.();
    return () => {};
  }
  const start = performance.now();
  let id = 0;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    frame(1 - (1 - t) ** 3);
    if (t < 1) id = requestAnimationFrame(tick);
    else done?.();
  };
  id = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(id);
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function setSelected<T extends { selected?: boolean }>(item: T, selected: boolean): T {
  return (item.selected ?? false) === selected ? item : { ...item, selected };
}

const selectionOf = (graph: CanvasGraph): CanvasSelection => ({
  nodes: graph.nodes.filter((node) => node.selected).map((node) => node.id),
  edges: graph.edges.filter((edge) => edge.selected).map((edge) => edge.id),
});

const edgeIdFor = (connection: CanvasConnection): string =>
  `${connection.source}:${connection.sourcePort}->${connection.target}:${connection.targetPort}`;
const sameType = (a: CanvasPortType | undefined, b: CanvasPortType | undefined): boolean => a === undefined || b === undefined || a === b;
const isResizable = (node: CanvasNode): boolean => node.resizable ?? (node.kind === 'group' || node.kind === 'note');
const newId = (): string => crypto.randomUUID();

const OPPOSITE: Record<CanvasPortSide, CanvasPortSide> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

function connectionFor(a: { nodeId: string; port: CanvasPort }, b: { nodeId: string; port: CanvasPort }): CanvasConnection | null {
  if (a.port.direction === b.port.direction || a.nodeId === b.nodeId) return null;
  const [from, to] = a.port.direction === 'out' ? [a, b] : [b, a];
  return { source: from.nodeId, sourcePort: from.port.id, target: to.nodeId, targetPort: to.port.id };
}

function isInside(id: string, ancestor: string, byId: ReadonlyMap<string, CanvasNode>): boolean {
  let current = byId.get(id)?.parentId;
  for (let depth = 0; current !== undefined && depth < byId.size; depth++) {
    if (current === ancestor) return true;
    current = byId.get(current)?.parentId;
  }
  return false;
}

function isEditable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

/** Pointer session on window: move after a 3 px threshold, end with the last event or null when cancelled (Esc). */
function track(
  start: ReactPointerEvent,
  handlers: { move: (event: PointerEvent) => void; end: (event: PointerEvent | null, moved: boolean) => void },
): void {
  const { clientX: x0, clientY: y0, pointerId } = start;
  let moved = false;
  const onMove = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    if (!moved && Math.hypot(event.clientX - x0, event.clientY - y0) < DRAG_THRESHOLD) return;
    moved = true;
    handlers.move(event);
  };
  const finish = (event: PointerEvent | null) => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    window.removeEventListener('keydown', onKey, true);
    handlers.end(event, moved);
  };
  const onUp = (event: PointerEvent) => {
    if (event.pointerId === pointerId) finish(event);
  };
  const onCancel = (event: PointerEvent) => {
    if (event.pointerId === pointerId) finish(null);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    finish(null);
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);
  window.addEventListener('keydown', onKey, true);
}

/* ---------- Background ---------- */

function CanvasBackdrop({ variant, gap, viewport }: { variant: CanvasBackground; gap: number; viewport: CanvasViewport }) {
  const id = useId();
  if (variant === 'none') return null;
  // Below 40 % the fine grid would be noise: only every fifth line stays.
  const fine = viewport.zoom >= 0.4;
  const tile = (step: number) => {
    const size = step * viewport.zoom;
    return { size, x: (((viewport.x % size) + size) % size) - size / 2, y: (((viewport.y % size) + size) % size) - size / 2 };
  };
  const small = tile(gap);
  const big = tile(gap * 5);
  const mark = (size: number, className: string, strong: boolean) => {
    const c = size / 2;
    if (variant === 'dots') return <circle cx={c} cy={c} r={strong ? 1.4 : 1.2} className={className} />;
    if (variant === 'cross') return <path d={`M${c - 4} ${c}H${c + 4}M${c} ${c - 4}V${c + 4}`} className={cn('fill-none', className)} strokeWidth={1} />;
    return <path d={`M${c} 0V${size}M0 ${c}H${size}`} className={cn('fill-none', className)} strokeWidth={1} />;
  };
  const tone = variant === 'lines' ? 'stroke-separator' : variant === 'cross' ? 'stroke-fg-4/45' : 'fill-fg-4/45';
  const strongTone = variant === 'lines' ? 'stroke-border' : tone;
  return (
    <svg data-slot="node-canvas-background" data-variant={variant} aria-hidden className="pointer-events-none absolute inset-0 size-full">
      <defs>
        <pattern id={`${id}-s`} patternUnits="userSpaceOnUse" x={small.x} y={small.y} width={small.size} height={small.size}>
          {mark(small.size, tone, false)}
        </pattern>
        <pattern id={`${id}-b`} patternUnits="userSpaceOnUse" x={big.x} y={big.y} width={big.size} height={big.size}>
          {mark(big.size, strongTone, true)}
        </pattern>
      </defs>
      {fine ? <rect width="100%" height="100%" fill={`url(#${id}-s)`} /> : null}
      {variant === 'lines' || !fine ? <rect width="100%" height="100%" fill={`url(#${id}-b)`} /> : null}
    </svg>
  );
}

/* ---------- Ports ---------- */

type PortShapeKind = 'capsule' | 'square' | 'square-dot' | 'circle' | 'circle-dot' | 'half' | 'diamond';

function portShape(type: CanvasPortType | undefined): PortShapeKind {
  switch (type) {
    case 'flow':
      return 'capsule';
    case 'object':
    case 'list':
      return 'square';
    case 'text':
    case 'date':
      return 'square-dot';
    case 'number':
      return 'circle-dot';
    case 'boolean':
      return 'half';
    case 'tool':
    case 'memory':
    case 'knowledge':
      return 'diamond';
    default:
      return 'circle';
  }
}

const SHAPE_CLASS: Record<PortShapeKind, string> = {
  capsule: 'h-2.5 w-4 rounded-full',
  square: 'size-3 rounded-[3px]',
  'square-dot': 'size-3 rounded-[3px]',
  circle: 'size-3 rounded-full',
  'circle-dot': 'size-3 rounded-full',
  half: 'size-3 rounded-full bg-[linear-gradient(90deg,var(--color-fg-4)_50%,var(--color-surface-1)_50%)]',
  diamond: 'size-2.5 rotate-45 rounded-[2px]',
};

const LABEL_SIDE: Record<CanvasPortSide, string> = {
  left: 'right-full mr-1 top-1/2 -translate-y-1/2',
  right: 'left-full ml-1 top-1/2 -translate-y-1/2',
  top: 'bottom-full mb-1 left-1/2 -translate-x-1/2',
  bottom: 'top-full mt-1 left-1/2 -translate-x-1/2',
};

function portStyle(port: CanvasPort, ports: readonly CanvasPort[]): CSSProperties {
  const same = ports.filter((item) => item.side === port.side);
  const along = port.offset !== undefined ? `${port.offset}px` : `${((same.indexOf(port) + 1) / (same.length + 1)) * 100}%`;
  switch (port.side) {
    case 'left':
      return { left: 0, top: along };
    case 'right':
      return { left: '100%', top: along };
    case 'top':
      return { top: 0, left: along };
    case 'bottom':
      return { top: '100%', left: along };
  }
}

function portName(port: CanvasPort, count: number): string {
  const parts = [`${port.direction === 'in' ? 'Вход' : 'Выход'}${port.label ? ` «${port.label}»` : ''}`, port.type ? TYPE_LABEL[port.type] : 'любой'];
  if (port.required) parts.push('обязательный');
  if (count > 0) parts.push(`связей: ${count}`);
  return parts.join(', ');
}

/* ---------- Node ---------- */

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
const HANDLES: readonly { handle: ResizeHandle; left: string; top: string; cursor: string }[] = [
  { handle: 'nw', left: '0%', top: '0%', cursor: 'nwse-resize' },
  { handle: 'n', left: '50%', top: '0%', cursor: 'ns-resize' },
  { handle: 'ne', left: '100%', top: '0%', cursor: 'nesw-resize' },
  { handle: 'e', left: '100%', top: '50%', cursor: 'ew-resize' },
  { handle: 'se', left: '100%', top: '100%', cursor: 'nwse-resize' },
  { handle: 's', left: '50%', top: '100%', cursor: 'ns-resize' },
  { handle: 'sw', left: '0%', top: '100%', cursor: 'nesw-resize' },
  { handle: 'w', left: '0%', top: '50%', cursor: 'ew-resize' },
];

interface NodeEvents {
  register: (id: string, element: HTMLDivElement | null) => void;
  nodePointerDown: (event: ReactPointerEvent<HTMLDivElement>, id: string) => void;
  portPointerDown: (event: ReactPointerEvent<HTMLButtonElement>, nodeId: string, portId: string) => void;
  portKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>, nodeId: string, portId: string) => void;
  resizePointerDown: (event: ReactPointerEvent<HTMLSpanElement>, id: string, handle: ResizeHandle) => void;
  /** Not a node event, but it goes through the same stable dispatcher. */
  edgeEndPointerDown: (event: ReactPointerEvent<SVGCircleElement>, edge: CanvasEdge, end: 'source' | 'target') => void;
}

interface NodeViewProps<TData> {
  node: CanvasNode<TData>;
  x: number;
  y: number;
  label: string;
  hintId: string;
  selected: boolean;
  dragging: boolean;
  highlighted: boolean;
  dimmed: boolean;
  dropTarget: boolean;
  detail: CanvasDetail;
  showPorts: boolean;
  handles: boolean;
  counts: ReadonlyMap<string, number>;
  compatible: ReadonlySet<string>;
  snapped: string | null;
  renderNode: (node: CanvasNode<TData>, state: CanvasNodeRenderState) => ReactNode;
  events: NodeEvents;
}

function NodeViewImpl<TData>({
  node,
  x,
  y,
  label,
  hintId,
  selected,
  dragging,
  highlighted,
  dimmed,
  dropTarget,
  detail,
  showPorts,
  handles,
  counts,
  compatible,
  snapped,
  renderNode,
  events,
}: NodeViewProps<TData>) {
  const register = useCallback((element: HTMLDivElement | null) => events.register(node.id, element), [events, node.id]);
  const group = node.kind === 'group';
  return (
    <div
      ref={register}
      data-slot="node-canvas-node"
      data-canvas-focus=""
      data-id={node.id}
      data-kind={node.kind}
      data-selected={selected || undefined}
      data-dragging={dragging || undefined}
      data-highlighted={highlighted || undefined}
      data-dimmed={dimmed || undefined}
      data-drop-target={dropTarget || undefined}
      data-disabled={node.disabled || undefined}
      role="group"
      aria-roledescription={group ? 'группа' : 'шаг'}
      aria-label={selected ? `${label}, выделен` : label}
      aria-describedby={hintId}
      tabIndex={0}
      className={cn(
        'absolute left-0 top-0 transition-opacity duration-quick ease-out',
        group ? 'rounded-lg' : 'rounded-md',
        // Focus is the global 2 px ring in fg-1, apart from the accent of selection.
        'focus-visible:outline-fg-1',
        'data-highlighted:shadow-[0_0_0_3px_var(--color-warning)] data-drop-target:shadow-[0_0_0_2px_var(--color-accent)]',
        'data-dimmed:opacity-40',
        dragging ? 'cursor-grabbing' : 'cursor-default',
      )}
      style={{ transform: `translate(${x}px, ${y}px)`, width: node.width, height: node.height, zIndex: selected || dragging ? 1 : undefined }}
      onPointerDown={(event) => events.nodePointerDown(event, node.id)}
    >
      {renderNode(node, { selected, dragging, highlighted, dimmed, detail })}
      {showPorts
        ? node.ports.map((port) => {
            const count = counts.get(port.id) ?? 0;
            const shape = portShape(port.type);
            return (
              <button
                key={port.id}
                type="button"
                tabIndex={-1}
                data-slot="node-canvas-port"
                data-canvas-focus=""
                data-port={port.id}
                data-side={port.side}
                data-type={port.type ?? 'any'}
                data-connected={count > 0 || undefined}
                data-compatible={compatible.has(port.id) || undefined}
                data-snapped={snapped === port.id || undefined}
                data-required={(port.required && count === 0) || undefined}
                aria-label={portName(port, count)}
                className="group/port absolute z-[2] flex size-6 -translate-x-1/2 -translate-y-1/2 cursor-crosshair items-center justify-center rounded-full focus-visible:outline-offset-0 focus-visible:outline-fg-1"
                style={portStyle(port, node.ports)}
                onPointerDown={(event) => events.portPointerDown(event, node.id, port.id)}
                onKeyDown={(event) => events.portKeyDown(event, node.id, port.id)}
              >
                <span
                  className={cn(
                    'flex items-center justify-center border-2 bg-surface-1 transition-[transform,box-shadow,border-color] duration-quick ease-out',
                    shape === 'diamond' ? 'border-chart-7' : 'border-fg-4',
                    SHAPE_CLASS[shape],
                    'group-hover/port:scale-[1.17] group-hover/port:shadow-[0_0_0_3px_var(--color-fill-3)]',
                    'group-data-connected/port:bg-fg-4 group-data-required/port:border-danger',
                    'group-data-compatible/port:border-accent group-data-compatible/port:shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-accent)_20%,transparent)]',
                    'group-data-snapped/port:scale-150',
                  )}
                >
                  {shape === 'square-dot' || shape === 'circle-dot' ? <span className="size-1 rounded-full bg-fg-4 group-data-connected/port:bg-surface-1" /> : null}
                </span>
                {count > 1 ? (
                  <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-fg-1 px-1 font-mono text-[10px] font-semibold leading-none text-surface-1">
                    {count}
                  </span>
                ) : null}
                <span
                  className={cn(
                    'pointer-events-none absolute hidden whitespace-nowrap rounded-xs bg-fg-1 px-1.5 py-0.5 text-caption font-medium text-surface-1',
                    'group-hover/port:block group-focus-visible/port:block group-data-snapped/port:block',
                    LABEL_SIDE[port.side],
                  )}
                >
                  {port.type ? TYPE_LABEL[port.type] : 'любой'}
                </span>
              </button>
            );
          })
        : null}
      {handles ? (
        <>
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] outline-[1.5px] outline-accent" />
          {HANDLES.map(({ handle, left, top, cursor }) => (
            <span
              key={handle}
              aria-hidden
              data-slot="node-canvas-resize-handle"
              data-handle={handle}
              className="absolute z-[3] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-[2px] border-[1.5px] border-accent bg-surface-1 hover:bg-accent"
              style={{ left, top, cursor }}
              onPointerDown={(event) => events.resizePointerDown(event, node.id, handle)}
            />
          ))}
        </>
      ) : null}
    </div>
  );
}

// Memoized: panning and dragging other nodes do not redraw a card.
const NodeView = memo(NodeViewImpl) as typeof NodeViewImpl;

/* ---------- Edges ---------- */

interface EdgeShape {
  edge: CanvasEdge;
  d: string;
  mid: CanvasPoint;
  source: CanvasEdgeEnd;
  target: CanvasEdgeEnd;
  disabled: boolean;
  straight: boolean;
  label: string;
}

function edgeStroke(shape: EdgeShape, hovered: boolean): { className: string; width: number; dash?: string } {
  const { edge } = shape;
  if (shape.disabled) return { className: 'stroke-fg-4/40', width: 1.5, dash: '2 6' };
  if (edge.selected) return { className: 'stroke-accent', width: 2 };
  if (edge.status === 'error') return { className: 'stroke-danger', width: 2 };
  if (edge.status === 'running') return { className: 'stroke-accent/35', width: 2 };
  if (edge.status === 'waiting') return { className: 'stroke-fg-4', width: 1.5, dash: '4 4' };
  if (hovered) return { className: 'stroke-fg-2', width: 2.5 };
  return { className: 'stroke-fg-4', width: 1.5 };
}

/** Draggable ends of the selected edge: drop one on another port to reconnect. */
function EdgeEnds({ shape, zoom, events }: { shape: EdgeShape; zoom: number; events: NodeEvents }) {
  return (['source', 'target'] as const).map((end) => (
    <circle
      key={end}
      data-slot="node-canvas-edge-end"
      data-end={end}
      cx={shape[end].point.x}
      cy={shape[end].point.y}
      r={6 / zoom}
      className="cursor-move fill-surface-1 stroke-accent"
      strokeWidth={2}
      vectorEffect="non-scaling-stroke"
      onPointerDown={(event) => events.edgeEndPointerDown(event, shape.edge, end)}
    />
  ));
}

/* ---------- Canvas ---------- */

interface DragPreview {
  ids: readonly string[];
  /** Moved nodes and everything inside them. */
  affected: ReadonlySet<string>;
  dx: number;
  dy: number;
  guides: readonly CanvasGuide[];
  gaps: readonly CanvasGapMark[];
  primary: string;
  dropTarget: string | null;
}

interface Connecting {
  fixed: { nodeId: string; port: CanvasPort };
  from: CanvasEdgeEnd;
  cursor: CanvasPoint;
  snap: { nodeId: string; portId: string; point: CanvasPoint } | null;
  valid: ReadonlyMap<string, ReadonlySet<string>>;
  reconnect?: { edgeId: string };
}

interface Marquee {
  lasso: boolean;
  points: readonly CanvasPoint[];
  hits: number;
}

/**
 * Node graph editor surface: pan, zoom, drag, connect, select, snap, group, lay out. Controlled by `nodes`/`edges`
 * and `onGraphChange`; cards come from `renderNode`, the canvas draws ports, edges, the grid and the helpers.
 */
export function NodeCanvas<TData = unknown>({
  'aria-label': ariaLabel,
  nodes,
  edges,
  onGraphChange,
  renderNode,
  nodeLabel,
  renderNodeToolbar,
  renderEdgeToolbar,
  viewport: viewportProp,
  defaultViewport,
  onViewportChange,
  minZoom = 0.1,
  maxZoom = 4,
  edgePath = 'bezier',
  background = 'dots',
  gridSize = 20,
  snapToGrid = true,
  tool = 'select',
  readOnly = false,
  highlightedIds,
  isValidConnection,
  onConnect,
  onInsertOnEdge,
  onRequestInsert,
  renderEmpty,
  onSelectionChange,
  onBeforeDelete,
  onUndo,
  onRedo,
  ref,
  children,
  className,
}: NodeCanvasProps<TData>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const arrowId = useId();
  const [overlay, setOverlay] = useState<HTMLDivElement | null>(null);
  const [viewport, setViewportState] = useControllable(viewportProp, defaultViewport ?? INITIAL_VIEWPORT, onViewportChange);
  const viewportRef = useRef(viewport);
  const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const [sizes, setSizes] = useState<ReadonlyMap<string, CanvasSize>>(() => new Map());
  const [drag, setDrag] = useState<DragPreview | null>(null);
  const [resizing, setResizing] = useState<{ id: string; rect: CanvasRect } | null>(null);
  const [connecting, setConnecting] = useState<Connecting | null>(null);
  const [marquee, setMarquee] = useState<Marquee | null>(null);
  const [animated, setAnimated] = useState<ReadonlyMap<string, CanvasPoint> | null>(null);
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);
  const [editingEdge, setEditingEdge] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [lockedState, setLocked] = useState(false);
  const [message, setMessage] = useState('');
  const reduced = useReducedMotion();
  const locked = readOnly || lockedState || !onGraphChange;

  const elements = useRef(new Map<string, HTMLDivElement>());
  const edgeElements = useRef(new Map<string, SVGGElement>());
  const observer = useRef<ResizeObserver | null>(null);
  const touches = useRef(new Map<number, CanvasPoint>());
  const spaceDown = useRef(false);
  const pasteCount = useRef(0);
  // The step that ] / [ walk around, so Esc on one of its edges goes back to it.
  const walkAnchor = useRef<string | null>(null);
  const clipboard = useRef<CanvasGraph<TData> | null>(null);
  const stopView = useRef<() => void>(() => {});
  const layoutRun = useRef<(options: CanvasLayoutOptions & { fit?: boolean }, duration: number) => void>(() => {});
  // The view belongs to the host or the user once either sets it; until then the graph is refitted to the canvas size.
  const fitted = useRef(viewportProp !== undefined || defaultViewport !== undefined);
  const autoFitting = useRef(false);

  /* ----- derived graph ----- */

  const byId = useMemo(() => new Map<string, CanvasNode<TData>>(nodes.map((node) => [node.id, node])), [nodes]);
  const hidden = useMemo(() => hiddenNodeIds(nodes), [nodes]);
  const highlighted = useMemo(() => new Set(highlightedIds ?? []), [highlightedIds]);
  const baseRects = useMemo(() => absoluteRects(nodes, sizes, animated ?? undefined), [nodes, sizes, animated]);
  const rects = useMemo(() => {
    if (!drag && !resizing) return baseRects;
    const out = new Map(baseRects);
    if (drag) for (const id of drag.affected) {
      const rect = baseRects.get(id);
      if (rect) out.set(id, { ...rect, x: rect.x + drag.dx, y: rect.y + drag.dy });
    }
    if (resizing) out.set(resizing.id, resizing.rect);
    return out;
  }, [baseRects, drag, resizing]);
  const order = useMemo(() => flowOrder({ nodes, edges }), [nodes, edges]);
  const counts = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    const add = (nodeId: string, portId: string) => {
      const ports = map.get(nodeId) ?? new Map<string, number>();
      ports.set(portId, (ports.get(portId) ?? 0) + 1);
      map.set(nodeId, ports);
    };
    for (const edge of edges) {
      add(edge.source, edge.sourcePort);
      add(edge.target, edge.targetPort);
    }
    return map;
  }, [edges]);
  const label = useCallback((node: CanvasNode<TData>) => nodeLabel?.(node) ?? node.id, [nodeLabel]);

  const big = nodes.length >= CULL_FROM;
  const viewRect = useMemo<CanvasRect>(() => {
    const topLeft = toGraph({ x: -CULL_MARGIN, y: -CULL_MARGIN }, viewport);
    return { ...topLeft, width: (size.width + CULL_MARGIN * 2) / viewport.zoom, height: (size.height + CULL_MARGIN * 2) / viewport.zoom };
  }, [viewport, size]);
  const onScreen = (id: string): boolean => {
    if (!big || size.width === 0) return true;
    const rect = rects.get(id);
    return rect !== undefined && intersects(rect, viewRect);
  };

  const shapes = useMemo<EdgeShape[]>(() => {
    const obstacles = nodes.filter((node) => !hidden.has(node.id) && node.kind !== 'group').map((node) => ({ id: node.id, rect: rects.get(node.id) as CanvasRect }));
    return edges.flatMap((edge) => {
      const sourceId = visibleEnd(edge.source, byId, hidden);
      const targetId = visibleEnd(edge.target, byId, hidden);
      const sourceNode = byId.get(edge.source);
      const targetNode = byId.get(edge.target);
      const sourceRect = rects.get(sourceId);
      const targetRect = rects.get(targetId);
      const sourcePort = sourceNode?.ports.find((port) => port.id === edge.sourcePort);
      const targetPort = targetNode?.ports.find((port) => port.id === edge.targetPort);
      if (sourceId === targetId || !sourceNode || !targetNode || !sourceRect || !targetRect || !sourcePort || !targetPort) return [];
      const source: CanvasEdgeEnd = {
        point: sourceId === edge.source ? portPoint(sourceRect, sourcePort, sourceNode.ports) : sidePoint(sourceRect, sourcePort.side),
        side: sourcePort.side,
      };
      const target: CanvasEdgeEnd = {
        point: targetId === edge.target ? portPoint(targetRect, targetPort, targetNode.ports) : sidePoint(targetRect, targetPort.side),
        side: targetPort.side,
      };
      const kind = edge.path ?? edgePath;
      const around = kind === 'orthogonal' ? obstacles.filter((item) => item.id !== sourceId && item.id !== targetId).map((item) => item.rect) : [];
      const geometry = edgeGeometry(kind, source, target, around);
      const name = (node: CanvasNode<TData>) => label(node);
      return [
        {
          edge,
          ...geometry,
          source,
          target,
          disabled: Boolean(sourceNode.disabled || targetNode.disabled || edge.status === 'skipped'),
          straight: kind === 'straight',
          label: `Связь ${name(sourceNode)} → ${name(targetNode)}${edge.label ? ` «${edge.label}»` : ''}${edge.status && STATUS_LABEL[edge.status] ? `, ${STATUS_LABEL[edge.status]}` : ''}`,
        },
      ];
    });
  }, [edges, nodes, byId, hidden, rects, edgePath, label]);

  const selectedNodes = nodes.filter((node) => node.selected && !hidden.has(node.id));
  const selectedEdges = edges.filter((edge) => edge.selected);
  const zoom = viewport.zoom;
  const detail: CanvasDetail = zoom >= 0.6 ? 'full' : zoom >= 0.3 ? 'compact' : 'minimal';

  /* ----- latest values for event handlers and the API ----- */

  const latest = useRef({ nodes, edges, rects, byId, hidden, size });
  useLayoutEffect(() => {
    latest.current = { nodes, edges, rects, byId, hidden, size };
    viewportRef.current = viewport;
  });

  const setViewportState_ = useRef(setViewportState);
  useLayoutEffect(() => {
    setViewportState_.current = setViewportState;
  });
  const setViewport = useCallback((next: CanvasViewport) => {
    if (!autoFitting.current) fitted.current = true;
    viewportRef.current = next;
    setViewportState_.current(next);
  }, []);

  const announce = (text: string) => setMessage(text);

  const local = (event: { clientX: number; clientY: number }): CanvasPoint => {
    const box = rootRef.current?.getBoundingClientRect();
    return { x: event.clientX - (box?.left ?? 0), y: event.clientY - (box?.top ?? 0) };
  };

  const emit = (graph: CanvasGraph<TData>, change: CanvasChange) => {
    const before = selectionOf(latest.current);
    onGraphChange?.(graph, change);
    const after = selectionOf(graph);
    if (before.nodes.join() !== after.nodes.join() || before.edges.join() !== after.edges.join()) onSelectionChange?.(after);
  };

  const select = (nodeIds: ReadonlySet<string>, edgeIds: ReadonlySet<string>) => {
    const next = { nodes: nodes.map((node) => setSelected(node, nodeIds.has(node.id))), edges: edges.map((edge) => setSelected(edge, edgeIds.has(edge.id))) };
    if (next.nodes.every((node, index) => node === nodes[index]) && next.edges.every((edge, index) => edge === edges[index])) return;
    emit(next, { type: 'select', nodeIds: [...nodeIds], edgeIds: [...edgeIds] });
    const count = nodeIds.size + edgeIds.size;
    announce(count > 0 ? `Выделено: ${count}` : 'Выделение снято');
  };

  const selectedIds = () => new Set(nodes.filter((node) => node.selected).map((node) => node.id));
  const selectedEdgeIds = () => new Set(edges.filter((edge) => edge.selected).map((edge) => edge.id));

  /* ----- viewport and API ----- */

  const moveView = useCallback(
    (target: CanvasViewport, duration: number) => {
      stopView.current();
      const from = viewportRef.current;
      stopView.current = animate(duration, (t) =>
        setViewport({ x: lerp(from.x, target.x, t), y: lerp(from.y, target.y, t), zoom: lerp(from.zoom, target.zoom, t) }),
      );
    },
    [setViewport],
  );

  const api = useMemo<NodeCanvasApi>(() => {
    const center = (): CanvasPoint => ({ x: latest.current.size.width / 2, y: latest.current.size.height / 2 });
    const zoomTo = (value: number, options: CanvasMoveOptions = {}) =>
      moveView(zoomAt(viewportRef.current, clamp(value, minZoom, maxZoom), center()), options.duration ?? 0);
    return {
      fitView: ({ nodeIds, padding = FIT_PADDING, duration = MOVE_MS } = {}) => {
        const { nodes: all, rects: all_rects, hidden: hiddenNow, size: box } = latest.current;
        const ids = nodeIds ? new Set(nodeIds) : null;
        const bounds = boundsOf(all.filter((node) => !hiddenNow.has(node.id) && (!ids || ids.has(node.id))).flatMap((node) => all_rects.get(node.id) ?? []));
        if (!bounds || box.width === 0) return;
        moveView(fitViewport(bounds, box, padding, minZoom, maxZoom), duration);
      },
      zoomTo,
      zoomBy: (factor, options) => zoomTo(viewportRef.current.zoom * factor, options),
      centerOnNode: (id, { zoom: target, duration = MOVE_MS } = {}) => {
        const rect = latest.current.rects.get(id);
        if (!rect) return;
        const value = clamp(target ?? viewportRef.current.zoom, minZoom, maxZoom);
        const box = latest.current.size;
        moveView(
          { x: box.width / 2 - (rect.x + rect.width / 2) * value, y: box.height / 2 - (rect.y + rect.height / 2) * value, zoom: value },
          duration,
        );
      },
      setViewport: (next, { duration = 0 } = {}) => moveView(next, duration),
      getViewport: () => viewportRef.current,
      screenToGraph: (point) => {
        const box = rootRef.current?.getBoundingClientRect();
        return toGraph({ x: point.x - (box?.left ?? 0), y: point.y - (box?.top ?? 0) }, viewportRef.current);
      },
      layout: ({ duration = MOVE_MS, ...options } = {}) => layoutRun.current(options, duration),
    };
  }, [minZoom, maxZoom, moveView]);
  useImperativeHandle(ref, () => api, [api]);

  const runLayout = ({ fit = false, ...options }: CanvasLayoutOptions & { fit?: boolean }, duration: number) => {
    const graph = { nodes, edges };
    const next = layoutGraph(graph, { sizes, ...options });
    const laidOut = absoluteRects(next.nodes, sizes);
    const bounds = boundsOf(next.nodes.filter((node) => !hidden.has(node.id)).flatMap((node) => laidOut.get(node.id) ?? []));
    if (fit && bounds && size.width > 0) moveView(fitViewport(bounds, size, FIT_PADDING, minZoom, maxZoom), duration);
    const from = new Map(nodes.map((node) => [node.id, node.position]));
    const changed = next.nodes.filter((node, index) => node !== nodes[index]).map((node) => node.id);
    if (changed.length === 0) return;
    animate(
      duration,
      (t) =>
        setAnimated(
          new Map(
            next.nodes.map((node) => {
              const start = from.get(node.id) ?? node.position;
              return [node.id, { x: lerp(start.x, node.position.x, t), y: lerp(start.y, node.position.y, t) }];
            }),
          ),
        ),
      () => {
        setAnimated(null);
        emit(next, { type: 'layout', nodeIds: changed });
        announce(`Граф разложен: ${changed.length}`);
      },
    );
  };
  useLayoutEffect(() => {
    layoutRun.current = runLayout;
  });

  /* ----- measuring ----- */

  const register = useCallback((id: string, element: HTMLDivElement | null) => {
    const map = elements.current;
    const previous = map.get(id);
    if (previous && previous !== element) observer.current?.unobserve(previous);
    if (!element) {
      map.delete(id);
      return;
    }
    map.set(id, element);
    observer.current ??= new ResizeObserver((entries) => {
      setSizes((current) => {
        let next: Map<string, CanvasSize> | null = null;
        for (const entry of entries) {
          const target = entry.target as HTMLElement;
          const key = target.dataset.id;
          if (key === undefined) continue;
          const measured = { width: target.offsetWidth, height: target.offsetHeight };
          const known = current.get(key);
          if (known && known.width === measured.width && known.height === measured.height) continue;
          next ??= new Map(current);
          next.set(key, measured);
        }
        return next ?? current;
      });
    });
    observer.current.observe(element);
  }, []);

  useEffect(() => () => observer.current?.disconnect(), []);

  const registerEdge = useCallback((element: SVGGElement | null) => {
    const id = element?.dataset.id;
    if (!element || id === undefined) return undefined;
    edgeElements.current.set(id, element);
    return () => {
      edgeElements.current.delete(id);
    };
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const measure = () => setSize((current) => (current.width === root.clientWidth && current.height === root.clientHeight ? current : { width: root.clientWidth, height: root.clientHeight }));
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(root);
    return () => watch.disconnect();
  }, []);

  useEffect(() => {
    if (fitted.current || size.width === 0 || nodes.length === 0) return;
    autoFitting.current = true;
    api.fitView({ duration: 0 });
    autoFitting.current = false;
  }, [api, size, nodes.length]);

  /* ----- wheel: pan, ⌘/pinch zoom ----- */

  const onWheel = useEffectEvent((event: WheelEvent) => {
    if (event.target instanceof Element && event.target.closest('[data-canvas-panel]')) return;
    event.preventDefault();
    const current = viewportRef.current;
    const lines = event.deltaMode === 1 ? 20 : 1;
    if (event.ctrlKey || event.metaKey) {
      const factor = event.deltaMode === 1 ? (event.deltaY < 0 ? 1.1 : 1 / 1.1) : Math.exp(-event.deltaY * 0.01);
      setViewport(zoomAt(current, clamp(current.zoom * factor, minZoom, maxZoom), local(event)));
      return;
    }
    const sideways = event.shiftKey && event.deltaX === 0;
    setViewport({
      ...current,
      x: current.x - (sideways ? event.deltaY : event.deltaX) * lines,
      y: current.y - (sideways ? 0 : event.deltaY) * lines,
    });
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const listener = (event: WheelEvent) => onWheel(event);
    root.addEventListener('wheel', listener, { passive: false });
    return () => root.removeEventListener('wheel', listener);
  }, []);

  /* ----- connections ----- */

  const accepts = (connection: CanvasConnection, ignoreEdge?: string): boolean => {
    const others = edges.filter((edge) => edge.id !== ignoreEdge);
    const sourcePort = byId.get(connection.source)?.ports.find((port) => port.id === connection.sourcePort);
    const targetPort = byId.get(connection.target)?.ports.find((port) => port.id === connection.targetPort);
    if (!sourcePort || !targetPort) return false;
    const duplicate = others.some(
      (edge) =>
        edge.source === connection.source &&
        edge.sourcePort === connection.sourcePort &&
        edge.target === connection.target &&
        edge.targetPort === connection.targetPort,
    );
    if (duplicate) return false;
    if (!(targetPort.multiple ?? false) && others.some((edge) => edge.target === connection.target && edge.targetPort === connection.targetPort)) return false;
    if (!(sourcePort.multiple ?? true) && others.some((edge) => edge.source === connection.source && edge.sourcePort === connection.sourcePort)) return false;
    return isValidConnection ? isValidConnection(connection, { nodes, edges }) : sameType(sourcePort.type, targetPort.type);
  };

  const connect = (connection: CanvasConnection) => {
    if (onConnect) onConnect(connection);
    else {
      const edge: CanvasEdge = { id: edgeIdFor(connection), ...connection };
      emit({ nodes, edges: [...edges, edge] }, { type: 'connect', edgeIds: [edge.id] });
    }
    announce(`Связь создана: ${label(byId.get(connection.source) as CanvasNode<TData>)} → ${label(byId.get(connection.target) as CanvasNode<TData>)}`);
  };

  const startConnect = (event: ReactPointerEvent, fixed: { nodeId: string; port: CanvasPort }, reconnect?: { edgeId: string }) => {
    const fixedNode = byId.get(fixed.nodeId);
    const fixedRect = rects.get(fixed.nodeId);
    if (!fixedNode || !fixedRect) return;
    const valid = new Map<string, Set<string>>();
    for (const node of nodes) {
      if (hidden.has(node.id)) continue;
      for (const port of node.ports) {
        const connection = connectionFor(fixed, { nodeId: node.id, port });
        if (!connection || !accepts(connection, reconnect?.edgeId)) continue;
        const ports = valid.get(node.id) ?? new Set<string>();
        ports.add(port.id);
        valid.set(node.id, ports);
      }
    }
    const from: CanvasEdgeEnd = { point: portPoint(fixedRect, fixed.port, fixedNode.ports), side: fixed.port.side };
    const start: Connecting = { fixed, from, cursor: from.point, snap: null, valid, reconnect };
    setConnecting(start);
    let current = start;
    track(event, {
      move: (move) => {
        const zoomNow = viewportRef.current.zoom;
        const cursor = toGraph(local(move), viewportRef.current);
        let snap: Connecting['snap'] = null;
        let best = MAGNET_PX / zoomNow;
        for (const [nodeId, ports] of valid) {
          const node = byId.get(nodeId);
          const rect = rects.get(nodeId);
          if (!node || !rect) continue;
          for (const port of node.ports) {
            if (!ports.has(port.id)) continue;
            const point = portPoint(rect, port, node.ports);
            const distance = Math.hypot(point.x - cursor.x, point.y - cursor.y);
            if (distance <= best) {
              best = distance;
              snap = { nodeId, portId: port.id, point };
            }
          }
        }
        current = { ...current, cursor, snap };
        setConnecting(current);
      },
      end: (up, moved) => {
        setConnecting(null);
        if (!up || !moved) return;
        let target = current.snap ? { nodeId: current.snap.nodeId, portId: current.snap.portId } : null;
        // Dropped on a card: its first port that fits, or nothing when none does.
        const over = target
          ? undefined
          : [...nodes].reverse().find((node) => !hidden.has(node.id) && node.kind !== 'group' && containsPoint(rects.get(node.id) as CanvasRect, current.cursor));
        const portId = over ? [...(valid.get(over.id) ?? [])][0] : undefined;
        if (over && portId !== undefined) target = { nodeId: over.id, portId };
        if (over && !target) return;
        if (target) {
          const port = byId.get(target.nodeId)?.ports.find((item) => item.id === target.portId);
          const connection = port ? connectionFor(fixed, { nodeId: target.nodeId, port }) : null;
          if (!connection) return;
          if (reconnect) {
            emit(
              { nodes, edges: edges.map((edge) => (edge.id === reconnect.edgeId ? { ...edge, ...connection } : edge)) },
              { type: 'reconnect', edgeIds: [reconnect.edgeId] },
            );
            announce('Связь перецеплена');
          } else connect(connection);
          return;
        }
        if (!reconnect) onRequestInsert?.({ position: current.cursor, from: { nodeId: fixed.nodeId, portId: fixed.port.id } });
      },
    });
  };

  /* ----- deleting, copying ----- */

  const removeItems = async (nodeIds: ReadonlySet<string>, edgeIds: ReadonlySet<string>) => {
    if (locked || (nodeIds.size === 0 && edgeIds.size === 0)) return;
    const all = new Set(nodeIds);
    for (const node of nodes) if ([...nodeIds].some((id) => isInside(node.id, id, byId))) all.add(node.id);
    const removedEdges = edges.filter((edge) => edgeIds.has(edge.id) || all.has(edge.source) || all.has(edge.target));
    const selection = { nodes: [...all], edges: removedEdges.map((edge) => edge.id) };
    if (onBeforeDelete && !(await onBeforeDelete(selection))) return;
    const now = latest.current;
    const gone = new Set(selection.edges);
    emit(
      { nodes: now.nodes.filter((node) => !all.has(node.id)), edges: now.edges.filter((edge) => !gone.has(edge.id)) },
      { type: 'delete', nodeIds: selection.nodes, edgeIds: selection.edges },
    );
    announce(`Удалено: ${selection.nodes.length + selection.edges.length}`);
    rootRef.current?.focus({ preventScroll: true });
  };

  const copy = (): number => {
    const roots = new Set(nodes.filter((node) => node.selected).map((node) => node.id));
    const copied = nodes.filter((node) => roots.has(node.id) || [...roots].some((id) => isInside(node.id, id, byId)));
    if (copied.length === 0) return 0;
    const ids = new Set(copied.map((node) => node.id));
    clipboard.current = {
      // Nodes whose group stays behind are pasted at their absolute place.
      nodes: copied.map((node) => {
        if (node.parentId === undefined || ids.has(node.parentId)) return node;
        const rect = rects.get(node.id);
        return { ...node, parentId: undefined, position: rect ? { x: rect.x, y: rect.y } : node.position };
      }),
      edges: edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target)),
    };
    pasteCount.current = 0;
    announce(`Скопировано: ${copied.length}`);
    return copied.length;
  };

  const paste = () => {
    const source = clipboard.current;
    if (!source || locked) return;
    pasteCount.current += 1;
    const shift = gridSize * pasteCount.current;
    const ids = new Map(source.nodes.map((node) => [node.id, newId()]));
    const pasted = source.nodes.map((node): CanvasNode<TData> => {
      const parentId = node.parentId === undefined ? undefined : ids.get(node.parentId);
      return {
        ...node,
        id: ids.get(node.id) as string,
        parentId,
        position: parentId === undefined ? { x: node.position.x + shift, y: node.position.y + shift } : node.position,
        selected: true,
      };
    });
    const pastedEdges = source.edges.map((edge) => ({
      ...edge,
      id: newId(),
      source: ids.get(edge.source) as string,
      target: ids.get(edge.target) as string,
      selected: false,
    }));
    emit(
      { nodes: [...nodes.map((node) => setSelected(node, false)), ...pasted], edges: [...edges.map((edge) => setSelected(edge, false)), ...pastedEdges] },
      { type: 'paste', nodeIds: pasted.map((node) => node.id), edgeIds: pastedEdges.map((edge) => edge.id) },
    );
    announce(`Вставлено: ${pasted.length}`);
  };

  const nudge = (ids: ReadonlySet<string>, dx: number, dy: number) => {
    const top = [...ids].filter((id) => ![...ids].some((other) => isInside(id, other, byId)));
    const moving = new Set(top);
    emit(
      { nodes: nodes.map((node) => (moving.has(node.id) ? { ...node, position: { x: node.position.x + dx, y: node.position.y + dy } } : node)), edges },
      { type: 'move', nodeIds: top, mergeKey: 'nudge' },
    );
  };

  /* ----- pointer: pane ----- */

  const startPan = (event: ReactPointerEvent) => {
    let base = { viewport: viewportRef.current, x: event.clientX, y: event.clientY };
    let pinch: { distance: number; mid: CanvasPoint; viewport: CanvasViewport } | null = null;
    const active = touches.current;
    const onMove = (move: PointerEvent) => {
      if (move.pointerType === 'touch') {
        if (!active.has(move.pointerId)) return;
        active.set(move.pointerId, local(move));
      } else if (move.pointerId !== event.pointerId) return;
      if (active.size >= 2) {
        const [a, b] = [...active.values()] as [CanvasPoint, CanvasPoint];
        const distance = Math.hypot(b.x - a.x, b.y - a.y);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (!pinch) {
          pinch = { distance, mid, viewport: viewportRef.current };
          return;
        }
        const value = clamp((pinch.viewport.zoom * distance) / Math.max(pinch.distance, 1), minZoom, maxZoom);
        const zoomed = zoomAt(pinch.viewport, value, pinch.mid);
        setViewport({ zoom: value, x: zoomed.x + mid.x - pinch.mid.x, y: zoomed.y + mid.y - pinch.mid.y });
        return;
      }
      if (pinch) {
        pinch = null;
        base = { viewport: viewportRef.current, x: move.clientX, y: move.clientY };
      }
      setViewport({ ...base.viewport, x: base.viewport.x + move.clientX - base.x, y: base.viewport.y + move.clientY - base.y });
    };
    const onUp = (up: PointerEvent) => {
      active.delete(up.pointerId);
      if (up.pointerType === 'touch' ? active.size > 0 : up.pointerId !== event.pointerId) return;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const marqueeHits = (lasso: boolean, points: readonly CanvasPoint[]): Set<string> => {
    const hits = new Set<string>();
    const [a, b] = [points[0], points.at(-1)] as [CanvasPoint, CanvasPoint];
    const box = { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) };
    for (const node of nodes) {
      const rect = rects.get(node.id);
      if (!rect || hidden.has(node.id)) continue;
      const corners = [
        { x: rect.x, y: rect.y },
        { x: rect.x + rect.width, y: rect.y },
        { x: rect.x, y: rect.y + rect.height },
        { x: rect.x + rect.width, y: rect.y + rect.height },
      ];
      const inside = lasso ? corners.every((corner) => pointInPolygon(corner, points)) : corners.every((corner) => containsPoint(box, corner));
      // The frame takes what it touches; groups and the lasso only what they enclose.
      if (inside || (!lasso && node.kind !== 'group' && intersects(rect, box))) hits.add(node.id);
    }
    return hits;
  };

  const onPanePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest('[data-canvas-panel],[data-slot=node-canvas-toolbar]')) return;
    if (event.pointerType === 'touch') {
      touches.current.set(event.pointerId, local(event));
      if (touches.current.size > 1) return;
    }
    if (event.button === 1 || tool === 'pan' || spaceDown.current || event.pointerType === 'touch') {
      event.preventDefault();
      startPan(event);
      return;
    }
    if (event.button !== 0) return;
    const lasso = event.altKey;
    const additive = event.shiftKey;
    const keepNodes = additive ? selectedIds() : NO_IDS;
    const keepEdges = additive ? selectedEdgeIds() : NO_IDS;
    const start = toGraph(local(event), viewportRef.current);
    let points: CanvasPoint[] = [start];
    track(event, {
      move: (move) => {
        const point = toGraph(local(move), viewportRef.current);
        points = lasso ? [...points, point] : [start, point];
        setMarquee({ lasso, points, hits: marqueeHits(lasso, points).size });
      },
      end: (up, moved) => {
        setMarquee(null);
        if (!up) return;
        if (!moved) {
          if (!additive) select(NO_IDS, NO_IDS);
          return;
        }
        select(new Set([...keepNodes, ...marqueeHits(lasso, points)]), keepEdges);
      },
    });
  };

  const onPaneDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest('[data-slot=node-canvas-node],[data-slot=node-canvas-edge],[data-canvas-panel],[data-slot=node-canvas-toolbar],[data-slot=node-canvas-edge-label]')) return;
    if (readOnly || !onRequestInsert) return;
    onRequestInsert({ position: toGraph(local(event), viewportRef.current) });
  };

  /* ----- pointer: nodes, ports, handles, edges ----- */

  const onNodePointerDown = (event: ReactPointerEvent<HTMLDivElement>, id: string) => {
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    event.stopPropagation();
    const target = event.target as Element;
    if (target !== event.currentTarget && target.closest('button, a, input, textarea, select, [contenteditable="true"], [data-canvas-nodrag]')) return;
    const node = byId.get(id);
    if (!node) return;
    const was = node.selected ?? false;
    const current = selectedIds();
    const additive = event.shiftKey || event.metaKey || event.ctrlKey;
    if (!was) select(additive ? new Set([...current, id]) : new Set([id]), additive ? selectedEdgeIds() : NO_IDS);
    const chosen = was ? current : additive ? new Set([...current, id]) : new Set([id]);
    const moving = [...chosen].filter((item) => !hidden.has(item) && ![...chosen].some((other) => isInside(item, other, byId)));
    const affected = new Set(nodes.filter((item) => moving.some((root) => root === item.id || isInside(item.id, root, byId))).map((item) => item.id));
    const primary = rects.get(id) as CanvasRect;
    const others = nodes.filter((item) => !affected.has(item.id) && !hidden.has(item.id) && item.kind !== 'group').flatMap((item) => rects.get(item.id) ?? []);
    const origin = local(event);
    let last: DragPreview | null = null;
    track(event, {
      move: (move) => {
        if (locked) return;
        const view = viewportRef.current;
        const point = local(move);
        const proposed = { ...primary, x: primary.x + (point.x - origin.x) / view.zoom, y: primary.y + (point.y - origin.y) / view.zoom };
        const free = move.metaKey || move.ctrlKey;
        const snapped = free ? { x: proposed.x, y: proposed.y, guides: [], gaps: [] } : snapRect(proposed, others, { grid: snapToGrid ? gridSize : 0, threshold: SNAP_PX / view.zoom });
        const center = { x: snapped.x + primary.width / 2, y: snapped.y + primary.height / 2 };
        const dropTarget =
          moving.length === 1
            ? (nodes
                .filter((item) => item.kind === 'group' && !item.collapsed && !affected.has(item.id) && !hidden.has(item.id) && containsPoint(rects.get(item.id) as CanvasRect, center))
                .sort((a, b) => {
                  const ra = rects.get(a.id) as CanvasRect;
                  const rb = rects.get(b.id) as CanvasRect;
                  return ra.width * ra.height - rb.width * rb.height;
                })[0]?.id ?? null)
            : null;
        last = { ids: moving, affected, dx: snapped.x - primary.x, dy: snapped.y - primary.y, guides: snapped.guides, gaps: snapped.gaps, primary: id, dropTarget };
        setDrag(last);
      },
      end: (up, moved) => {
        setDrag(null);
        const preview = last;
        if (!up) return;
        if (!moved || !preview) {
          if (was && additive) {
            const next = new Set(current);
            next.delete(id);
            select(next, selectedEdgeIds());
          } else if (was && current.size > 1) select(new Set([id]), NO_IDS);
          return;
        }
        const movingSet = new Set(preview.ids);
        const single = preview.ids.length === 1 ? byId.get(preview.ids[0] as string) : undefined;
        // A single node joins the group it is dropped in and leaves its group when dropped outside.
        let nextParent = single?.parentId;
        if (preview.dropTarget !== null) nextParent = preview.dropTarget;
        else if (nextParent !== undefined) {
          const parentRect = baseRects.get(nextParent);
          const center = { x: primary.x + preview.dx + primary.width / 2, y: primary.y + preview.dy + primary.height / 2 };
          if (parentRect && !containsPoint(parentRect, center)) nextParent = undefined;
        }
        emit(
          {
            nodes: nodes.map((item) => {
              if (!movingSet.has(item.id)) return item;
              const moved = { x: item.position.x + preview.dx, y: item.position.y + preview.dy };
              if (!single || nextParent === item.parentId) return { ...item, position: moved };
              const rect = baseRects.get(item.id) as CanvasRect;
              const parent = nextParent === undefined ? { x: 0, y: 0 } : (baseRects.get(nextParent) as CanvasRect);
              return { ...item, parentId: nextParent, position: { x: rect.x + preview.dx - parent.x, y: rect.y + preview.dy - parent.y } };
            }),
            edges,
          },
          { type: 'move', nodeIds: preview.ids },
        );
      },
    });
  };

  const onPortPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, nodeId: string, portId: string) => {
    event.stopPropagation();
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    const port = byId.get(nodeId)?.ports.find((item) => item.id === portId);
    if (!port || locked) return;
    event.preventDefault();
    startConnect(event, { nodeId, port });
  };

  const onPortKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, nodeId: string, portId: string) => {
    if (event.key !== 'Enter' || locked) return;
    event.preventDefault();
    event.stopPropagation();
    const port = byId.get(nodeId)?.ports.find((item) => item.id === portId);
    const other = nodes.find((node) => node.selected && node.id !== nodeId);
    if (!port || !other) {
      announce('Выделите шаг, с которым связать этот порт');
      return;
    }
    for (const candidate of other.ports) {
      const connection = connectionFor({ nodeId: other.id, port: candidate }, { nodeId, port });
      if (connection && accepts(connection)) {
        connect(connection);
        return;
      }
    }
    announce('У выделенного шага нет подходящего порта');
  };

  const onResizePointerDown = (event: ReactPointerEvent<HTMLSpanElement>, id: string, handle: ResizeHandle) => {
    event.stopPropagation();
    event.preventDefault();
    const node = byId.get(id);
    const start = rects.get(id);
    if (!node || !start || locked) return;
    const origin = local(event);
    let last: CanvasRect | null = null;
    track(event, {
      move: (move) => {
        const view = viewportRef.current;
        const point = local(move);
        const dx = (point.x - origin.x) / view.zoom;
        const dy = (point.y - origin.y) / view.zoom;
        const free = move.metaKey || move.ctrlKey || !snapToGrid;
        const snap = (value: number) => (free ? value : Math.round(value / gridSize) * gridSize);
        let left = start.x;
        let top = start.y;
        let right = start.x + start.width;
        let bottom = start.y + start.height;
        if (handle.includes('w')) left = Math.min(snap(start.x + dx), right - MIN_WIDTH);
        if (handle.includes('e')) right = Math.max(snap(right + dx), left + MIN_WIDTH);
        if (handle.includes('n')) top = Math.min(snap(start.y + dy), bottom - MIN_HEIGHT);
        if (handle.includes('s')) bottom = Math.max(snap(bottom + dy), top + MIN_HEIGHT);
        let width = right - left;
        let height = bottom - top;
        if (move.shiftKey) {
          const ratio = start.width / start.height;
          if (handle === 'n' || handle === 's') width = height * ratio;
          else height = width / ratio;
        }
        last = {
          x: handle.includes('w') ? start.x + start.width - width : left,
          y: handle.includes('n') ? start.y + start.height - height : top,
          width,
          height,
        };
        setResizing({ id, rect: last });
      },
      end: (up, moved) => {
        setResizing(null);
        const rect = last;
        if (!up || !moved || !rect) return;
        emit(
          {
            nodes: nodes.map((item) =>
              item.id === id
                ? { ...item, width: rect.width, height: rect.height, position: { x: item.position.x + rect.x - start.x, y: item.position.y + rect.y - start.y } }
                : item,
            ),
            edges,
          },
          { type: 'resize', nodeIds: [id] },
        );
      },
    });
  };

  const onEdgePointerDown = (event: ReactPointerEvent, id: string) => {
    event.stopPropagation();
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    edgeElements.current.get(id)?.focus({ preventScroll: true });
    const additive = event.shiftKey || event.metaKey || event.ctrlKey;
    const chosen = selectedEdgeIds();
    if (additive) {
      if (chosen.has(id)) chosen.delete(id);
      else chosen.add(id);
      select(selectedIds(), chosen);
    } else select(NO_IDS, new Set([id]));
  };

  const onEdgeEndPointerDown = (event: ReactPointerEvent<SVGCircleElement>, edge: CanvasEdge, end: 'source' | 'target') => {
    event.stopPropagation();
    if (locked) return;
    const nodeId = end === 'target' ? edge.source : edge.target;
    const portId = end === 'target' ? edge.sourcePort : edge.targetPort;
    const port = byId.get(nodeId)?.ports.find((item) => item.id === portId);
    if (port) startConnect(event, { nodeId, port }, { edgeId: edge.id });
  };

  const commitLabel = (edge: CanvasEdge, value: string) => {
    setEditingEdge(null);
    const text = value.trim();
    if (text === (edge.label ?? '')) return;
    emit({ nodes, edges: edges.map((item) => (item.id === edge.id ? { ...item, label: text || undefined } : item)) }, { type: 'label', edgeIds: [edge.id] });
  };

  const events = useRef<Omit<NodeEvents, 'register'> | null>(null);
  useLayoutEffect(() => {
    events.current = {
      nodePointerDown: onNodePointerDown,
      portPointerDown: onPortPointerDown,
      portKeyDown: onPortKeyDown,
      resizePointerDown: onResizePointerDown,
      edgeEndPointerDown: onEdgeEndPointerDown,
    };
  });
  const nodeEvents = useMemo<NodeEvents>(
    () => ({
      register,
      nodePointerDown: (event, id) => events.current?.nodePointerDown(event, id),
      portPointerDown: (event, nodeId, portId) => events.current?.portPointerDown(event, nodeId, portId),
      portKeyDown: (event, nodeId, portId) => events.current?.portKeyDown(event, nodeId, portId),
      resizePointerDown: (event, id, handle) => events.current?.resizePointerDown(event, id, handle),
      edgeEndPointerDown: (event, edge, end) => events.current?.edgeEndPointerDown(event, edge, end),
    }),
    [register],
  );

  /* ----- keyboard ----- */

  const focusNode = (id: string) => elements.current.get(id)?.focus({ preventScroll: false });

  /** The step an edge was walked from with ] / [, else its source. */
  const edgeAnchor = (edgeId: string | undefined): string | undefined => {
    const edge = edgeId === undefined ? undefined : edges.find((item) => item.id === edgeId);
    if (!edge) return undefined;
    const anchor = walkAnchor.current;
    return anchor === edge.source || anchor === edge.target ? anchor : edge.source;
  };

  const neighbour = (from: string, dx: number, dy: number): string | undefined => {
    const origin = rects.get(from);
    if (!origin) return undefined;
    const cx = origin.x + origin.width / 2;
    const cy = origin.y + origin.height / 2;
    let best: { id: string; score: number } | undefined;
    for (const node of nodes) {
      const rect = rects.get(node.id);
      if (node.id === from || !rect || hidden.has(node.id)) continue;
      const ox = rect.x + rect.width / 2 - cx;
      const oy = rect.y + rect.height / 2 - cy;
      const along = ox * dx + oy * dy;
      if (along <= 0) continue;
      const score = along + 2 * Math.abs(ox * dy + oy * dx);
      if (!best || score < best.score) best = { id: node.id, score };
    }
    return best?.id;
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const target = event.target as Element;
    const onRoot = target === rootRef.current;
    if (!onRoot && !target.hasAttribute('data-canvas-focus')) return;
    if (isEditable(target)) return;
    const nodeElement = target.closest<HTMLElement>('[data-slot=node-canvas-node]');
    const focusedNode = nodeElement?.dataset.id;
    const edgeElement = target.closest<SVGGElement>('[data-slot=node-canvas-edge]');
    const focusedEdge = edgeElement?.dataset.id;
    const mod = event.metaKey || event.ctrlKey;
    const key = event.key;
    const handled = () => {
      event.preventDefault();
      event.stopPropagation();
    };

    if (mod && !event.altKey) {
      const letter = key.toLowerCase();
      if (letter === 'a') {
        handled();
        select(new Set(nodes.filter((node) => !hidden.has(node.id)).map((node) => node.id)), new Set(edges.map((edge) => edge.id)));
      } else if (letter === 'c') {
        handled();
        copy();
      } else if (letter === 'x') {
        handled();
        if (copy() > 0) void removeItems(selectedIds(), NO_IDS);
      } else if (letter === 'v') {
        handled();
        paste();
      } else if (letter === 'z') {
        handled();
        if (event.shiftKey) onRedo?.();
        else onUndo?.();
      } else if (letter === 'y') {
        handled();
        onRedo?.();
      } else if (key === '=' || key === '+') {
        handled();
        api.zoomBy(ZOOM_STEP);
      } else if (key === '-') {
        handled();
        api.zoomBy(1 / ZOOM_STEP);
      } else if (key === '0') {
        handled();
        api.zoomTo(1);
      }
      return;
    }

    if (event.shiftKey && !event.altKey && (event.code === 'Digit1' || event.code === 'Digit2' || event.code === 'Digit0' || event.code === 'KeyL')) {
      handled();
      if (event.code === 'Digit1') api.fitView();
      else if (event.code === 'Digit2') api.fitView({ nodeIds: selectedNodes.map((node) => node.id) });
      else if (event.code === 'Digit0') api.zoomTo(1);
      else if (!locked) {
        const ids = selectedNodes.map((node) => node.id);
        api.layout(ids.length > 1 ? { nodeIds: ids } : {});
      }
      return;
    }

    // ] / [ by key position, so ъ / х on a Russian layout work too; ⌥Tab stays as an alias.
    const walk = event.code === 'BracketRight' ? 1 : event.code === 'BracketLeft' ? -1 : key === 'Tab' && event.altKey ? (event.shiftKey ? -1 : 1) : 0;
    if (walk !== 0 && (focusedNode || focusedEdge)) {
      handled();
      const anchorId = focusedNode ?? edgeAnchor(focusedEdge);
      const anchor = anchorId === undefined ? undefined : elements.current.get(anchorId);
      if (!anchor || anchorId === undefined) return;
      walkAnchor.current = anchorId;
      const list: Element[] = [
        anchor,
        ...anchor.querySelectorAll('[data-slot=node-canvas-port]'),
        ...edges.filter((edge) => edge.source === anchorId || edge.target === anchorId).flatMap((edge) => edgeElements.current.get(edge.id) ?? []),
      ];
      const index = list.indexOf(target);
      const next = list[(index + walk + list.length) % list.length];
      if (next instanceof HTMLElement || next instanceof SVGElement) next.focus();
      return;
    }

    switch (key) {
      case 'Delete':
      case 'Backspace': {
        handled();
        const nodeIds = selectedIds();
        const edgeIds = selectedEdgeIds();
        if (nodeIds.size === 0 && edgeIds.size === 0) {
          if (focusedNode) nodeIds.add(focusedNode);
          else if (focusedEdge) edgeIds.add(focusedEdge);
        }
        void removeItems(nodeIds, edgeIds);
        return;
      }
      case 'Escape': {
        handled();
        // Out of a port or an edge back to its step; then the selection goes; then focus goes back to the canvas.
        const edgeHome = edgeAnchor(focusedEdge);
        if (nodeElement && target !== nodeElement) nodeElement.focus();
        else if (edgeHome !== undefined) focusNode(edgeHome);
        else if (selectedNodes.length > 0 || selectedEdges.length > 0) select(NO_IDS, NO_IDS);
        else rootRef.current?.focus();
        return;
      }
      case 'Enter':
      case ' ':
        if (focusedNode && target === nodeElement) {
          handled();
          const current = selectedIds();
          if (event.shiftKey) {
            if (current.has(focusedNode)) current.delete(focusedNode);
            else current.add(focusedNode);
            select(current, selectedEdgeIds());
          } else select(new Set([focusedNode]), NO_IDS);
        } else if (focusedEdge) {
          handled();
          select(NO_IDS, new Set([focusedEdge]));
        } else if (onRoot && key === 'Enter' && onRequestInsert && !readOnly) {
          handled();
          const from = selectedNodes.length === 1 ? { nodeId: (selectedNodes[0] as CanvasNode<TData>).id } : undefined;
          onRequestInsert({ position: toGraph({ x: size.width / 2, y: size.height / 2 }, viewportRef.current), from });
        }
        return;
      case '+':
      case 'Insert':
        if (focusedEdge && onInsertOnEdge && !locked) {
          handled();
          const shape = shapes.find((item) => item.edge.id === focusedEdge);
          if (shape) onInsertOnEdge(shape.edge, shape.mid);
        }
        return;
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown': {
        const dx = key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : 0;
        const dy = key === 'ArrowUp' ? -1 : key === 'ArrowDown' ? 1 : 0;
        handled();
        const ids = selectedIds();
        // A step that only has focus is not moved: arrows walk to the neighbour, as ⌥ and arrows do.
        if (event.altKey || (focusedNode && target === nodeElement && !ids.has(focusedNode))) {
          const from = focusedNode ?? selectedNodes[0]?.id;
          const next = from === undefined ? order.find((id) => !hidden.has(id)) : neighbour(from, dx, dy);
          if (next !== undefined) focusNode(next);
          return;
        }
        if (ids.size > 0) {
          if (locked) return;
          const step = event.shiftKey ? NUDGE_SHIFT : NUDGE;
          nudge(ids, dx * step, dy * step);
          announce(`Сдвинуто на ${step}`);
        } else if (onRoot) {
          const step = event.shiftKey ? 200 : 40;
          setViewport({ ...viewportRef.current, x: viewportRef.current.x - dx * step, y: viewportRef.current.y - dy * step });
        }
        return;
      }
      default:
        return;
    }
  };

  const onKeyUpOrDown = (event: ReactKeyboardEvent<HTMLDivElement>, down: boolean) => {
    if (event.key === ' ' && !isEditable(event.target) && event.target === rootRef.current) spaceDown.current = down;
  };

  /* ----- render ----- */

  const connectingValid = connecting?.valid;
  const depth = (id: string) => nodes.filter((node) => isInside(id, node.id, byId)).length;
  const groups = nodes.filter((node) => node.kind === 'group' && !hidden.has(node.id)).sort((a, b) => depth(a.id) - depth(b.id));
  const steps = order.map((id) => byId.get(id) as CanvasNode<TData>).filter((node) => node.kind !== 'group' && !hidden.has(node.id));

  const renderView = (node: CanvasNode<TData>) => {
    if (!onScreen(node.id) && !node.selected && node.id !== focusedId) return null;
    const rect = rects.get(node.id) as CanvasRect;
    const selected = node.selected ?? false;
    return (
      <NodeView<TData>
        key={node.id}
        node={node}
        x={rect.x}
        y={rect.y}
        label={label(node)}
        hintId={hintId}
        selected={selected}
        dragging={drag?.affected.has(node.id) ?? false}
        highlighted={highlighted.has(node.id)}
        dimmed={connecting !== null && node.id !== connecting.fixed.nodeId && !connectingValid?.has(node.id)}
        dropTarget={drag?.dropTarget === node.id}
        detail={detail}
        showPorts={!readOnly}
        handles={selected && selectedNodes.length === 1 && isResizable(node) && !locked}
        counts={counts.get(node.id) ?? NO_COUNTS}
        compatible={connectingValid?.get(node.id) ?? NO_PORTS}
        snapped={connecting?.snap?.nodeId === node.id ? connecting.snap.portId : null}
        renderNode={renderNode}
        events={nodeEvents}
      />
    );
  };

  const screen = (point: CanvasPoint) => toScreen(point, viewport);
  const selectionBox = boundsOf(selectedNodes.flatMap((node) => rects.get(node.id) ?? []));
  const singleEdge = selectedEdges.length === 1 && selectedNodes.length === 0 ? shapes.find((shape) => shape.edge.id === selectedEdges[0]?.id) : undefined;
  const busy = drag !== null || connecting !== null || marquee !== null || resizing !== null;
  const dragRect = drag ? rects.get(drag.primary) : undefined;

  const contextValue: CanvasContextValue = {
    api,
    viewport,
    size,
    nodes,
    rects,
    hidden,
    highlighted,
    minZoom,
    maxZoom,
    locked,
    readOnly: readOnly || !onGraphChange,
    setLocked,
    overlay,
  };

  return (
    <CanvasContext value={contextValue}>
      <div
        ref={rootRef}
        data-slot="node-canvas"
        data-tool={tool}
        data-locked={locked || undefined}
        data-connecting={connecting ? '' : undefined}
        role="application"
        aria-roledescription="канвас"
        aria-label={ariaLabel}
        aria-describedby={hintId}
        tabIndex={nodes.length === 0 ? 0 : -1}
        className={cn(
          'relative isolate touch-none select-none overflow-hidden bg-background focus-visible:-outline-offset-2',
          tool === 'pan' ? 'cursor-grab' : undefined,
          className,
        )}
        onPointerDown={onPanePointerDown}
        onDoubleClick={onPaneDoubleClick}
        onKeyDown={(event) => {
          onKeyUpOrDown(event, true);
          onKeyDown(event);
        }}
        onKeyUp={(event) => onKeyUpOrDown(event, false)}
        onFocusCapture={(event) => setFocusedId((event.target as Element).closest<HTMLElement>('[data-slot=node-canvas-node]')?.dataset.id ?? null)}
      >
        <CanvasBackdrop variant={background} gap={gridSize} viewport={viewport} />
        <div
          data-slot="node-canvas-viewport"
          className="absolute left-0 top-0 origin-top-left"
          style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${zoom})` }}
        >
          {groups.map(renderView)}
          <svg data-slot="node-canvas-edges" className="absolute left-0 top-0 overflow-visible" width={1} height={1}>
            <defs>
              <marker id={arrowId} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={8} markerHeight={8} orient="auto-start-reverse">
                <path d="M0 1L9 5L0 9" fill="none" stroke="context-stroke" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>
            {shapes.map((shape) => {
              const { edge } = shape;
              if (big && size.width > 0 && !intersects(boundsOf([{ ...shape.source.point, width: 0, height: 0 }, { ...shape.target.point, width: 0, height: 0 }]) as CanvasRect, viewRect)) return null;
              const hovered = hoverEdge === edge.id;
              const stroke = edgeStroke(shape, hovered);
              const running = edge.status === 'running' && !reduced && !big;
              return (
                <g
                  key={edge.id}
                  ref={registerEdge}
                  data-slot="node-canvas-edge"
                  data-canvas-focus=""
                  data-id={edge.id}
                  data-status={edge.status}
                  data-selected={edge.selected || undefined}
                  role="button"
                  aria-pressed={edge.selected ?? false}
                  aria-label={shape.label}
                  tabIndex={-1}
                  // A box ring around a curve says little: focus draws the edge in its hover look and shows «+».
                  className="outline-none"
                  onPointerDown={(event) => onEdgePointerDown(event, edge.id)}
                  onPointerEnter={() => setHoverEdge(edge.id)}
                  onPointerLeave={() => setHoverEdge((current) => (current === edge.id ? null : current))}
                  onFocus={() => setHoverEdge(edge.id)}
                  onBlur={() => setHoverEdge((current) => (current === edge.id ? null : current))}
                >
                  <path d={shape.d} className="fill-none stroke-transparent" strokeWidth={16} vectorEffect="non-scaling-stroke" pointerEvents="stroke" />
                  <path
                    data-slot="node-canvas-edge-path"
                    d={shape.d}
                    className={cn('pointer-events-none fill-none transition-[stroke,stroke-width] duration-quick ease-out', stroke.className)}
                    strokeWidth={stroke.width}
                    strokeDasharray={stroke.dash}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    markerEnd={shape.straight ? `url(#${arrowId})` : undefined}
                  />
                  {running
                    ? Array.from({ length: PACKETS }, (_, index) => (
                        <circle key={index} data-slot="node-canvas-packet" r={4} className="pointer-events-none fill-accent">
                          <animateMotion dur={`${PACKET_SECONDS}s`} begin={`${(-index * PACKET_SECONDS) / PACKETS}s`} repeatCount="indefinite" path={shape.d} />
                        </circle>
                      ))
                    : null}
                </g>
              );
            })}
          </svg>
          {shapes.map((shape) => {
            const { edge } = shape;
            const editing = editingEdge === edge.id;
            const showPlus = hoverEdge === edge.id && onInsertOnEdge && !locked && !busy;
            if (!edge.label && !editing && !showPlus) return null;
            const place = (dy: number): CSSProperties => ({ transform: `translate(${shape.mid.x}px, ${shape.mid.y + dy}px) translate(-50%, -50%)` });
            return (
              <div key={edge.id} className="contents">
                {editing ? (
                  <input
                    data-slot="node-canvas-edge-label-input"
                    aria-label="Подпись связи"
                    defaultValue={edge.label ?? ''}
                    autoFocus
                    className="absolute left-0 top-0 h-[22px] w-32 rounded-[6px] bg-surface-1 px-2 text-caption text-fg-1 shadow-[0_0_0_1.5px_var(--color-accent)] outline-none"
                    style={place(0)}
                    onPointerDown={(event) => event.stopPropagation()}
                    onKeyDown={(event) => {
                      event.stopPropagation();
                      if (event.key === 'Enter') commitLabel(edge, event.currentTarget.value);
                      if (event.key === 'Escape') setEditingEdge(null);
                    }}
                    onBlur={(event) => commitLabel(edge, event.currentTarget.value)}
                  />
                ) : edge.label ? (
                  <div
                    data-slot="node-canvas-edge-label"
                    data-selected={edge.selected || undefined}
                    className="absolute left-0 top-0 flex h-[22px] items-center whitespace-nowrap rounded-[6px] bg-surface-1 px-2 text-caption font-medium text-fg-1 shadow-[0_0_0_1px_var(--color-border)] data-selected:shadow-[0_0_0_1.5px_var(--color-accent)]"
                    style={place(0)}
                    onPointerDown={(event) => onEdgePointerDown(event, edge.id)}
                    onDoubleClick={(event) => {
                      event.stopPropagation();
                      if (!locked) setEditingEdge(edge.id);
                    }}
                  >
                    {edge.label}
                  </div>
                ) : null}
                {showPlus ? (
                  <button
                    type="button"
                    data-slot="node-canvas-edge-insert"
                    aria-label="Вставить шаг в связь"
                    className="absolute left-0 top-0 flex size-5 items-center justify-center rounded-full bg-surface-1 text-fg-1 shadow-[0_0_0_1.5px_var(--color-fg-2)] hover:bg-accent hover:text-accent-fg hover:shadow-none [&_svg]:size-3.5"
                    style={place(edge.label ? 20 : 0)}
                    onPointerDown={(event) => event.stopPropagation()}
                    onPointerEnter={() => setHoverEdge(edge.id)}
                    onClick={() => onInsertOnEdge?.(edge, shape.mid)}
                  >
                    <Plus strokeWidth={2} />
                  </button>
                ) : null}
              </div>
            );
          })}
          {steps.map(renderView)}
          {locked ? null : (
            // Above the cards: the ends sit right on the ports they are attached to.
            <svg data-slot="node-canvas-edge-ends" className="absolute left-0 top-0 z-[2] overflow-visible" width={1} height={1}>
              {shapes.map((shape) => (shape.edge.selected ? <EdgeEnds key={shape.edge.id} shape={shape} zoom={zoom} events={nodeEvents} /> : null))}
            </svg>
          )}
          {children}
        </div>

        <svg data-slot="node-canvas-interaction" aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
          {connecting ? (
            <path
              data-slot="node-canvas-connection"
              d={
                edgeGeometry(
                  'bezier',
                  { point: screen(connecting.from.point), side: connecting.from.side },
                  connecting.snap
                    ? { point: screen(connecting.snap.point), side: byId.get(connecting.snap.nodeId)?.ports.find((port) => port.id === connecting.snap?.portId)?.side ?? OPPOSITE[connecting.from.side] }
                    : { point: screen(connecting.cursor), side: OPPOSITE[connecting.from.side] },
                ).d
              }
              className="fill-none stroke-accent"
              strokeWidth={2}
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
          ) : null}
          {marquee && marquee.points.length > 1 ? (
            marquee.lasso ? (
              <path
                data-slot="node-canvas-lasso"
                d={`M${marquee.points.map((point) => `${screen(point).x} ${screen(point).y}`).join(' L')} Z`}
                className="fill-accent/7 stroke-accent/70"
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
            ) : (
              (() => {
                const [a, b] = [screen(marquee.points[0] as CanvasPoint), screen(marquee.points.at(-1) as CanvasPoint)];
                return (
                  <rect
                    data-slot="node-canvas-marquee"
                    x={Math.min(a.x, b.x)}
                    y={Math.min(a.y, b.y)}
                    width={Math.abs(b.x - a.x)}
                    height={Math.abs(b.y - a.y)}
                    className="fill-accent/7 stroke-accent/70"
                    strokeWidth={1}
                  />
                );
              })()
            )
          ) : null}
          {drag?.guides.map((guide, index) => {
            const a = screen(guide.axis === 'x' ? { x: guide.at, y: guide.from } : { x: guide.from, y: guide.at });
            const b = screen(guide.axis === 'x' ? { x: guide.at, y: guide.to } : { x: guide.to, y: guide.at });
            return <line key={index} data-slot="node-canvas-guide" x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="stroke-accent" strokeWidth={1} strokeDasharray="4 3" />;
          })}
          {drag?.gaps.map((gap, index) => {
            const a = screen(gap.axis === 'x' ? { x: gap.start, y: gap.at } : { x: gap.at, y: gap.start });
            const b = screen(gap.axis === 'x' ? { x: gap.end, y: gap.at } : { x: gap.at, y: gap.end });
            return <line key={index} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="stroke-accent" strokeWidth={1} />;
          })}
        </svg>

        {renderEmpty && nodes.length === 0 ? (
          <div data-slot="node-canvas-empty" className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
            <div className="pointer-events-auto" onPointerDown={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}>
              {renderEmpty()}
            </div>
          </div>
        ) : null}
        <div ref={setOverlay} data-slot="node-canvas-overlay" className="pointer-events-none absolute inset-0">
          {marquee && marquee.hits > 0 ? (
            <Pill tone="accent" at={screen(marquee.points[0] as CanvasPoint)} offset="-translate-y-[calc(100%+6px)]">
              {marquee.hits} выделено
            </Pill>
          ) : null}
          {drag && dragRect ? (
            <Pill tone="ink" at={screen({ x: dragRect.x + dragRect.width / 2, y: dragRect.y })} offset="-translate-x-1/2 -translate-y-[calc(100%+8px)]">
              x {Math.round(dragRect.x)} · y {Math.round(dragRect.y)}
            </Pill>
          ) : null}
          {drag?.gaps.map((gap, index) => (
            <Pill
              key={index}
              tone="accent"
              at={screen(gap.axis === 'x' ? { x: (gap.start + gap.end) / 2, y: gap.at } : { x: gap.at, y: (gap.start + gap.end) / 2 })}
              offset="-translate-x-1/2 -translate-y-1/2"
            >
              {Math.round(gap.end - gap.start)}
            </Pill>
          ))}
          {resizing ? (
            <Pill tone="accent" at={screen({ x: resizing.rect.x + resizing.rect.width, y: resizing.rect.y + resizing.rect.height })} offset="translate-x-2 translate-y-2">
              {Math.round(resizing.rect.width)} × {Math.round(resizing.rect.height)}
            </Pill>
          ) : null}
          {renderNodeToolbar && selectionBox && !busy && animated === null ? (
            <div
              data-slot="node-canvas-toolbar"
              className="pointer-events-auto absolute left-0 top-0"
              style={{
                transform: `translate(${screen({ x: selectionBox.x + selectionBox.width / 2, y: selectionBox.y }).x}px, ${screen({ x: 0, y: selectionBox.y }).y}px) translate(-50%, calc(-100% - 8px))`,
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onDoubleClick={(event) => event.stopPropagation()}
            >
              {renderNodeToolbar(selectedNodes)}
            </div>
          ) : null}
          {renderEdgeToolbar && singleEdge && !busy ? (
            <div
              data-slot="node-canvas-toolbar"
              data-edge=""
              className="pointer-events-auto absolute left-0 top-0"
              style={{ transform: `translate(${screen(singleEdge.mid).x}px, ${screen(singleEdge.mid).y}px) translate(-50%, calc(-100% - 20px))` }}
              onPointerDown={(event) => event.stopPropagation()}
              onDoubleClick={(event) => event.stopPropagation()}
            >
              {renderEdgeToolbar(singleEdge.edge)}
            </div>
          ) : null}
        </div>

        <VisuallyHidden id={hintId}>
          Стрелки сдвигают выделенное, с Shift — на 20; на невыделенном шаге — переходят к соседнему. Закрывающая и открывающая квадратные скобки — порты и связи шага, Escape — назад к шагу. Enter выделяет, на самом канвасе — добавляет шаг. Delete удаляет. Tab уводит фокус дальше.
        </VisuallyHidden>
        <Announce>{message}</Announce>
      </div>
    </CanvasContext>
  );
}

function Pill({ tone, at, offset, children }: { tone: 'accent' | 'ink'; at: CanvasPoint; offset: string; children: ReactNode }) {
  return (
    <div data-slot="node-canvas-pill" className="absolute left-0 top-0" style={{ transform: `translate(${at.x}px, ${at.y}px)` }}>
      <span
        className={cn(
          'flex h-[22px] w-max items-center rounded-xs px-2 font-mono text-[11px] font-semibold tabular-nums',
          tone === 'accent' ? 'bg-accent text-accent-fg' : 'bg-fg-1 text-surface-1',
          offset,
        )}
      >
        {children}
      </span>
    </div>
  );
}

/* ---------- Panel ---------- */

export type CanvasPanelPosition = 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

const PANEL_POSITION: Record<CanvasPanelPosition, string> = {
  'top-left': 'left-3 top-3',
  'top-center': 'left-1/2 top-3 -translate-x-1/2',
  'top-right': 'right-3 top-3',
  'center-left': 'left-3 top-1/2 -translate-y-1/2',
  'center-right': 'right-3 top-1/2 -translate-y-1/2',
  'bottom-left': 'bottom-3 left-3',
  'bottom-center': 'bottom-3 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-3 right-3',
};

export interface CanvasPanelProps {
  position?: CanvasPanelPosition;
  /** Name when the panel is a landmark of its own: «Масштаб». */
  'aria-label'?: string;
  children?: ReactNode;
  className?: string;
}

/** Screen-fixed layer over the graph in one of 8 places, 12 px from the edges; the graph does not get its pointer or wheel. */
export function CanvasPanel({ position = 'top-left', 'aria-label': ariaLabel, children, className }: CanvasPanelProps) {
  const { overlay } = useNodeCanvas();
  if (!overlay) return null;
  return createPortal(
    <div
      data-slot="canvas-panel"
      data-canvas-panel=""
      data-position={position}
      aria-label={ariaLabel}
      role={ariaLabel ? 'region' : undefined}
      className={cn('pointer-events-auto absolute flex gap-2', PANEL_POSITION[position], className)}
      onPointerDown={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      {children}
    </div>,
    overlay,
  );
}

/* ---------- Controls ---------- */

function ControlButton({
  label,
  shortcut,
  pressed,
  disabled,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip content={label} shortcut={shortcut}>
      <button
        type="button"
        data-slot="canvas-controls-button"
        aria-label={label}
        aria-pressed={pressed}
        disabled={disabled}
        className="flex size-8 shrink-0 items-center justify-center rounded-sm text-fg-2 hover:bg-fill-2 hover:text-fg-1 disabled:pointer-events-none disabled:opacity-40 aria-pressed:bg-accent-soft aria-pressed:text-accent-soft-fg [&_svg]:size-4 [&_svg]:stroke-[1.75]"
        onClick={onClick}
      >
        {children}
      </button>
    </Tooltip>
  );
}

export interface CanvasControlsProps {
  /** horizontal: − zoom % + with the zoom menu · vertical: + − in a column, for a phone or a narrow canvas. */
  orientation?: 'horizontal' | 'vertical';
  /** Lock button: stops moving and connecting; selection and the view stay free. */
  showLock?: boolean;
  /** Extra buttons after a separator: undo and redo, for example. */
  children?: ReactNode;
  className?: string;
}

/** Zoom panel: − / + 20 %, percent with a zoom menu, «Вписать», lock. Put it in a CanvasPanel. */
export function CanvasControls({ orientation = 'horizontal', showLock = true, children, className }: CanvasControlsProps) {
  const { api, viewport, minZoom, maxZoom, locked, readOnly, setLocked, nodes } = useNodeCanvas();
  const percent = Math.round(viewport.zoom * 100);
  const vertical = orientation === 'vertical';
  const selected = nodes.filter((node) => node.selected).map((node) => node.id);
  const separator = <span aria-hidden className={cn('shrink-0 bg-separator', vertical ? 'mx-auto my-0.5 h-px w-4' : 'mx-0.5 h-4 w-px')} />;
  return (
    <div
      role="toolbar"
      aria-label="Масштаб"
      aria-orientation={orientation}
      data-slot="canvas-controls"
      data-orientation={orientation}
      className={cn('flex items-center gap-0.5 p-1', vertical && 'flex-col', PANEL_SURFACE, className)}
    >
      {vertical ? (
        <>
          <ControlButton label="Увеличить" shortcut="⌘+" disabled={viewport.zoom >= maxZoom} onClick={() => api.zoomBy(ZOOM_STEP)}>
            <Plus />
          </ControlButton>
          <ControlButton label="Уменьшить" shortcut="⌘−" disabled={viewport.zoom <= minZoom} onClick={() => api.zoomBy(1 / ZOOM_STEP)}>
            <Minus />
          </ControlButton>
        </>
      ) : (
        <>
          <ControlButton label="Уменьшить" shortcut="⌘−" disabled={viewport.zoom <= minZoom} onClick={() => api.zoomBy(1 / ZOOM_STEP)}>
            <Minus />
          </ControlButton>
          <Menu>
            <MenuTrigger
              data-slot="canvas-controls-zoom"
              aria-label={`Масштаб ${percent} %`}
              className="flex h-8 w-14 shrink-0 items-center justify-center rounded-sm text-body-xs font-medium tabular-nums text-fg-1 hover:bg-fill-2 data-popup-open:bg-fill-2"
            >
              {percent}%
            </MenuTrigger>
            <MenuContent side="top" align="center" sideOffset={8}>
              <MenuItem shortcut="⇧1" onClick={() => api.fitView()}>
                Вписать всё
              </MenuItem>
              <MenuItem shortcut="⇧2" disabled={selected.length === 0} onClick={() => api.fitView({ nodeIds: selected })}>
                Вписать выделенное
              </MenuItem>
              <MenuSeparator />
              <MenuItem onClick={() => api.zoomTo(0.5)}>50 %</MenuItem>
              <MenuItem shortcut="⇧0" onClick={() => api.zoomTo(1)}>
                100 %
              </MenuItem>
              <MenuItem onClick={() => api.zoomTo(2)}>200 %</MenuItem>
            </MenuContent>
          </Menu>
          <ControlButton label="Увеличить" shortcut="⌘+" disabled={viewport.zoom >= maxZoom} onClick={() => api.zoomBy(ZOOM_STEP)}>
            <Plus />
          </ControlButton>
        </>
      )}
      {separator}
      <ControlButton label="Вписать" shortcut="⇧1" onClick={() => api.fitView()}>
        <Maximize2 />
      </ControlButton>
      {showLock ? (
        <ControlButton label={locked ? 'Разблокировать' : 'Заблокировать'} pressed={locked} disabled={readOnly} onClick={() => setLocked(!locked)}>
          {locked ? <Lock /> : <LockOpen />}
        </ControlButton>
      ) : null}
      {children ? (
        <>
          {separator}
          {children}
        </>
      ) : null}
    </div>
  );
}

/* ---------- Mini-map ---------- */

const MAP_WIDTH = 184;
const MAP_HEIGHT = 120;
const MAP_PAD = 8;
/** Narrower canvas: the map starts folded into an icon button, so it leaves room for the controls. */
const MAP_FOLD_BELOW = 480;

export interface CanvasMiniMapCursor {
  id: string;
  /** Graph point of the participant's cursor. */
  position: CanvasPoint;
  /** Participant colour, any CSS colour. */
  color: string;
  name?: string;
}

export interface CanvasMiniMapProps {
  /** Other participants' cursors as dots in their colour. */
  cursors?: readonly CanvasMiniMapCursor[];
  /** Collapse button; collapsed, the map is a «Карта» button that keeps the error count. */
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

/** 184×120 overview: nodes at 22 %, errors in danger, search hits in warning, the view as an accent frame. Click or drag to move the view. */
export function CanvasMiniMap({ cursors = [], collapsible = true, defaultCollapsed = false, className }: CanvasMiniMapProps) {
  const { api, viewport, size, nodes, rects, hidden, highlighted } = useNodeCanvas();
  // null: follow the canvas width until the user folds or opens the map.
  const [collapsed, setCollapsed] = useState<boolean | null>(defaultCollapsed ? true : null);
  const errors = nodes.filter((node) => node.status === 'error').length;
  const narrow = size.width > 0 && size.width < MAP_FOLD_BELOW;
  if (collapsed ?? narrow) {
    return (
      <button
        type="button"
        data-slot="canvas-minimap-toggle"
        aria-label={errors > 0 ? `Показать карту, ошибок: ${errors}` : 'Показать карту'}
        className={cn('flex h-10 items-center gap-1.5 px-3 text-label-md font-medium text-fg-1 hover:bg-fill-1 [&_svg]:size-4 [&_svg]:text-fg-2', PANEL_SURFACE, className)}
        onClick={() => setCollapsed(false)}
      >
        <MapIcon strokeWidth={1.75} />
        {narrow ? null : 'Карта'}
        {errors > 0 ? <span className="flex h-4 min-w-4 items-center justify-center rounded-[4px] bg-danger-soft px-1 text-caption font-semibold text-danger-soft-fg">{errors}</span> : null}
      </button>
    );
  }
  const shown = nodes.filter((node) => !hidden.has(node.id));
  const view: CanvasRect = { x: -viewport.x / viewport.zoom, y: -viewport.y / viewport.zoom, width: size.width / viewport.zoom, height: size.height / viewport.zoom };
  const world = boundsOf([...shown.flatMap((node) => rects.get(node.id) ?? []), ...(size.width > 0 ? [view] : [])]) ?? { x: 0, y: 0, width: 1, height: 1 };
  const scale = Math.min((MAP_WIDTH - MAP_PAD * 2) / Math.max(world.width, 1), (MAP_HEIGHT - MAP_PAD * 2) / Math.max(world.height, 1));
  const ox = (MAP_WIDTH - world.width * scale) / 2 - world.x * scale;
  const oy = (MAP_HEIGHT - world.height * scale) / 2 - world.y * scale;
  const toMap = (rect: CanvasRect) => ({ x: rect.x * scale + ox, y: rect.y * scale + oy, width: Math.max(rect.width * scale, 2), height: Math.max(rect.height * scale, 2) });
  const centerAt = (event: { clientX: number; clientY: number; currentTarget: Element }) => {
    const box = event.currentTarget.getBoundingClientRect();
    const point = { x: (event.clientX - box.left - ox) / scale, y: (event.clientY - box.top - oy) / scale };
    api.setViewport({ x: size.width / 2 - point.x * viewport.zoom, y: size.height / 2 - point.y * viewport.zoom, zoom: viewport.zoom });
  };
  const frame = toMap(view);
  const step = Math.max(view.width, view.height) / 4;
  return (
    <div data-slot="canvas-minimap" className={cn('relative overflow-hidden', PANEL_SURFACE, className)}>
      <svg
        role="img"
        aria-label={`Мини-карта: шагов ${shown.length}${errors > 0 ? `, ошибок ${errors}` : ''}${highlighted.size > 0 ? `, найдено ${highlighted.size}` : ''}. Стрелки двигают вид`}
        tabIndex={0}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        className="block cursor-pointer focus-visible:-outline-offset-2"
        onPointerDown={(event) => {
          centerAt(event);
          const target = event.currentTarget;
          const move = (moveEvent: PointerEvent) => centerAt({ clientX: moveEvent.clientX, clientY: moveEvent.clientY, currentTarget: target });
          const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
          };
          window.addEventListener('pointermove', move);
          window.addEventListener('pointerup', up);
        }}
        onKeyDown={(event) => {
          const dx = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
          const dy = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
          if (dx === 0 && dy === 0) return;
          event.preventDefault();
          event.stopPropagation();
          api.setViewport({ ...viewport, x: viewport.x - dx * step * viewport.zoom, y: viewport.y - dy * step * viewport.zoom });
        }}
      >
        <rect width={MAP_WIDTH} height={MAP_HEIGHT} className="fill-fill-1" />
        {size.width > 0 ? <rect data-slot="canvas-minimap-view" {...frame} rx={4} className="fill-surface-1 stroke-accent" strokeWidth={1.5} /> : null}
        {shown.map((node) => {
          const rect = rects.get(node.id);
          if (!rect) return null;
          const mark = node.status === 'error' ? 'error' : highlighted.has(node.id) ? 'found' : node.kind === 'group' ? 'group' : 'node';
          return (
            <rect
              key={node.id}
              data-slot="canvas-minimap-node"
              data-mark={mark}
              {...toMap(rect)}
              rx={3}
              className={cn(
                mark === 'error' && 'fill-danger',
                mark === 'found' && 'fill-warning',
                mark === 'group' && 'fill-fg-1/8',
                mark === 'node' && 'fill-fg-1/22',
              )}
            />
          );
        })}
        {cursors.map((cursor) => (
          <circle key={cursor.id} data-slot="canvas-minimap-cursor" cx={cursor.position.x * scale + ox} cy={cursor.position.y * scale + oy} r={4} style={{ fill: cursor.color }}>
            {cursor.name ? <title>{cursor.name}</title> : null}
          </circle>
        ))}
      </svg>
      {collapsible ? (
        <button
          type="button"
          aria-label="Свернуть карту"
          className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-xs bg-surface-1/80 text-fg-3 hover:text-fg-1 [&_svg]:size-3.5"
          onClick={() => setCollapsed(true)}
        >
          <Minimize2 strokeWidth={1.75} />
        </button>
      ) : null}
    </div>
  );
}
