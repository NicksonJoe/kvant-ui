// Composer state: the document with undo / redo and the selected node.
import { ROOT_ID, findNode, type ComposerNode } from './model';

export interface ComposerState {
  root: ComposerNode;
  past: readonly ComposerNode[];
  future: readonly ComposerNode[];
  selected: string;
  /** Consecutive changes with the same key are one undo step (typing into a field). */
  mergeKey: string | null;
}

export type ComposerAction =
  | { type: 'change'; root: ComposerNode; select?: string; merge?: string }
  | { type: 'select'; id: string }
  | { type: 'undo' }
  | { type: 'redo' };

const LIMIT = 100;

export function initialState(root: ComposerNode): ComposerState {
  return { root, past: [], future: [], selected: ROOT_ID, mergeKey: null };
}

function existing(root: ComposerNode, id: string): string {
  return findNode(root, id) ? id : ROOT_ID;
}

export function composerReducer(state: ComposerState, action: ComposerAction): ComposerState {
  switch (action.type) {
    case 'change': {
      if (action.root === state.root) return action.select ? { ...state, selected: existing(state.root, action.select) } : state;
      const merging = action.merge !== undefined && action.merge === state.mergeKey;
      return {
        root: action.root,
        past: merging ? state.past : [...state.past, state.root].slice(-LIMIT),
        future: [],
        selected: existing(action.root, action.select ?? state.selected),
        mergeKey: action.merge ?? null,
      };
    }
    case 'select':
      return { ...state, selected: existing(state.root, action.id), mergeKey: null };
    case 'undo': {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return { root: previous, past: state.past.slice(0, -1), future: [state.root, ...state.future], selected: existing(previous, state.selected), mergeKey: null };
    }
    case 'redo': {
      const [next, ...future] = state.future;
      if (!next) return state;
      return { root: next, past: [...state.past, state.root], future, selected: existing(next, state.selected), mergeKey: null };
    }
  }
}
