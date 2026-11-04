import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CanvasChange, CanvasEdge, CanvasGraph, CanvasNode, CanvasPort } from '../components/canvas-types';
import { CanvasControls, CanvasMiniMap, CanvasPanel, NodeCanvas, type NodeCanvasApi, type NodeCanvasProps } from '../components/node-canvas';
import { useCanvasHistory } from '../components/node-canvas-history';

interface Data {
  title: string;
}

const PORTS: readonly CanvasPort[] = [
  { id: 'in', side: 'left', direction: 'in', type: 'object' },
  { id: 'out', side: 'right', direction: 'out', type: 'object' },
];
const node = (id: string, x: number, y: number, extra: Partial<CanvasNode<Data>> = {}): CanvasNode<Data> => ({
  id,
  kind: 'action',
  position: { x, y },
  width: 100,
  height: 40,
  ports: PORTS,
  data: { title: id.toUpperCase() },
  ...extra,
});
const link = (source: string, target: string, extra: Partial<CanvasEdge> = {}): CanvasEdge => ({
  id: `${source}-${target}`,
  source,
  sourcePort: 'out',
  target,
  targetPort: 'in',
  ...extra,
});
const GRAPH: CanvasGraph<Data> = { nodes: [node('a', 0, 0), node('b', 300, 0), node('c', 0, 200)], edges: [] };

const renderCard = (item: CanvasNode<Data>) => <div data-testid={`card-${item.id}`}>{item.data.title}</div>;
const titleOf = (item: CanvasNode<Data>) => item.data.title;

type HarnessProps = Partial<NodeCanvasProps<Data>> & {
  initial?: CanvasGraph<Data>;
  onChange?: (graph: CanvasGraph<Data>, change: CanvasChange) => void;
};

function Harness({ initial = GRAPH, onChange, ...props }: HarnessProps) {
  const [graph, setGraph] = useState(initial);
  return (
    <NodeCanvas<Data>
      aria-label="Граф"
      nodes={graph.nodes}
      edges={graph.edges}
      renderNode={renderCard}
      nodeLabel={titleOf}
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      onGraphChange={(next, change) => {
        setGraph(next);
        onChange?.(next, change);
      }}
      {...props}
    />
  );
}

const nodeEl = (id: string) => document.querySelector(`[data-slot=node-canvas-node][data-id="${id}"]`) as HTMLElement;
const portEl = (id: string, port: string) => nodeEl(id).querySelector(`[data-port="${port}"]`) as HTMLElement;
const root = () => document.querySelector('[data-slot=node-canvas]') as HTMLElement;
const lastChange = (spy: ReturnType<typeof vi.fn>) => spy.mock.calls.at(-1) as [CanvasGraph<Data>, CanvasChange];
const position = (graph: CanvasGraph<Data>, id: string) => graph.nodes.find((item) => item.id === id)?.position;

