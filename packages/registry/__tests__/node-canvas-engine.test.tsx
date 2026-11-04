import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CanvasEdge, CanvasGraph, CanvasNode, CanvasPort } from '../components/canvas-types';
import {
  absoluteRects,
  edgeGeometry,
  fitViewport,
  hiddenNodeIds,
  pointInPolygon,
  portPoint,
  snapRect,
  stepPoints,
  zoomAt,
} from '../components/node-canvas-geometry';
import { useCanvasHistory } from '../components/node-canvas-history';
import { flowOrder, layoutGraph } from '../components/node-canvas-layout';

const IN: CanvasPort = { id: 'in', side: 'left', direction: 'in' };
const OUT: CanvasPort = { id: 'out', side: 'right', direction: 'out' };
const node = (id: string, x: number, y: number, extra: Partial<CanvasNode> = {}): CanvasNode => ({
  id,
  kind: 'action',
  position: { x, y },
  width: 100,
  height: 40,
  ports: [IN, OUT],
  data: null,
  ...extra,
});
const edge = (source: string, target: string): CanvasEdge => ({ id: `${source}-${target}`, source, sourcePort: 'out', target, targetPort: 'in' });
const NO_SIZES = new Map();

describe('geometry', () => {
  it('adds parent offsets and hides children of collapsed groups', () => {
    const nodes = [node('g', 100, 100, { kind: 'group', width: 400, height: 200 }), node('a', 20, 30, { parentId: 'g' })];
    expect(absoluteRects(nodes, NO_SIZES).get('a')).toEqual({ x: 120, y: 130, width: 100, height: 40 });
    expect(hiddenNodeIds(nodes).size).toBe(0);
    expect([...hiddenNodeIds([{ ...(nodes[0] as CanvasNode), collapsed: true }, nodes[1] as CanvasNode])]).toEqual(['a']);
  });

  it('survives a parent cycle', () => {
    const rects = absoluteRects([node('a', 0, 0, { parentId: 'b' }), node('b', 10, 10, { parentId: 'a' })], NO_SIZES);
    expect(rects.size).toBe(2);
  });

  it('spreads ports evenly along a side, or puts them at their offset', () => {
    const rect = { x: 0, y: 0, width: 100, height: 90 };
    const ports: CanvasPort[] = [IN, { id: 'in2', side: 'left', direction: 'in' }, { ...OUT, offset: 20 }];
    expect(portPoint(rect, ports[0] as CanvasPort, ports)).toEqual({ x: 0, y: 30 });
    expect(portPoint(rect, ports[1] as CanvasPort, ports)).toEqual({ x: 0, y: 60 });
    expect(portPoint(rect, ports[2] as CanvasPort, ports)).toEqual({ x: 100, y: 20 });
  });

  it('routes a step edge forward through the middle and backward around', () => {
    expect(stepPoints({ point: { x: 0, y: 0 }, side: 'right' }, { point: { x: 100, y: 50 }, side: 'left' })).toEqual([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 50 },
    ]);
    const back = stepPoints({ point: { x: 100, y: 0 }, side: 'right' }, { point: { x: 0, y: 80 }, side: 'left' });
    expect(back[1]).toEqual({ x: 116, y: 0 });
    expect(back.at(-2)).toEqual({ x: -16, y: 80 });
    // top-to-bottom flow: one bend when the corner is in front of both ports
    expect(stepPoints({ point: { x: 0, y: 0 }, side: 'bottom' }, { point: { x: 60, y: 100 }, side: 'top' })).toHaveLength(4);
  });

  it('goes around a card in the way with the orthogonal path', () => {
    const source = { point: { x: 0, y: 0 }, side: 'right' as const };
    const target = { point: { x: 300, y: 0 }, side: 'left' as const };
    const blocker = { x: 120, y: -30, width: 60, height: 60 };
    expect(edgeGeometry('smoothstep', source, target).d).toBe('M0 0 L300 0');
    const around = edgeGeometry('orthogonal', source, target, [blocker]);
    expect(around.d).not.toBe('M0 0 L300 0');
    expect(Math.abs(around.mid.y)).toBeGreaterThanOrEqual(38);
  });

  it('puts the bezier middle halfway', () => {
    const geometry = edgeGeometry('bezier', { point: { x: 0, y: 0 }, side: 'right' }, { point: { x: 200, y: 100 }, side: 'left' });
    expect(geometry.mid.x).toBeCloseTo(100);
    expect(geometry.mid.y).toBeCloseTo(50);
    expect(geometry.d.startsWith('M0 0 C')).toBe(true);
  });

  it('zooms around the anchor and fits bounds with padding', () => {
    expect(zoomAt({ x: 0, y: 0, zoom: 1 }, 2, { x: 100, y: 100 })).toEqual({ x: -100, y: -100, zoom: 2 });
    expect(fitViewport({ x: 0, y: 0, width: 400, height: 200 }, { width: 500, height: 300 }, 50, 0.1, 4)).toEqual({ x: 50, y: 50, zoom: 1 });
    expect(fitViewport({ x: 0, y: 0, width: 10, height: 10 }, { width: 500, height: 300 }, 50, 0.1, 4).zoom).toBe(4);
  });

  it('tells points inside a lasso', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(pointInPolygon({ x: 5, y: 5 }, square)).toBe(true);
    expect(pointInPolygon({ x: 15, y: 5 }, square)).toBe(false);
  });

  it('snaps to a neighbour edge first, then to equal gaps, then to the grid', () => {
    const others = [{ x: 0, y: 0, width: 100, height: 40 }];
    const edgeSnap = snapRect({ x: 3, y: 200, width: 100, height: 40 }, others, { grid: 20, threshold: 6 });
    expect(edgeSnap.x).toBe(0);
    expect(edgeSnap.guides).toContainEqual(expect.objectContaining({ axis: 'x', at: 0 }));
    const between = [
      { x: 0, y: 0, width: 100, height: 40 },
      { x: 300, y: 0, width: 100, height: 40 },
    ];
    const gap = snapRect({ x: 147, y: 0, width: 100, height: 40 }, between, { grid: 0, threshold: 6 });
    expect(gap.x).toBe(150);
    expect(gap.gaps.map((mark) => mark.end - mark.start)).toEqual([50, 50]);
    const grid = snapRect({ x: 247, y: 333, width: 100, height: 40 }, [], { grid: 20, threshold: 6 });
    expect([grid.x, grid.y]).toEqual([240, 340]);
  });
});

