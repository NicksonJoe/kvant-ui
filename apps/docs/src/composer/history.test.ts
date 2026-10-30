import { describe, expect, it } from 'vitest';
import { composerReducer, initialState } from './history';
import { CHILDREN, ROOT_ID, emptyRoot, insertNode, setProps, type ComposerNode } from './model';

const text = (id: string): ComposerNode => ({ id, type: 'text', props: { text: id }, slots: {} });
const add = (root: ComposerNode, id: string) => insertNode(root, { parentId: ROOT_ID, slot: CHILDREN, index: 99 }, text(id));

describe('composerReducer', () => {
  it('undoes and redoes changes, keeping the selection when the node still exists', () => {
    const start = initialState(emptyRoot());
    const one = composerReducer(start, { type: 'change', root: add(start.root, 'a'), select: 'a' });
    const two = composerReducer(one, { type: 'change', root: add(one.root, 'b'), select: 'b' });
    expect(two.selected).toBe('b');

    const undone = composerReducer(two, { type: 'undo' });
    expect(undone.root).toBe(one.root);
    expect(undone.selected).toBe(ROOT_ID);

    const redone = composerReducer(undone, { type: 'redo' });
    expect(redone.root).toBe(two.root);
    expect(composerReducer(redone, { type: 'redo' })).toBe(redone);
    expect(composerReducer(start, { type: 'undo' })).toBe(start);
  });

  it('merges consecutive edits with the same key into one step', () => {
    const start = composerReducer(initialState(emptyRoot()), { type: 'change', root: add(emptyRoot(), 'a') });
    let state = start;
    for (const value of ['С', 'Се', 'Сер']) {
      state = composerReducer(state, { type: 'change', root: setProps(state.root, 'a', { text: value }), merge: 'a:text' });
    }
    expect(state.past).toHaveLength(2);
    expect(composerReducer(state, { type: 'undo' }).root).toBe(start.root);

    const reselected = composerReducer(composerReducer(state, { type: 'select', id: 'a' }), {
      type: 'change',
      root: setProps(state.root, 'a', { text: 'Север' }),
      merge: 'a:text',
    });
    expect(reselected.past).toHaveLength(3);
  });

  it('drops the redo branch on a new change and ignores no-op changes', () => {
    const start = initialState(emptyRoot());
    const one = composerReducer(start, { type: 'change', root: add(start.root, 'a') });
    const undone = composerReducer(one, { type: 'undo' });
    const other = composerReducer(undone, { type: 'change', root: add(undone.root, 'b') });
    expect(other.future).toHaveLength(0);
    expect(composerReducer(other, { type: 'change', root: other.root })).toBe(other);
  });

  it('falls back to the page when the selected node is gone', () => {
    const state = composerReducer(initialState(emptyRoot()), { type: 'select', id: 'missing' });
    expect(state.selected).toBe(ROOT_ID);
  });
});
