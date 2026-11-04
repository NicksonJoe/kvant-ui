// Pure geometry of the node canvas: rectangles, ports, edge paths, viewport maths and snapping.
import type { CanvasEdgePath, CanvasNode, CanvasPoint, CanvasPort, CanvasPortSide, CanvasViewport } from './canvas-types';

/** Size of a node that has neither its own size nor a measured one yet: a step card is 208 wide. */
export const NODE_WIDTH = 208;
export const NODE_HEIGHT = 64;
/** Straight run out of a port before a stepped edge turns. */
const STUB = 16;
/** Room an orthogonal edge leaves around the cards it goes past. */
const AVOID_MARGIN = 8;
/** A bend costs as much as this many px of length when the orthogonal router compares routes. */
const BEND_COST = 24;
const CORNER = 8;

export interface CanvasRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface CanvasEdgeEnd {
  point: CanvasPoint;
  side: CanvasPortSide;
}

export interface CanvasEdgeGeometry {
  /** SVG path data. */
  d: string;
  /** Halfway along the edge: label, «+» and toolbar sit here. */
  mid: CanvasPoint;
}

const DIRECTION: Record<CanvasPortSide, CanvasPoint> = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

const isHorizontal = (side: CanvasPortSide): boolean => side === 'left' || side === 'right';
const round = (value: number): number => Math.round(value * 100) / 100;
const fmt = (point: CanvasPoint): string => `${round(point.x)} ${round(point.y)}`;

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export function nodeSize(node: CanvasNode, measured?: CanvasSize): CanvasSize {
  return {
    width: node.width ?? (measured && measured.width > 0 ? measured.width : NODE_WIDTH),
    height: node.height ?? (measured && measured.height > 0 ? measured.height : NODE_HEIGHT),
  };
}

/**
 * Graph-space rectangle of every node: parent offsets added, `positions` (relative, like node.position) overriding
 * where the node is drawn mid-animation. A parent cycle is cut where it closes.
 */
export function absoluteRects(
  nodes: readonly CanvasNode[],
  sizes: ReadonlyMap<string, CanvasSize>,
  positions?: ReadonlyMap<string, CanvasPoint>,
): Map<string, CanvasRect> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const rects = new Map<string, CanvasRect>();
  const rectOf = (node: CanvasNode, depth: number): CanvasRect => {
    const known = rects.get(node.id);
    if (known) return known;
    const own = positions?.get(node.id) ?? node.position;
    const parent = node.parentId === undefined ? undefined : byId.get(node.parentId);
    const base = parent && depth < nodes.length ? rectOf(parent, depth + 1) : { x: 0, y: 0 };
    const rect = { x: base.x + own.x, y: base.y + own.y, ...nodeSize(node, sizes.get(node.id)) };
    rects.set(node.id, rect);
    return rect;
  };
  for (const node of nodes) rectOf(node, 0);
  return rects;
}

/** Ids of nodes inside a collapsed group, at any depth. */
export function hiddenNodeIds(nodes: readonly CanvasNode[]): Set<string> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const hidden = new Set<string>();
  for (const node of nodes) {
    let parent = node.parentId === undefined ? undefined : byId.get(node.parentId);
    for (let depth = 0; parent && depth < nodes.length; depth++) {
      if (parent.collapsed) {
        hidden.add(node.id);
        break;
      }
      parent = parent.parentId === undefined ? undefined : byId.get(parent.parentId);
    }
  }
  return hidden;
}

/** The node an edge end is drawn at: the node itself, or the collapsed group that hides it. */
export function visibleEnd(id: string, nodes: ReadonlyMap<string, CanvasNode>, hidden: ReadonlySet<string>): string {
  let current = id;
  for (let depth = 0; hidden.has(current) && depth < nodes.size; depth++) {
    const parent = nodes.get(current)?.parentId;
    if (parent === undefined) break;
    current = parent;
  }
  return current;
}

