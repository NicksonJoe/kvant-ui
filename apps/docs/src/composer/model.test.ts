import { describe, expect, it } from 'vitest';
import {
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
  shiftNode,
  withFreshIds,
  type ComposerNode,
} from './model';

function counter(prefix = 'x'): () => string {
  let next = 0;
  return () => `${prefix}${++next}`;
}

/** root → [card(a) → [text(t1), text(t2), row(r) → [button(b)]], text(t3)]; the button has an icon in `leadingIcon`. */
function sample(): ComposerNode {
  const icon: ComposerNode = { id: 'i', type: 'icon', props: { name: 'Plus' }, slots: {} };
  const button: ComposerNode = { id: 'b', type: 'button', props: { children: 'Создать' }, slots: { leadingIcon: [icon] } };
  const row: ComposerNode = { id: 'r', type: 'row', props: {}, slots: { children: [button] } };
  const card: ComposerNode = {
    id: 'a',
    type: 'card',
    props: { title: 'Сделка' },
    slots: { children: [makeText('t1'), makeText('t2'), row] },
  };
  return { ...emptyRoot(), slots: { children: [card, makeText('t3')] } };
}

function makeText(id: string): ComposerNode {
  return { id, type: 'text', props: { text: id }, slots: {} };
}

const ids = (node: ComposerNode, slot = 'children') => (node.slots[slot] ?? []).map((child) => child.id);

function at(root: ComposerNode, id: string): ComposerNode {
  const node = findNode(root, id);
  if (!node) throw new Error(`No node ${id}`);
  return node;
}

describe('lookup', () => {
  it('finds nodes and their place, including named slots', () => {
    const root = sample();
    expect(findNode(root, 'i')?.type).toBe('icon');
    expect(locate(root, 't2')).toEqual({ parentId: 'a', slot: 'children', index: 1 });
    expect(locate(root, 'i')).toEqual({ parentId: 'b', slot: 'leadingIcon', index: 0 });
    expect(locate(root, ROOT_ID)).toBeUndefined();
    expect(ancestors(root, 'i').map((node) => node.id)).toEqual([ROOT_ID, 'a', 'r', 'b']);
  });

  it('flattens in document order', () => {
    expect(flatten(sample()).map((node) => node.id)).toEqual([ROOT_ID, 'a', 't1', 't2', 'r', 'b', 'i', 't3']);
  });
});

describe('insert and remove', () => {
  it('inserts into a slot at an index, clamped to the slot length', () => {
    const root = insertNode(sample(), { parentId: 'a', slot: 'children', index: 1 }, makeText('new'));
    expect(ids(at(root, 'a'))).toEqual(['t1', 'new', 't2', 'r']);
    const end = insertNode(sample(), { parentId: 'a', slot: 'children', index: 99 }, makeText('new'));
    expect(ids(at(end, 'a'))).toEqual(['t1', 't2', 'r', 'new']);
  });

  it('creates a named slot on first insert', () => {
    const root = insertNode(sample(), { parentId: 'b', slot: 'trailingIcon', index: 0 }, makeText('tail'));
    expect(ids(at(root, 'b'), 'trailingIcon')).toEqual(['tail']);
  });

  it('removes a node with its subtree and never the root', () => {
    const root = removeNode(sample(), 'r');
    expect(findNode(root, 'b')).toBeUndefined();
    expect(ids(at(root, 'a'))).toEqual(['t1', 't2']);
    expect(removeNode(root, ROOT_ID)).toBe(root);
  });

  it('keeps untouched branches by reference', () => {
    const before = sample();
    const after = setProps(before, 't3', { text: 'Итого' });
    expect(findNode(after, 'a')).toBe(findNode(before, 'a'));
    expect(findNode(after, 't3')?.props.text).toBe('Итого');
  });

  it('removes props set to undefined', () => {
    const root = setProps(sample(), 'a', { title: undefined, description: 'До 30 октября' });
    expect(findNode(root, 'a')?.props).toEqual({ description: 'До 30 октября' });
  });
});

describe('move', () => {
  it('moves forward inside the same slot accounting for the removed node', () => {
    // dropping t1 between t2 and r: the drop index counts t1 itself
    const root = moveNode(sample(), 't1', { parentId: 'a', slot: 'children', index: 2 });
    expect(ids(at(root, 'a'))).toEqual(['t2', 't1', 'r']);
  });

  it('moves backward and across parents', () => {
    const back = moveNode(sample(), 'r', { parentId: 'a', slot: 'children', index: 0 });
    expect(ids(at(back, 'a'))).toEqual(['r', 't1', 't2']);
    const across = moveNode(sample(), 't3', { parentId: 'r', slot: 'children', index: 0 });
    expect(ids(at(across, 'r'))).toEqual(['t3', 'b']);
    expect(ids(across)).toEqual(['a']);
  });

  it('moves into a named slot', () => {
    const root = moveNode(sample(), 'i', { parentId: 'b', slot: 'trailingIcon', index: 0 });
    expect(ids(at(root, 'b'), 'leadingIcon')).toEqual([]);
    expect(ids(at(root, 'b'), 'trailingIcon')).toEqual(['i']);
  });

  it('refuses to move a node into itself or its descendants, and the root anywhere', () => {
    const root = sample();
    expect(moveNode(root, 'a', { parentId: 'r', slot: 'children', index: 0 })).toBe(root);
    expect(moveNode(root, 'a', { parentId: 'a', slot: 'children', index: 0 })).toBe(root);
    expect(moveNode(root, ROOT_ID, { parentId: 'a', slot: 'children', index: 0 })).toBe(root);
  });

  it('shifts among siblings and stops at the edges', () => {
    const up = shiftNode(sample(), 't2', -1);
    expect(ids(at(up, 'a'))).toEqual(['t2', 't1', 'r']);
    const down = shiftNode(sample(), 't2', 1);
    expect(ids(at(down, 'a'))).toEqual(['t1', 'r', 't2']);
    const root = sample();
    expect(shiftNode(root, 't1', -1)).toBe(root);
    expect(shiftNode(root, 'r', 1)).toBe(root);
  });
});

describe('duplicate', () => {
  it('copies the subtree with fresh ids right after the original', () => {
    const { root, id } = duplicateNode(sample(), 'r', counter());
    expect(ids(at(root, 'a'))).toEqual(['t1', 't2', 'r', id]);
    const copy = at(root, id);
    expect(copy.type).toBe('row');
    expect(flatten(copy).map((node) => node.id)).toEqual(['x1', 'x2', 'x3']);
    expect(findNode(root, 'b')).toBeDefined();
  });

  it('gives every node of a subtree a new id', () => {
    const fresh = withFreshIds(sample(), counter('n'));
    const all = flatten(fresh).map((node) => node.id);
    expect(new Set(all).size).toBe(all.length);
    expect(all.every((id) => id.startsWith('n'))).toBe(true);
  });

  it('cannot duplicate the root', () => {
    const root = sample();
    expect(duplicateNode(root, ROOT_ID).root).toBe(root);
  });
});
