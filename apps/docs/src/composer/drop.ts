// Canvas geometry without the DOM: what is under the pointer and where a dragged node would land.
import type { Place } from './model';

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export type Axis = 'vertical' | 'horizontal';

export interface NodeBox {
  id: string;
  depth: number;
  box: Box;
}

/** A slot that can take a node: its area, its direction and the boxes of what is already in it. */
export interface Zone {
  parentId: string;
  slot: string;
  depth: number;
  axis: Axis;
  box: Box;
  children: readonly { id: string; box: Box }[];
}

export interface Drop {
  place: Place;
  /** Insertion line; `null` when the slot is empty and the whole zone lights up. */
  line: Box | null;
  zone: Box;
}

const right = (box: Box) => box.left + box.width;
const bottom = (box: Box) => box.top + box.height;
const area = (box: Box) => box.width * box.height;

export function inside(box: Box, point: Point): boolean {
  return point.x >= box.left && point.x <= right(box) && point.y >= box.top && point.y <= bottom(box);
}

export function union(boxes: readonly Box[]): Box | null {
  if (boxes.length === 0) return null;
  const left = Math.min(...boxes.map((box) => box.left));
  const top = Math.min(...boxes.map((box) => box.top));
  return { left, top, width: Math.max(...boxes.map(right)) - left, height: Math.max(...boxes.map(bottom)) - top };
}

function distance(box: Box, point: Point): number {
  const dx = Math.max(box.left - point.x, 0, point.x - right(box));
  const dy = Math.max(box.top - point.y, 0, point.y - bottom(box));
  return dx * dx + dy * dy;
}

/** Deeper wins; on the same depth the smaller box. */
function deepest<T extends { depth: number; box: Box }>(items: readonly T[]): T | undefined {
  return items.reduce<T | undefined>(
    (best, item) => (!best || item.depth > best.depth || (item.depth === best.depth && area(item.box) < area(best.box)) ? item : best),
    undefined,
  );
}

export function hitTest(point: Point, nodes: readonly NodeBox[]): string | null {
  return deepest(nodes.filter((node) => inside(node.box, point)))?.id ?? null;
}

function insertion(zone: Zone, point: Point): { index: number; line: Box | null } {
  const kids = zone.children;
  if (kids.length === 0) return { index: 0, line: null };

  if (zone.axis === 'vertical') {
    const found = kids.findIndex((kid) => point.y < kid.box.top + kid.box.height / 2);
    const index = found < 0 ? kids.length : found;
    const before = kids[index - 1]?.box;
    const after = kids[index]?.box;
    const y = before && after ? (bottom(before) + after.top) / 2 : after ? after.top - 3 : before ? bottom(before) + 3 : zone.box.top;
    return { index, line: { left: zone.box.left, top: y - 1, width: zone.box.width, height: 2 } };
  }

  // rows, wrapped rows and grids: the nearest child, then its left or right half
  let nearest = 0;
  kids.forEach((kid, index) => {
    const current = kids[nearest];
    if (current && distance(kid.box, point) < distance(current.box, point)) nearest = index;
  });
  const target = kids[nearest]?.box ?? zone.box;
  const after = point.x > target.left + target.width / 2;
  const neighbour = kids[after ? nearest + 1 : nearest - 1]?.box;
  const sameLine = neighbour && neighbour.top < bottom(target) && bottom(neighbour) > target.top;
  const x = after
    ? sameLine && neighbour ? (right(target) + neighbour.left) / 2 : right(target) + 3
    : sameLine && neighbour ? (right(neighbour) + target.left) / 2 : target.left - 3;
  return { index: nearest + (after ? 1 : 0), line: { left: x - 1, top: target.top, width: 2, height: target.height } };
}

export function resolveDrop(point: Point, zones: readonly Zone[]): Drop | null {
  const zone = deepest(zones.filter((item) => inside(item.box, point)));
  if (!zone) return null;
  const { index, line } = insertion(zone, point);
  return { place: { parentId: zone.parentId, slot: zone.slot, index }, line, zone: zone.box };
}