/** Centre of a port along its side, in px from the node's top (left/right) or left edge (top/bottom). */
export function portOffset(port: CanvasPort, ports: readonly CanvasPort[], size: CanvasSize): number {
  if (port.offset !== undefined) return port.offset;
  const same = ports.filter((item) => item.side === port.side);
  const length = isHorizontal(port.side) ? size.height : size.width;
  return ((same.indexOf(port) + 1) / (same.length + 1)) * length;
}

export function portPoint(rect: CanvasRect, port: CanvasPort, ports: readonly CanvasPort[]): CanvasPoint {
  const along = portOffset(port, ports, rect);
  switch (port.side) {
    case 'left':
      return { x: rect.x, y: rect.y + along };
    case 'right':
      return { x: rect.x + rect.width, y: rect.y + along };
    case 'top':
      return { x: rect.x + along, y: rect.y };
    case 'bottom':
      return { x: rect.x + along, y: rect.y + rect.height };
  }
}

/** Middle of a side: where an edge meets a collapsed group standing in for its hidden step. */
export function sidePoint(rect: CanvasRect, side: CanvasPortSide): CanvasPoint {
  const port: CanvasPort = { id: '', side, direction: 'in' };
  return portPoint(rect, port, [port]);
}

/* ---------- Edge paths ---------- */

const swap = (point: CanvasPoint): CanvasPoint => ({ x: point.y, y: point.x });
const same = (a: CanvasPoint, b: CanvasPoint): boolean => Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01;

/** Drops repeated points and the middle of three in a line. */
function simplify(points: readonly CanvasPoint[]): CanvasPoint[] {
  const out: CanvasPoint[] = [];
  for (const point of points) {
    const last = out.at(-1);
    if (last && same(last, point)) continue;
    const before = out.at(-2);
    if (before && last && ((before.x === last.x && last.x === point.x) || (before.y === last.y && last.y === point.y))) out.pop();
    out.push(point);
  }
  return out;
}

/** Points of an edge made of horizontal and vertical runs that leaves and enters each port straight. */
export function stepPoints(source: CanvasEdgeEnd, target: CanvasEdgeEnd): CanvasPoint[] {
  // Work in a frame where the source leaves horizontally, then turn the points back.
  const flip = !isHorizontal(source.side);
  const turn = (point: CanvasPoint) => (flip ? swap(point) : point);
  const s = turn(source.point);
  const t = turn(target.point);
  const sd = turn(DIRECTION[source.side]);
  const td = turn(DIRECTION[target.side]);
  const s1 = { x: s.x + sd.x * STUB, y: s.y };
  const t1 = { x: t.x + td.x * STUB, y: t.y + td.y * STUB };
  let mids: CanvasPoint[];
  if (td.y === 0) {
    if (td.x === sd.x) {
      const x = sd.x > 0 ? Math.max(s1.x, t1.x) : Math.min(s1.x, t1.x);
      mids = [
        { x, y: s.y },
        { x, y: t.y },
      ];
    } else if ((t1.x - s1.x) * sd.x >= 0) {
      const x = (s.x + t.x) / 2;
      mids = [
        { x, y: s.y },
        { x, y: t.y },
      ];
    } else {
      const y = (s.y + t.y) / 2;
      mids = [s1, { x: s1.x, y }, { x: t1.x, y }, t1];
    }
  } else {
    const corner = { x: t.x, y: s.y };
    mids = (t.x - s.x) * sd.x > 0 && (corner.y - t.y) * td.y > 0 ? [corner] : [s1, { x: s1.x, y: t1.y }, t1];
  }
  return simplify([s, ...mids, t].map(turn));
}

function crosses(a: CanvasPoint, b: CanvasPoint, rect: CanvasRect): boolean {
  const left = Math.min(a.x, b.x);
  const right = Math.max(a.x, b.x);
  const top = Math.min(a.y, b.y);
  const bottom = Math.max(a.y, b.y);
  return right > rect.x && left < rect.x + rect.width && bottom > rect.y && top < rect.y + rect.height;
}

