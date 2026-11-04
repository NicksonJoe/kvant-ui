import { useState } from 'react';
import type { CanvasChange, CanvasGraph } from './canvas-types';

/** Nudges with the same mergeKey closer than this are one step. */
const MERGE_MS = 1000;

export interface CanvasHistoryOptions {
  /** Steps kept for undo. */
  limit?: number;
}

export interface CanvasHistory<TData> {
  graph: CanvasGraph<TData>;
  /** Pass as NodeCanvas onGraphChange: an edit adds a step, a selection replaces the present. */
  change: (graph: CanvasGraph<TData>, change: CanvasChange) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** New graph without history, e.g. after loading another version. */
  reset: (graph: CanvasGraph<TData>) => void;
}

interface State<TData> {
  past: readonly CanvasGraph<TData>[];
  present: CanvasGraph<TData>;
  future: readonly CanvasGraph<TData>[];
  mergeKey?: string;
  at: number;
}

/** Undo/redo over the whole graph, for ⌘Z / ⇧⌘Z and a history panel. */
export function useCanvasHistory<TData>(initial: CanvasGraph<TData>, { limit = 100 }: CanvasHistoryOptions = {}): CanvasHistory<TData> {
  const [state, setState] = useState<State<TData>>({ past: [], present: initial, future: [], at: 0 });

  const change = (graph: CanvasGraph<TData>, info: CanvasChange) =>
    setState((current) => {
      const now = Date.now();
      if (info.type === 'select') return { ...current, present: graph };
      if (info.mergeKey !== undefined && info.mergeKey === current.mergeKey && now - current.at < MERGE_MS) {
        return { ...current, present: graph, at: now };
      }
      return { past: [...current.past, current.present].slice(-limit), present: graph, future: [], mergeKey: info.mergeKey, at: now };
    });

  const undo = () =>
    setState((current) => {
      const previous = current.past.at(-1);
      if (!previous) return current;
      return { past: current.past.slice(0, -1), present: previous, future: [current.present, ...current.future], at: 0 };
    });

  const redo = () =>
    setState((current) => {
      const [next, ...rest] = current.future;
      if (!next) return current;
      return { past: [...current.past, current.present], present: next, future: rest, at: 0 };
    });

  return {
    graph: state.present,
    change,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    reset: (graph) => setState({ past: [], present: graph, future: [], at: 0 }),
  };
}
