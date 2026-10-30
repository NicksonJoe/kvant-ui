// Composer document: an immutable tree of nodes. Every operation returns a new root and keeps untouched branches.
import type { ForcedState, PropValue } from '@/kvant/meta';

export type NodeProps = Readonly<Record<string, PropValue>>;

export interface ComposerNode {
  readonly id: string;
  /** Primitive (`stack`, `text`…), composable or leaf component id (`button`, `select`…). */
  readonly type: string;
  /** Only the values that were set; defaults come from the node's spec. */
  readonly props: NodeProps;
  /** Named slots from the meta; `children` is the default one. */
  readonly slots: Readonly<Record<string, readonly ComposerNode[]>>;
  /** Design-time hover / pressed / focus for the canvas; never exported. */
  readonly state?: ForcedState;
}

/** Where a node sits: the parent, the parent's slot and the position in it. */
export interface Place {
  parentId: string;
  slot: string;
  index: number;
}

export const ROOT_ID = 'root';
export const CHILDREN = 'children';

export type IdFactory = () => string;

export const createId: IdFactory = () => `n${Math.random().toString(36).slice(2, 10)}`;

export function makeNode(type: string, props: NodeProps = {}, slots: ComposerNode['slots'] = {}): ComposerNode {
  return { id: createId(), type, props, slots };
}

/** The page: a stack that is never moved or deleted. */
export function emptyRoot(): ComposerNode {
  return { id: ROOT_ID, type: 'stack', props: { align: 'start', gap: 24 }, slots: { [CHILDREN]: [] } };
}

export function walk(node: ComposerNode, visit: (node: ComposerNode, depth: number) => void, depth = 0): void {
  visit(node, depth);
  for (const children of Object.values(node.slots)) for (const child of children) walk(child, visit, depth + 1);
}

/** Pre-order: the order of the code and of the keyboard selection. */
export function flatten(root: ComposerNode): ComposerNode[] {
  const nodes: ComposerNode[] = [];
  walk(root, (node) => nodes.push(node));
  return nodes;
}

export function findNode(root: ComposerNode, id: string): ComposerNode | undefined {
  if (root.id === id) return root;
  for (const children of Object.values(root.slots)) {
    for (const child of children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return undefined;
}

export function locate(root: ComposerNode, id: string): Place | undefined {
  for (const [slot, children] of Object.entries(root.slots)) {
    const index = children.findIndex((child) => child.id === id);
    if (index >= 0) return { parentId: root.id, slot, index };
    for (const child of children) {
      const place = locate(child, id);
      if (place) return place;
    }
  }
  return undefined;
}

/** From the root down to the node's parent. */
export function ancestors(root: ComposerNode, id: string): ComposerNode[] {
  const path: ComposerNode[] = [];
  let place = locate(root, id);
  while (place) {
    const parent = findNode(root, place.parentId);
    if (!parent) break;
    path.unshift(parent);
    place = locate(root, parent.id);
  }
  return path;
}

/** The node with `id`, replaced by `update(node)`; the same root when nothing changed. */
export function updateNode(root: ComposerNode, id: string, update: (node: ComposerNode) => ComposerNode): ComposerNode {
  if (root.id === id) return update(root);
  let changed = false;
  const slots: Record<string, readonly ComposerNode[]> = {};
  for (const [slot, children] of Object.entries(root.slots)) {
    slots[slot] = children.map((child) => {
      const next = updateNode(child, id, update);
      if (next !== child) changed = true;
      return next;
    });
  }
  return changed ? { ...root, slots } : root;
}

export function insertNode(root: ComposerNode, place: Place, node: ComposerNode): ComposerNode {
  return updateNode(root, place.parentId, (parent) => {
    const children = parent.slots[place.slot] ?? [];
    const index = Math.max(0, Math.min(place.index, children.length));
    return { ...parent, slots: { ...parent.slots, [place.slot]: [...children.slice(0, index), node, ...children.slice(index)] } };
  });
}

export function removeNode(root: ComposerNode, id: string): ComposerNode {
  const place = locate(root, id);
  if (!place) return root;
  return updateNode(root, place.parentId, (parent) => ({
    ...parent,
    slots: { ...parent.slots, [place.slot]: (parent.slots[place.slot] ?? []).filter((child) => child.id !== id) },
  }));
}

/** `place.index` counts the moved node itself when it stays in the same slot (as a drop indicator does). */
export function moveNode(root: ComposerNode, id: string, place: Place): ComposerNode {
  const node = findNode(root, id);
  const from = locate(root, id);
  if (!node || !from || findNode(node, place.parentId)) return root;
  const sameSlot = from.parentId === place.parentId && from.slot === place.slot;
  const index = sameSlot && from.index < place.index ? place.index - 1 : place.index;
  if (sameSlot && index === from.index) return root;
  return insertNode(removeNode(root, id), { ...place, index }, node);
}

/** Alt+↑ / Alt+↓: one step among siblings; the same root at the edges. */
export function shiftNode(root: ComposerNode, id: string, delta: -1 | 1): ComposerNode {
  const place = locate(root, id);
  if (!place) return root;
  const siblings = findNode(root, place.parentId)?.slots[place.slot] ?? [];
  const target = place.index + delta;
  if (target < 0 || target >= siblings.length) return root;
  return moveNode(root, id, { ...place, index: delta > 0 ? target + 1 : target });
}

export function withFreshIds(node: ComposerNode, makeId: IdFactory = createId): ComposerNode {
  const id = makeId();
  const slots: Record<string, readonly ComposerNode[]> = {};
  for (const [slot, children] of Object.entries(node.slots)) slots[slot] = children.map((child) => withFreshIds(child, makeId));
  return { ...node, id, slots };
}

export function duplicateNode(root: ComposerNode, id: string, makeId: IdFactory = createId): { root: ComposerNode; id: string } {
  const node = findNode(root, id);
  const place = locate(root, id);
  if (!node || !place) return { root, id };
  const copy = withFreshIds(node, makeId);
  return { root: insertNode(root, { ...place, index: place.index + 1 }, copy), id: copy.id };
}

/** Merges props; `undefined` removes a prop (back to its default). */
export function setProps(root: ComposerNode, id: string, patch: Readonly<Record<string, PropValue | undefined>>): ComposerNode {
  return updateNode(root, id, (node) => {
    const merged = Object.entries({ ...node.props, ...patch });
    return { ...node, props: Object.fromEntries(merged.filter((entry): entry is [string, PropValue] => entry[1] !== undefined)) };
  });
}

export function setState(root: ComposerNode, id: string, state: ForcedState | undefined): ComposerNode {
  return updateNode(root, id, (node) =>
    state ? { ...node, state } : { id: node.id, type: node.type, props: node.props, slots: node.slots },
  );
}