function blocked(points: readonly CanvasPoint[], rects: readonly CanvasRect[]): boolean {
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1] as CanvasPoint;
    const b = points[index] as CanvasPoint;
    if (rects.some((rect) => crosses(a, b, rect))) return true;
  }
  return false;
}

function polylineLength(points: readonly CanvasPoint[]): number {
  let length = 0;
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1] as CanvasPoint;
    const b = points[index] as CanvasPoint;
    length += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return length;
}

/** Stepped route that goes around `obstacles` (cards other than its own two), fewest bends and shortest first. */
export function avoidingPoints(source: CanvasEdgeEnd, target: CanvasEdgeEnd, obstacles: readonly CanvasRect[]): CanvasPoint[] {
  const base = stepPoints(source, target);
  const rects = obstacles.map((rect) => ({
    x: rect.x - AVOID_MARGIN,
    y: rect.y - AVOID_MARGIN,
    width: rect.width + AVOID_MARGIN * 2,
    height: rect.height + AVOID_MARGIN * 2,
  }));
  const near = rects.filter((rect) => {
    const span = { x: Math.min(source.point.x, target.point.x), y: Math.min(source.point.y, target.point.y) };
    const reach = Math.max(rect.width, rect.height) + STUB * 4;
    return (
      rect.x < Math.max(source.point.x, target.point.x) + reach &&
      rect.x + rect.width > span.x - reach &&
      rect.y < Math.max(source.point.y, target.point.y) + reach &&
      rect.y + rect.height > span.y - reach
    );
  });
  if (!blocked(base, near)) return base;
  const s = source.point;
  const t = target.point;
  const s1 = { x: s.x + DIRECTION[source.side].x * STUB, y: s.y + DIRECTION[source.side].y * STUB };
  const t1 = { x: t.x + DIRECTION[target.side].x * STUB, y: t.y + DIRECTION[target.side].y * STUB };
  const xs = [...new Set([...near.flatMap((rect) => [rect.x, rect.x + rect.width]), (s1.x + t1.x) / 2])];
  const ys = [...new Set([...near.flatMap((rect) => [rect.y, rect.y + rect.height]), (s1.y + t1.y) / 2])];
  let best: CanvasPoint[] | null = null;
  let bestScore = Infinity;
  const consider = (mids: readonly CanvasPoint[]) => {
    const points = simplify([s, s1, ...mids, t1, t]);
    if (blocked(points, near)) return;
    const score = polylineLength(points) + BEND_COST * (points.length - 2);
    if (score < bestScore) {
      best = points;
      bestScore = score;
    }
  };
  for (const x of xs)
    consider([
      { x, y: s1.y },
      { x, y: t1.y },
    ]);
  for (const y of ys)
    consider([
      { x: s1.x, y },
      { x: t1.x, y },
    ]);
  if (!best) {
    for (const x of xs) for (const y of ys) consider([{ x: s1.x, y }, { x, y }, { x, y: t1.y }]);
  }
  return best ?? base;
}

function roundedPath(points: readonly CanvasPoint[], radius: number): string {
  const first = points[0] as CanvasPoint;
  let d = `M${fmt(first)}`;
  for (let index = 1; index < points.length - 1; index++) {
    const prev = points[index - 1] as CanvasPoint;
    const cur = points[index] as CanvasPoint;
    const next = points[index + 1] as CanvasPoint;
    const inLength = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    const outLength = Math.hypot(next.x - cur.x, next.y - cur.y);
    const r = Math.min(radius, inLength / 2, outLength / 2);
    if (r <= 0) {
      d += ` L${fmt(cur)}`;
      continue;
    }
    const a = { x: cur.x - ((cur.x - prev.x) / inLength) * r, y: cur.y - ((cur.y - prev.y) / inLength) * r };
    const b = { x: cur.x + ((next.x - cur.x) / outLength) * r, y: cur.y + ((next.y - cur.y) / outLength) * r };
    d += ` L${fmt(a)} Q${fmt(cur)} ${fmt(b)}`;
  }
  return `${d} L${fmt(points.at(-1) as CanvasPoint)}`;
}