describe('layoutGraph', () => {
  const graph: CanvasGraph = {
    nodes: [node('c', 0, 0), node('a', 500, 500), node('b', 40, 300), node('d', 900, 10)],
    edges: [edge('a', 'b'), edge('a', 'c'), edge('b', 'd'), edge('c', 'd'), edge('d', 'b')],
  };

  it('puts every rank after the previous one, cycles included', () => {
    const laid = layoutGraph(graph, { direction: 'right', rankGap: 64, nodeGap: 40 });
    const x = (id: string) => laid.nodes.find((item) => item.id === id)?.position.x ?? NaN;
    expect(x('b')).toBe(x('c'));
    expect(x('d')).toBe(x('b') + 100 + 64);
    expect(x('c')).toBe(x('a') + 100 + 64);
    // anchored at the top-left of what it laid out
    expect(Math.min(...laid.nodes.map((item) => item.position.x))).toBe(0);
    expect(Math.min(...laid.nodes.map((item) => item.position.y))).toBe(0);
  });

  it('stacks a rank down the cross axis with the node gap', () => {
    const laid = layoutGraph(graph, { direction: 'right', nodeGap: 40 });
    const b = laid.nodes.find((item) => item.id === 'b');
    const c = laid.nodes.find((item) => item.id === 'c');
    expect(Math.abs((b?.position.y ?? 0) - (c?.position.y ?? 0))).toBe(80);
  });

  it('only moves the chosen nodes', () => {
    const laid = layoutGraph(graph, { direction: 'down', nodeIds: ['a', 'b'] });
    expect(laid.nodes[0]).toBe(graph.nodes[0]);
    const a = laid.nodes.find((item) => item.id === 'a');
    const b = laid.nodes.find((item) => item.id === 'b');
    expect((b?.position.y ?? 0) - (a?.position.y ?? 0)).toBe(40 + 64);
  });

  it('orders nodes by flow for Tab', () => {
    expect(flowOrder(graph).slice(0, 2)).toEqual(['a', 'c']);
  });
});

describe('useCanvasHistory', () => {
  const start: CanvasGraph = { nodes: [node('a', 0, 0)], edges: [] };
  const moved = (x: number): CanvasGraph => ({ nodes: [node('a', x, 0)], edges: [] });

  it('undoes and redoes edits, skips selection, merges nudges', () => {
    const { result } = renderHook(() => useCanvasHistory(start));
    act(() => result.current.change(moved(10), { type: 'move' }));
    act(() => result.current.change({ nodes: [node('a', 10, 0, { selected: true })], edges: [] }, { type: 'select' }));
    act(() => result.current.change(moved(11), { type: 'move', mergeKey: 'nudge' }));
    act(() => result.current.change(moved(12), { type: 'move', mergeKey: 'nudge' }));
    expect(result.current.graph.nodes[0]?.position.x).toBe(12);
    act(() => result.current.undo());
    expect(result.current.graph.nodes[0]?.position.x).toBe(10);
    act(() => result.current.undo());
    expect(result.current.graph.nodes[0]?.position.x).toBe(0);
    expect(result.current.canUndo).toBe(false);
    act(() => result.current.redo());
    expect(result.current.graph.nodes[0]?.position.x).toBe(10);
    act(() => result.current.change(moved(30), { type: 'move' }));
    expect(result.current.canRedo).toBe(false);
  });
});