function drag(element: Element, from: [number, number], ...path: [number, number][]) {
  fireEvent.pointerDown(element, { button: 0, pointerId: 1, clientX: from[0], clientY: from[1] });
  for (const [x, y] of path) fireEvent.pointerMove(window, { pointerId: 1, clientX: x, clientY: y });
}
const release = (x: number, y: number) => fireEvent.pointerUp(window, { pointerId: 1, clientX: x, clientY: y });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('NodeCanvas', () => {
  it('places cards and draws ports named by direction and type', () => {
    render(<Harness />);
    expect(screen.getByRole('application', { name: 'Граф' })).toBeTruthy();
    expect(nodeEl('b').style.transform).toBe('translate(300px, 0px)');
    expect(within(nodeEl('a')).getByRole('button', { name: 'Вход, объект' })).toBeTruthy();
    expect(within(nodeEl('a')).getByRole('button', { name: 'Выход, объект' })).toBeTruthy();
    expect(screen.getByTestId('card-a').textContent).toBe('A');
  });

  it('selects on click and reports the selection', () => {
    const onChange = vi.fn();
    const onSelectionChange = vi.fn();
    render(<Harness onChange={onChange} onSelectionChange={onSelectionChange} />);
    fireEvent.pointerDown(nodeEl('a'), { button: 0, pointerId: 1, clientX: 50, clientY: 20 });
    release(50, 20);
    expect(lastChange(onChange)[1].type).toBe('select');
    expect(onSelectionChange).toHaveBeenLastCalledWith({ nodes: ['a'], edges: [] });
    expect(nodeEl('a').getAttribute('aria-label')).toBe('A, выделен');
  });

  it('drags a node and snaps it to the grid', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    drag(nodeEl('a'), [50, 20], [70, 30], [83, 48]);
    expect(nodeEl('a').dataset.dragging).toBe('true');
    release(83, 48);
    const [graph, change] = lastChange(onChange);
    expect(change).toMatchObject({ type: 'move', nodeIds: ['a'] });
    expect(position(graph, 'a')).toEqual({ x: 40, y: 20 });
  });

  it('snaps to a neighbour edge with a helper line; ⌘ drags freely', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    drag(nodeEl('c'), [50, 220], [53, 280]);
    expect(document.querySelector('[data-slot=node-canvas-guide]')).not.toBeNull();
    release(53, 280);
    expect(position(lastChange(onChange)[0], 'c')).toEqual({ x: 0, y: 260 });
    drag(nodeEl('c'), [50, 280], [53, 287]);
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 57, clientY: 291, metaKey: true });
    release(57, 291);
    expect(position(lastChange(onChange)[0], 'c')).toEqual({ x: 7, y: 271 });
  });

  it('connects an output to a fitting input and fades nodes that cannot take it', () => {
    const onChange = vi.fn();
    const initial = { nodes: [...GRAPH.nodes, node('d', 300, 200, { ports: [{ id: 'in', side: 'left', direction: 'in', type: 'number' }] })], edges: [] };
    render(<Harness initial={initial} onChange={onChange} />);
    drag(portEl('a', 'out'), [100, 20], [200, 20], [310, 25]);
    expect(nodeEl('d').dataset.dimmed).toBe('true');
    expect(nodeEl('b').dataset.dimmed).toBeUndefined();
    expect(portEl('b', 'in').dataset.snapped).toBe('true');
    expect(document.querySelector('[data-slot=node-canvas-connection]')).not.toBeNull();
    release(310, 25);
    const [graph, change] = lastChange(onChange);
    expect(change.type).toBe('connect');
    expect(graph.edges).toEqual([{ id: 'a:out->b:in', source: 'a', sourcePort: 'out', target: 'b', targetPort: 'in' }]);
    expect(document.querySelectorAll('[data-slot=node-canvas-edge]')).toHaveLength(1);
  });

  it('asks for a step when a connection is dropped on empty space', () => {
    const onRequestInsert = vi.fn();
    render(<Harness onRequestInsert={onRequestInsert} />);
    drag(portEl('a', 'out'), [100, 20], [400, 300], [700, 400]);
    release(700, 400);
    expect(onRequestInsert).toHaveBeenCalledWith({ position: { x: 700, y: 400 }, from: { nodeId: 'a', portId: 'out' } });
  });

  it('keeps one edge per input: a taken input refuses and nothing opens', () => {
    const onChange = vi.fn();
    const onRequestInsert = vi.fn();
    render(<Harness initial={{ ...GRAPH, edges: [link('c', 'b')] }} onChange={onChange} onRequestInsert={onRequestInsert} />);
    drag(portEl('a', 'out'), [100, 20], [200, 20], [320, 20]);
    expect(nodeEl('b').dataset.dimmed).toBe('true');
    release(320, 20);
    expect(onChange).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ type: 'connect' }));
    expect(onRequestInsert).not.toHaveBeenCalled();
  });

  it('reconnects the dragged end of a selected edge', () => {
    const onChange = vi.fn();
    render(<Harness initial={{ ...GRAPH, edges: [link('a', 'b', { selected: true })] }} onChange={onChange} />);
    const end = document.querySelector('[data-slot=node-canvas-edge-end][data-end=target]') as Element;
    drag(end, [300, 20], [100, 200], [5, 222]);
    release(5, 222);
    const [graph, change] = lastChange(onChange);
    expect(change).toEqual({ type: 'reconnect', edgeIds: ['a-b'] });
    expect(graph.edges[0]).toMatchObject({ source: 'a', target: 'c', targetPort: 'in' });
  });

  it('moves, selects and deletes from the keyboard and announces it', async () => {
    const onChange = vi.fn();
    render(<Harness initial={{ ...GRAPH, edges: [link('a', 'b')] }} onChange={onChange} />);
    act(() => nodeEl('a').focus());
    fireEvent.keyDown(nodeEl('a'), { key: 'Enter' });
    expect(lastChange(onChange)[1].type).toBe('select');
    fireEvent.keyDown(nodeEl('a'), { key: 'ArrowRight' });
    expect(lastChange(onChange)[1]).toMatchObject({ type: 'move', mergeKey: 'nudge' });
    fireEvent.keyDown(nodeEl('a'), { key: 'ArrowDown', shiftKey: true });
    expect(position(lastChange(onChange)[0], 'a')).toEqual({ x: 1, y: 20 });
    fireEvent.keyDown(nodeEl('a'), { key: 'Delete' });
    await waitFor(() => expect(lastChange(onChange)[1].type).toBe('delete'));
    expect(lastChange(onChange)[0]).toMatchObject({ edges: [] });
    expect(lastChange(onChange)[0].nodes.map((item) => item.id)).toEqual(['b', 'c']);
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Удалено: 2'));
  });

  it('asks before deleting', async () => {
    const onChange = vi.fn();
    const onBeforeDelete = vi.fn(() => Promise.resolve(false));
    render(<Harness initial={{ nodes: [node('a', 0, 0, { selected: true })], edges: [] }} onChange={onChange} onBeforeDelete={onBeforeDelete} />);
    act(() => nodeEl('a').focus());
    fireEvent.keyDown(nodeEl('a'), { key: 'Backspace' });
    await waitFor(() => expect(onBeforeDelete).toHaveBeenCalledWith({ nodes: ['a'], edges: [] }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('selects all, copies and pastes with new ids, and hands ⌘Z / ⇧⌘Z to history', () => {
    const onChange = vi.fn();
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    render(<Harness initial={{ ...GRAPH, edges: [link('a', 'b')] }} onChange={onChange} onUndo={onUndo} onRedo={onRedo} />);
    act(() => nodeEl('a').focus());
    fireEvent.keyDown(nodeEl('a'), { key: 'a', metaKey: true });
    expect(lastChange(onChange)[0].nodes.every((item) => item.selected)).toBe(true);
    fireEvent.keyDown(nodeEl('a'), { key: 'c', metaKey: true });
    fireEvent.keyDown(nodeEl('a'), { key: 'v', metaKey: true });
    const [graph, change] = lastChange(onChange);
    expect(change.type).toBe('paste');
    expect(graph.nodes).toHaveLength(6);
    const pasted = graph.nodes.slice(3);
    expect(pasted.every((item) => item.selected && !['a', 'b', 'c'].includes(item.id))).toBe(true);
    expect(pasted[1]?.position).toEqual({ x: 320, y: 20 });
    expect(graph.edges).toHaveLength(2);
    expect(graph.edges[1]).toMatchObject({ source: pasted[0]?.id, target: pasted[1]?.id });
    fireEvent.keyDown(nodeEl('a'), { key: 'z', metaKey: true });
    fireEvent.keyDown(nodeEl('a'), { key: 'z', metaKey: true, shiftKey: true });
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('selects what the frame touches and what the lasso encloses', () => {
    const onSelectionChange = vi.fn();
    render(<Harness onSelectionChange={onSelectionChange} />);
    drag(root(), [-20, -20], [60, 30], [120, 60]);
    expect(document.querySelector('[data-slot=node-canvas-marquee]')).not.toBeNull();
    release(120, 60);
    expect(onSelectionChange).toHaveBeenLastCalledWith({ nodes: ['a'], edges: [] });
    fireEvent.pointerDown(root(), { button: 0, pointerId: 1, clientX: 280, clientY: -20, altKey: true });
    for (const [x, y] of [
      [420, -20],
      [420, 60],
      [280, 60],
    ] as const)
      fireEvent.pointerMove(window, { pointerId: 1, clientX: x, clientY: y });
    release(280, 60);
    expect(onSelectionChange).toHaveBeenLastCalledWith({ nodes: ['b'], edges: [] });
  });

  it('pans on wheel and zooms on ⌘ + wheel around the pointer', () => {
    const onViewportChange = vi.fn();
    render(<Harness onViewportChange={onViewportChange} />);
    fireEvent.wheel(root(), { deltaY: 50, deltaX: 10 });
    expect(onViewportChange).toHaveBeenLastCalledWith({ x: -10, y: -50, zoom: 1 });
    fireEvent.wheel(root(), { deltaY: -100, ctrlKey: true, clientX: 0, clientY: 0 });
    expect(onViewportChange.mock.lastCall?.[0].zoom).toBeCloseTo(Math.E);
    fireEvent.wheel(root(), { deltaY: -100000, ctrlKey: true });
    expect(onViewportChange.mock.lastCall?.[0].zoom).toBe(4);
  });

  describe('with a size', () => {
    const sized = () => {
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
        return this.dataset.slot === 'node-canvas' ? 800 : 0;
      });
      vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
        return this.dataset.slot === 'node-canvas' ? 600 : 0;
      });
    };

    it('fits again when the canvas grows, until the user moves the view', () => {
      let width = 200;
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
        return this.dataset.slot === 'node-canvas' ? width : 0;
      });
      vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
        return this.dataset.slot === 'node-canvas' ? 600 : 0;
      });
      const resized: ((entries: ResizeObserverEntry[]) => void)[] = [];
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(callback: (entries: ResizeObserverEntry[]) => void) {
            resized.push(callback);
          }
          observe(): void {}
          unobserve(): void {}
          disconnect(): void {}
        },
      );
      const onViewportChange = vi.fn();
      render(<Harness defaultViewport={undefined} onViewportChange={onViewportChange} />);
      const narrow = onViewportChange.mock.lastCall?.[0].zoom as number;
      width = 800;
      act(() => resized.forEach((callback) => callback([])));
      expect(onViewportChange.mock.lastCall?.[0].zoom).toBeGreaterThan(narrow);
      fireEvent.wheel(root(), { deltaX: 10, deltaY: 50 });
      const moved = onViewportChange.mock.lastCall?.[0];
      width = 400;
      act(() => resized.forEach((callback) => callback([])));
      expect(onViewportChange.mock.lastCall?.[0]).toEqual(moved);
      vi.unstubAllGlobals();
    });

    it('fits the graph on mount when no viewport is given', () => {
      sized();
      const onViewportChange = vi.fn();
      render(<Harness defaultViewport={undefined} onViewportChange={onViewportChange} />);
      expect(onViewportChange).toHaveBeenCalledWith({ x: 48, y: expect.closeTo(88.8, 5), zoom: 1.76 });
    });

    it('fits, zooms and centres a node through the handle', () => {
      sized();
      const ref = createRef<NodeCanvasApi>();
      const onViewportChange = vi.fn();
      render(<Harness ref={ref} onViewportChange={onViewportChange} />);
      act(() => ref.current?.fitView({ nodeIds: ['b'], duration: 0 }));
      expect(onViewportChange.mock.lastCall?.[0].zoom).toBe(4);
      act(() => ref.current?.centerOnNode('b', { zoom: 1, duration: 0 }));
      expect(onViewportChange).toHaveBeenLastCalledWith({ x: 50, y: 280, zoom: 1 });
      act(() => ref.current?.zoomTo(2));
      expect(onViewportChange).toHaveBeenLastCalledWith({ x: -300, y: 260, zoom: 2 });
      expect(ref.current?.screenToGraph({ x: 0, y: 0 })).toEqual({ x: 150, y: -130 });
    });
  });

  it('lays the graph out through the handle as one change', async () => {
    const onChange = vi.fn();
    const ref = createRef<NodeCanvasApi>();
    render(<Harness ref={ref} initial={{ ...GRAPH, edges: [link('a', 'b'), link('b', 'c')] }} onChange={onChange} />);
    act(() => ref.current?.layout({ duration: 0, direction: 'right' }));
    await waitFor(() => expect(lastChange(onChange)[1].type).toBe('layout'));
    const graph = lastChange(onChange)[0];
    expect(position(graph, 'b')?.x).toBe(164);
    expect(position(graph, 'c')?.x).toBe(328);
  });

  it('runs packets along a running edge unless motion is reduced', () => {
    const graph = { ...GRAPH, edges: [link('a', 'b', { status: 'running' })] };
    const { unmount } = render(<Harness initial={graph} />);
    expect(document.querySelectorAll('[data-slot=node-canvas-packet]')).toHaveLength(4);
    unmount();
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query, addEventListener: () => {}, removeEventListener: () => {} }));
    render(<Harness initial={graph} />);
    expect(document.querySelectorAll('[data-slot=node-canvas-packet]')).toHaveLength(0);
  });

  it('offers «+» on a hovered edge, selects it on press and deletes it alone', async () => {
    const onChange = vi.fn();
    const onInsertOnEdge = vi.fn();
    render(<Harness initial={{ ...GRAPH, edges: [link('a', 'b')] }} onChange={onChange} onInsertOnEdge={onInsertOnEdge} />);
    const edge = document.querySelector('[data-slot=node-canvas-edge]') as Element;
    fireEvent.pointerEnter(edge);
    fireEvent.click(screen.getByRole('button', { name: 'Вставить шаг в связь' }));
    expect(onInsertOnEdge).toHaveBeenCalledWith(expect.objectContaining({ id: 'a-b' }), { x: 200, y: 20 });
    fireEvent.pointerDown(edge, { button: 0, pointerId: 1 });
    expect(lastChange(onChange)[0].edges[0]?.selected).toBe(true);
    fireEvent.keyDown(edge, { key: 'Delete' });
    await waitFor(() => expect(lastChange(onChange)[1]).toEqual({ type: 'delete', nodeIds: [], edgeIds: ['a-b'] }));
    expect(lastChange(onChange)[0].nodes).toHaveLength(3);
  });

  it('edits an edge label on double click', () => {
    const onChange = vi.fn();
    render(<Harness initial={{ ...GRAPH, edges: [link('a', 'b', { label: 'да' })] }} onChange={onChange} />);
    fireEvent.doubleClick(screen.getByText('да'));
    const input = screen.getByRole('textbox', { name: 'Подпись связи' });
    fireEvent.change(input, { target: { value: 'нет' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(lastChange(onChange)).toEqual([expect.objectContaining({ edges: [expect.objectContaining({ label: 'нет' })] }), { type: 'label', edgeIds: ['a-b'] }]);
  });

  it('hides the steps of a collapsed group and leads their edges to the group', () => {
    const graph: CanvasGraph<Data> = {
      nodes: [node('g', 0, 0, { kind: 'group', width: 300, height: 200, collapsed: true }), node('a', 20, 40, { parentId: 'g' }), node('b', 500, 0)],
      edges: [link('a', 'b')],
    };
    render(<Harness initial={graph} />);
    expect(screen.queryByTestId('card-a')).toBeNull();
    expect(screen.getByTestId('card-g')).toBeTruthy();
    expect(document.querySelector('[data-slot=node-canvas-edge-path]')?.getAttribute('d')).toMatch(/^M300 100 /);
  });

  it('drops a node into a group and resizes the group from a handle', () => {
    const onChange = vi.fn();
    const graph: CanvasGraph<Data> = { nodes: [...GRAPH.nodes, node('g', 500, 300, { kind: 'group', width: 300, height: 200 })], edges: [] };
    render(<Harness initial={graph} onChange={onChange} />);
    drag(nodeEl('a'), [50, 20], [300, 200], [650, 380]);
    expect(nodeEl('g').dataset.dropTarget).toBe('true');
    release(650, 380);
    expect(lastChange(onChange)[0].nodes.find((item) => item.id === 'a')).toMatchObject({ parentId: 'g', position: { x: 100, y: 60 } });

    fireEvent.pointerDown(nodeEl('g'), { button: 0, pointerId: 1, clientX: 790, clientY: 490 });
    release(790, 490);
    const handle = nodeEl('g').querySelector('[data-handle=se]') as Element;
    drag(handle, [800, 500], [843, 517]);
    expect(screen.getByText('340 × 220')).toBeTruthy();
    release(843, 517);
    expect(lastChange(onChange)).toEqual([
      expect.objectContaining({ nodes: expect.arrayContaining([expect.objectContaining({ id: 'g', width: 340, height: 220, position: { x: 500, y: 300 } })]) }),
      { type: 'resize', nodeIds: ['g'] },
    ]);
  });

  it('asks to insert on Enter on the canvas and on double click on empty space; Tab leaves the canvas', () => {
    const onRequestInsert = vi.fn();
    render(<Harness onRequestInsert={onRequestInsert} />);
    act(() => root().focus());
    expect(fireEvent.keyDown(root(), { key: 'Tab' })).toBe(true);
    expect(fireEvent.keyDown(root(), { key: 'Tab', shiftKey: true })).toBe(true);
    expect(onRequestInsert).not.toHaveBeenCalled();
    fireEvent.keyDown(root(), { key: 'Enter' });
    expect(onRequestInsert).toHaveBeenCalledWith({ position: { x: 0, y: 0 }, from: undefined });
    fireEvent.doubleClick(root(), { clientX: 600, clientY: 500 });
    expect(onRequestInsert).toHaveBeenLastCalledWith({ position: { x: 600, y: 500 } });
  });

  it('connects a focused port to the selected step with Enter, and ⌥Tab walks the ports', () => {
    const onChange = vi.fn();
    render(<Harness initial={{ ...GRAPH, nodes: [node('a', 0, 0, { selected: true }), node('b', 300, 0)] }} onChange={onChange} />);
    act(() => nodeEl('b').focus());
    fireEvent.keyDown(nodeEl('b'), { key: 'Tab', altKey: true });
    expect(document.activeElement).toBe(portEl('b', 'in'));
    fireEvent.keyDown(portEl('b', 'in'), { key: 'Enter' });
    expect(lastChange(onChange)[0].edges).toEqual([expect.objectContaining({ source: 'a', target: 'b' })]);
    fireEvent.keyDown(portEl('b', 'in'), { key: 'Escape' });
    expect(document.activeElement).toBe(nodeEl('b'));
  });

  it('walks the ports and edges of the focused step with ] and [, Esc goes back to the step', () => {
    render(<Harness initial={{ ...GRAPH, edges: [link('a', 'b')] }} />);
    const edgeEl = () => document.querySelector('[data-slot=node-canvas-edge]') as SVGGElement;
    act(() => nodeEl('b').focus());
    fireEvent.keyDown(nodeEl('b'), { key: ']', code: 'BracketRight' });
    expect(document.activeElement).toBe(portEl('b', 'in'));
    fireEvent.keyDown(portEl('b', 'in'), { key: 'ъ', code: 'BracketRight' });
    expect(document.activeElement).toBe(portEl('b', 'out'));
    fireEvent.keyDown(portEl('b', 'out'), { key: ']', code: 'BracketRight' });
    expect(document.activeElement).toBe(edgeEl());
    fireEvent.keyDown(edgeEl(), { key: ']', code: 'BracketRight' });
    expect(document.activeElement).toBe(nodeEl('b'));
    fireEvent.keyDown(nodeEl('b'), { key: '[', code: 'BracketLeft' });
    expect(document.activeElement).toBe(edgeEl());
    fireEvent.keyDown(edgeEl(), { key: 'Escape' });
    expect(document.activeElement).toBe(nodeEl('b'));
  });

  it('arrows move focus to the neighbour when the focused step is not selected', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    act(() => nodeEl('a').focus());
    fireEvent.keyDown(nodeEl('a'), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(nodeEl('b'));
    fireEvent.keyDown(nodeEl('b'), { key: 'ArrowDown', shiftKey: true });
    expect(onChange).not.toHaveBeenCalled();
    expect(nodeEl('b').style.transform).toBe('translate(300px, 0px)');
  });

  it('draws renderEmpty in the middle of an empty canvas and keeps Enter for insert', () => {
    const onRequestInsert = vi.fn();
    const { rerender } = render(<Harness initial={{ nodes: [], edges: [] }} onRequestInsert={onRequestInsert} renderEmpty={() => <p>Пусто</p>} />);
    const empty = document.querySelector('[data-slot=node-canvas-empty]') as HTMLElement;
    expect(within(empty).getByText('Пусто')).toBeTruthy();
    expect(root().tabIndex).toBe(0);
    fireEvent.keyDown(root(), { key: 'Enter' });
    expect(onRequestInsert).toHaveBeenCalledTimes(1);
    rerender(<NodeCanvas<Data> aria-label="Граф" nodes={GRAPH.nodes} edges={[]} renderNode={renderCard} renderEmpty={() => <p>Пусто</p>} />);
    expect(document.querySelector('[data-slot=node-canvas-empty]')).toBeNull();
  });

  it('read-only hides ports and does not move nodes', () => {
    const onChange = vi.fn();
    render(<Harness readOnly onChange={onChange} />);
    expect(document.querySelector('[data-slot=node-canvas-port]')).toBeNull();
    drag(nodeEl('a'), [50, 20], [150, 120]);
    release(150, 120);
    expect(onChange.mock.calls.every(([, change]) => change.type === 'select')).toBe(true);
  });

  it('works with useCanvasHistory: a drag is one step back', () => {
    function WithHistory() {
      const history = useCanvasHistory(GRAPH);
      return (
        <NodeCanvas<Data>
          aria-label="Граф"
          nodes={history.graph.nodes}
          edges={history.graph.edges}
          renderNode={renderCard}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          onGraphChange={history.change}
          onUndo={history.undo}
          onRedo={history.redo}
        />
      );
    }
    render(<WithHistory />);
    drag(nodeEl('a'), [50, 20], [150, 120]);
    release(150, 120);
    expect(nodeEl('a').style.transform).toBe('translate(100px, 100px)');
    act(() => nodeEl('a').focus());
    fireEvent.keyDown(nodeEl('a'), { key: 'z', metaKey: true });
    expect(nodeEl('a').style.transform).toBe('translate(0px, 0px)');
  });
});

describe('CanvasPanel, CanvasControls, CanvasMiniMap', () => {
  it('puts panels on the screen layer and zooms, fits and locks from the controls', () => {
    const onViewportChange = vi.fn();
    const onChange = vi.fn();
    render(
      <Harness onViewportChange={onViewportChange} onChange={onChange}>
        <CanvasPanel position="bottom-left">
          <CanvasControls />
        </CanvasPanel>
      </Harness>,
    );
    const overlay = document.querySelector('[data-slot=node-canvas-overlay]') as HTMLElement;
    const toolbar = within(overlay).getByRole('toolbar', { name: 'Масштаб' });
    expect(within(toolbar).getByRole('button', { name: 'Масштаб 100 %' })).toBeTruthy();
    fireEvent.click(within(toolbar).getByRole('button', { name: 'Увеличить' }));
    expect(onViewportChange.mock.lastCall?.[0].zoom).toBeCloseTo(1.2);
    const lock = within(toolbar).getByRole('button', { name: 'Заблокировать' });
    fireEvent.click(lock);
    expect(within(toolbar).getByRole('button', { name: 'Разблокировать' }).getAttribute('aria-pressed')).toBe('true');
    drag(nodeEl('a'), [50, 20], [150, 120]);
    release(150, 120);
    expect(onChange.mock.calls.some(([, change]) => change.type === 'move')).toBe(false);
  });

  it('marks errors and search hits on the mini-map and folds into «Карта» with the error count', () => {
    const graph = { ...GRAPH, nodes: [node('a', 0, 0, { status: 'error' }), node('b', 300, 0), node('c', 0, 200)] };
    render(
      <Harness initial={graph} highlightedIds={['b']}>
        <CanvasPanel position="bottom-right">
          <CanvasMiniMap cursors={[{ id: 'anna', position: { x: 10, y: 10 }, color: 'red', name: 'Анна' }]} />
        </CanvasPanel>
      </Harness>,
    );
    const marks = [...document.querySelectorAll('[data-slot=canvas-minimap-node]')].map((item) => item.getAttribute('data-mark'));
    expect(marks).toEqual(['error', 'found', 'node']);
    expect(document.querySelectorAll('[data-slot=canvas-minimap-cursor]')).toHaveLength(1);
    expect(nodeEl('b').dataset.highlighted).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Свернуть карту' }));
    expect(screen.getByRole('button', { name: 'Показать карту, ошибок: 1' })).toBeTruthy();
  });

  it('folds the mini-map on a canvas narrower than 480 so it does not cover the controls', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(375);
    render(
      <Harness>
        <CanvasPanel position="bottom-left">
          <CanvasControls />
        </CanvasPanel>
        <CanvasPanel position="bottom-right">
          <CanvasMiniMap />
        </CanvasPanel>
      </Harness>,
    );
    expect(document.querySelector('[data-slot=canvas-minimap]')).toBeNull();
    // Icon only: the word would push the button under the controls on a phone.
    expect(screen.getByRole('button', { name: 'Показать карту' }).textContent).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Показать карту' }));
    expect(document.querySelector('[data-slot=canvas-minimap]')).not.toBeNull();
  });
});