function polylineMid(points: readonly CanvasPoint[]): CanvasPoint {
  let left = polylineLength(points) / 2;
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1] as CanvasPoint;
    const b = points[index] as CanvasPoint;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length >= left && length > 0) return { x: a.x + ((b.x - a.x) * left) / length, y: a.y + ((b.y - a.y) * left) / length };
    left -= length;
  }
  return points[0] as CanvasPoint;
}

export function edgeGeometry(path: CanvasEdgePath, source: CanvasEdgeEnd, target: CanvasEdgeEnd, obstacles: readonly CanvasRect[] = []): CanvasEdgeGeometry {
  const s = source.point;
  const t = target.point;
  if (path === 'straight') return { d: `M${fmt(s)} L${fmt(t)}`, mid: { x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 } };
  if (path === 'bezier') {
    const pull = Math.max(Math.hypot(t.x - s.x, t.y - s.y) * 0.4, 24);
    const c1 = { x: s.x + DIRECTION[source.side].x * pull, y: s.y + DIRECTION[source.side].y * pull };
    const c2 = { x: t.x + DIRECTION[target.side].x * pull, y: t.y + DIRECTION[target.side].y * pull };
    return {
      d: `M${fmt(s)} C${fmt(c1)} ${fmt(c2)} ${fmt(t)}`,
      mid: { x: (s.x + 3 * c1.x + 3 * c2.x + t.x) / 8, y: (s.y + 3 * c1.y + 3 * c2.y + t.y) / 8 },
    };
  }
  const points = path === 'orthogonal' ? avoidingPoints(source, target, obstacles) : stepPoints(source, target);
  return { d: roundedPath(points, path === 'step' ? 0 : CORNER), mid: polylineMid(points) };
}

/* ---------- Viewport ---------- */

export const toGraph = (point: CanvasPoint, viewport: CanvasViewport): CanvasPoint => ({
  x: (point.x - viewport.x) / viewport.zoom,
  y: (point.y - viewport.y) / viewport.zoom,
});

export const toScreen = (point: CanvasPoint, viewport: CanvasViewport): CanvasPoint => ({
  x: point.x * viewport.zoom + viewport.x,
  y: point.y * viewport.zoom + viewport.y,
});

/** The viewport at `zoom` that keeps the graph point under `anchor` (screen) where it is. */
export function zoomAt(viewport: CanvasViewport, zoom: number, anchor: CanvasPoint): CanvasViewport {
  const point = toGraph(anchor, viewport);
  return { x: anchor.x - point.x * zoom, y: anchor.y - point.y * zoom, zoom };
}

export function fitViewport(bounds: CanvasRect, size: CanvasSize, padding: number, minZoom: number, maxZoom: number): CanvasViewport {
  const zoom = clamp(
    Math.min((size.width - padding * 2) / Math.max(bounds.width, 1), (size.height - padding * 2) / Math.max(bounds.height, 1)),
    minZoom,
    maxZoom,
  );
  return {
    x: size.width / 2 - (bounds.x + bounds.width / 2) * zoom,
    y: size.height / 2 - (bounds.y + bounds.height / 2) * zoom,
    zoom,
  };
}

export function boundsOf(rects: Iterable<CanvasRect>): CanvasRect | null {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const rect of rects) {
    left = Math.min(left, rect.x);
    top = Math.min(top, rect.y);
    right = Math.max(right, rect.x + rect.width);
    bottom = Math.max(bottom, rect.y + rect.height);
  }
  return left === Infinity ? null : { x: left, y: top, width: right - left, height: bottom - top };
}

export const intersects = (a: CanvasRect, b: CanvasRect): boolean =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

export const containsPoint = (rect: CanvasRect, point: CanvasPoint): boolean =>
  point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;

export function pointInPolygon(point: CanvasPoint, polygon: readonly CanvasPoint[]): boolean {
  let inside = false;
  for (let index = 0, prev = polygon.length - 1; index < polygon.length; prev = index++) {
    const a = polygon[index] as CanvasPoint;
    const b = polygon[prev] as CanvasPoint;
    if (a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/* ---------- Snapping ---------- */

/** Helper line: on axis x it is the vertical line x = at from y = from to y = to. */
export interface CanvasGuide {
  axis: 'x' | 'y';
  at: number;
  from: number;
  to: number;
}

/** One of two equal gaps: on axis x it runs from x = start to x = end at height y = at. */
export interface CanvasGapMark {
  axis: 'x' | 'y';
  start: number;
  end: number;
  at: number;
}

export interface CanvasSnap {
  x: number;
  y: number;
  guides: CanvasGuide[];
  gaps: CanvasGapMark[];
}

export interface CanvasSnapOptions {
  /** Grid step; 0 turns grid snapping off. */
  grid: number;
  /** How close an edge, centre or equal gap pulls, in graph units. */
  threshold: number;
}

function snapAxis(rect: CanvasRect, others: readonly CanvasRect[], axis: 'x' | 'y', options: CanvasSnapOptions) {
  const pos = axis;
  const cross = axis === 'x' ? 'y' : 'x';
  const len = axis === 'x' ? 'width' : 'height';
  const crossLen = axis === 'x' ? 'height' : 'width';
  const anchors = (item: CanvasRect) => [item[pos], item[pos] + item[len] / 2, item[pos] + item[len]];
  let best: { delta: number; at: number } | null = null;
  for (const other of others) {
    for (const at of anchors(other)) {
      for (const own of anchors(rect)) {
        const delta = at - own;
        if (Math.abs(delta) <= options.threshold && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { delta, at };
      }
    }
  }
  if (best) {
    const { at, delta } = best;
    const lined = others.filter((other) => anchors(other).some((value) => Math.abs(value - at) < 0.5));
    const spans = [rect, ...lined];
    const guide: CanvasGuide = {
      axis,
      at,
      from: Math.min(...spans.map((item) => item[cross])),
      to: Math.max(...spans.map((item) => item[cross] + item[crossLen])),
    };
    return { value: rect[pos] + delta, guides: [guide], gaps: [] as CanvasGapMark[] };
  }
  const band = others.filter((other) => other[cross] < rect[cross] + rect[crossLen] && other[cross] + other[crossLen] > rect[cross]);
  const before = band.filter((other) => other[pos] + other[len] <= rect[pos] + options.threshold).sort((a, b) => b[pos] + b[len] - (a[pos] + a[len]))[0];
  const after = band.filter((other) => other[pos] >= rect[pos] + rect[len] - options.threshold).sort((a, b) => a[pos] - b[pos])[0];
  if (before && after) {
    const value = (before[pos] + before[len] + after[pos] - rect[len]) / 2;
    if (Math.abs(value - rect[pos]) <= options.threshold && value > before[pos] + before[len]) {
      const at = rect[cross] + rect[crossLen] / 2;
      return {
        value,
        guides: [] as CanvasGuide[],
        gaps: [
          { axis, start: before[pos] + before[len], end: value, at },
          { axis, start: value + rect[len], end: after[pos], at },
        ],
      };
    }
  }
  const value = options.grid > 0 ? Math.round(rect[pos] / options.grid) * options.grid : rect[pos];
  return { value, guides: [] as CanvasGuide[], gaps: [] as CanvasGapMark[] };
}

/** Where a dragged rectangle lands: neighbour edges and centres first, then equal gaps, then the grid. */
export function snapRect(rect: CanvasRect, others: readonly CanvasRect[], options: CanvasSnapOptions): CanvasSnap {
  const x = snapAxis(rect, others, 'x', options);
  const y = snapAxis(rect, others, 'y', options);
  return { x: x.value, y: y.value, guides: [...x.guides, ...y.guides], gaps: [...x.gaps, ...y.gaps] };
}
