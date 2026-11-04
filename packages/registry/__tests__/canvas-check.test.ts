import { describe, expect, it } from 'vitest';
import { checkGraph, diffGraphs, type CanvasProblem } from '../components/canvas-check';
import type { CanvasEdge, CanvasGraph, CanvasNode, CanvasNodeKind, CanvasPort } from '../components/canvas-types';

interface Step {
  title: string;
}

const flowIn: CanvasPort = { id: 'in', side: 'top', direction: 'in', type: 'flow' };
const flowOut: CanvasPort = { id: 'out', side: 'bottom', direction: 'out', type: 'flow' };

const node = (id: string, kind: CanvasNodeKind, ports: CanvasPort[] = [flowIn, flowOut]): CanvasNode<Step> => ({
  id,
  kind,
  position: { x: 0, y: 0 },
  ports,
  data: { title: id },
});

const edge = (source: string, target: string, sourcePort = 'out', targetPort = 'in'): CanvasEdge => ({
  id: `${source}.${sourcePort}-${target}.${targetPort}`,
  source,
  sourcePort,
  target,
  targetPort,
});

const trigger = node('Заявка', 'trigger', [flowOut]);
const label = (item: CanvasNode<Step>) => item.data.title;
const kinds = (problems: readonly CanvasProblem[]) => problems.map((problem) => problem.kind);

describe('checkGraph', () => {
  it('finds nothing in a straight chain from a trigger', () => {
    const graph: CanvasGraph<Step> = { nodes: [trigger, node('Сделка', 'action')], edges: [edge('Заявка', 'Сделка')] };
    expect(checkGraph(graph, { label })).toEqual([]);
  });

  it('an empty graph is fine', () => {
    expect(checkGraph({ nodes: [], edges: [] })).toEqual([]);
  });

  it('a graph without a trigger is an error', () => {
    const problems = checkGraph({ nodes: [node('Сделка', 'action')], edges: [] }, { label });
    expect(kinds(problems)).toContain('no-trigger');
    expect(problems.find((problem) => problem.kind === 'no-trigger')?.severity).toBe('error');
  });

  it('a cycle without a way out is an error that names the steps in order', () => {
    const graph: CanvasGraph<Step> = {
      nodes: [trigger, node('Напомнить', 'action'), node('Ждать 3 дня', 'wait')],
      edges: [edge('Заявка', 'Напомнить'), edge('Напомнить', 'Ждать 3 дня'), edge('Ждать 3 дня', 'Напомнить')],
    };
    const [cycle] = checkGraph(graph, { label }).filter((problem) => problem.kind === 'cycle');
    expect(cycle?.severity).toBe('error');
    expect(cycle?.nodeIds).toEqual(['Напомнить', 'Ждать 3 дня']);
    expect(cycle?.description).toContain('Напомнить → Ждать 3 дня → Напомнить');
  });

  it('a cycle with a condition that leads out of it is allowed', () => {
    const check = node('Ответил?', 'condition', [flowIn, { id: 'yes', side: 'right', direction: 'out', type: 'flow' }, { id: 'no', side: 'bottom', direction: 'out', type: 'flow' }]);
    const graph: CanvasGraph<Step> = {
      nodes: [trigger, node('Напомнить', 'action'), check, node('Сделка', 'action')],
      edges: [edge('Заявка', 'Напомнить'), edge('Напомнить', 'Ответил?'), edge('Ответил?', 'Напомнить', 'no'), edge('Ответил?', 'Сделка', 'yes')],
    };
    expect(kinds(checkGraph(graph, { label }))).not.toContain('cycle');
  });

  it('a step pointing at itself is a cycle', () => {
    const graph: CanvasGraph<Step> = { nodes: [trigger, node('Повтор', 'action')], edges: [edge('Заявка', 'Повтор'), edge('Повтор', 'Повтор')] };
    expect(kinds(checkGraph(graph, { label }))).toContain('cycle');
  });

  it('an unconnected required input is an error; an optional one is fine', () => {
    const invoice = node('Счёт в банк', 'action', [flowIn, { id: 'client', side: 'left', direction: 'in', type: 'object', label: 'клиент', required: true }, { id: 'note', side: 'left', direction: 'in', type: 'text' }]);
    const graph: CanvasGraph<Step> = { nodes: [trigger, invoice], edges: [edge('Заявка', 'Счёт в банк')] };
    const [empty] = checkGraph(graph, { label }).filter((problem) => problem.kind === 'required-input');
    expect(empty).toMatchObject({ severity: 'error', nodeIds: ['Счёт в банк'], portId: 'client' });
    expect(empty?.description).toBe('«Счёт в банк» ждёт «клиент», но к нему ничего не подключено.');
  });

  it('lets the caller decide which inputs are required', () => {
    const invoice = node('Счёт в банк', 'action', [flowIn, { id: 'note', side: 'left', direction: 'in', type: 'text', required: true }]);
    const graph: CanvasGraph<Step> = { nodes: [trigger, invoice], edges: [edge('Заявка', 'Счёт в банк')] };
    expect(kinds(checkGraph(graph, { label, isRequired: () => false }))).not.toContain('required-input');
  });

  it('a step the trigger never reaches is a warning; notes and groups are not steps', () => {
    const graph: CanvasGraph<Step> = {
      nodes: [trigger, node('Сделка', 'action'), node('Забытый', 'action'), node('Заметка', 'note', []), node('Группа', 'group', [])],
      edges: [edge('Заявка', 'Сделка')],
    };
    const unreachable = checkGraph(graph, { label }).filter((problem) => problem.kind === 'unreachable');
    expect(unreachable.map((problem) => problem.nodeIds)).toEqual([['Забытый']]);
    expect(unreachable[0]?.severity).toBe('warning');
  });

  it('a disabled step is skipped, not reported', () => {
    const graph: CanvasGraph<Step> = { nodes: [trigger, { ...node('Выключен', 'action'), disabled: true }], edges: [] };
    expect(kinds(checkGraph(graph, { label }))).not.toContain('unreachable');
  });

  it('a branch left open after a fork is a warning on that port', () => {
    const fork = node('Есть бюджет?', 'condition', [flowIn, { id: 'yes', side: 'right', direction: 'out', type: 'flow', label: 'да' }, { id: 'no', side: 'bottom', direction: 'out', type: 'flow', label: 'нет' }]);
    const graph: CanvasGraph<Step> = { nodes: [trigger, fork, node('Сделка', 'action')], edges: [edge('Заявка', 'Есть бюджет?'), edge('Есть бюджет?', 'Сделка', 'yes')] };
    const [open] = checkGraph(graph, { label }).filter((problem) => problem.kind === 'open-branch');
    expect(open).toMatchObject({ severity: 'warning', nodeIds: ['Есть бюджет?'], portId: 'no' });
    expect(open?.description).toContain('«нет»');
  });

  it('an edge to a missing step or port is a broken edge', () => {
    const graph: CanvasGraph<Step> = {
      nodes: [trigger, node('Сделка', 'action')],
      edges: [edge('Заявка', 'Сделка'), edge('Заявка', 'Пропал'), edge('Заявка', 'Сделка', 'out', 'nope'), edge('Сделка', 'Заявка', 'in', 'out')],
    };
    const broken = checkGraph(graph, { label }).filter((problem) => problem.kind === 'broken-edge');
    expect(broken.map((problem) => problem.edgeId)).toEqual(['Заявка.out-Пропал.in', 'Заявка.out-Сделка.nope', 'Сделка.in-Заявка.out']);
    expect(broken.every((problem) => problem.severity === 'error')).toBe(true);
  });

  it('text into a number is a warning, data into flow is an error, number into text is fine', () => {
    const parse = node('Разобрать', 'agent', [flowIn, flowOut, { id: 'task', side: 'right', direction: 'out', type: 'text' }, { id: 'budget', side: 'right', direction: 'out', type: 'number' }]);
    const deal = node('Сделка', 'action', [
      flowIn,
      { id: 'sum', side: 'left', direction: 'in', type: 'number', label: 'Сумма' },
      { id: 'title', side: 'left', direction: 'in', type: 'text' },
    ]);
    const graph: CanvasGraph<Step> = {
      nodes: [trigger, parse, deal],
      edges: [edge('Заявка', 'Разобрать'), edge('Разобрать', 'Сделка', 'task', 'sum'), edge('Разобрать', 'Сделка', 'budget', 'title'), edge('Разобрать', 'Сделка', 'task', 'in')],
    };
    const types = checkGraph(graph, { label }).filter((problem) => problem.kind === 'type-mismatch');
    expect(types.map((problem) => [problem.edgeId, problem.severity])).toEqual([
      ['Разобрать.task-Сделка.in', 'error'],
      ['Разобрать.task-Сделка.sum', 'warning'],
    ]);
    expect(types[1]?.title).toBe('Текст идёт в число');
  });

  it('puts errors before warnings', () => {
    const graph: CanvasGraph<Step> = { nodes: [node('Забытый', 'action'), node('Ещё', 'action')], edges: [edge('Забытый', 'Пропал')] };
    const severities = checkGraph(graph, { label }).map((problem) => problem.severity);
    expect(severities).toEqual([...severities].sort((a, b) => (a === b ? 0 : a === 'error' ? -1 : 1)));
  });

  it('gives every problem a stable unique id', () => {
    const graph: CanvasGraph<Step> = { nodes: [node('А', 'action'), node('Б', 'action')], edges: [edge('А', 'Б'), edge('Б', 'А')] };
    const ids = checkGraph(graph, { label }).map((problem) => problem.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(checkGraph(graph, { label }).map((problem) => problem.id)).toEqual(ids);
  });
});

describe('diffGraphs', () => {
  const before: CanvasGraph<Step> = {
    nodes: [trigger, node('Разобрать', 'agent'), node('Ответить', 'action')],
    edges: [edge('Заявка', 'Разобрать'), edge('Разобрать', 'Ответить')],
  };

  it('sorts steps into added, changed, removed and unchanged', () => {
    const after: CanvasGraph<Step> = {
      nodes: [trigger, { ...node('Разобрать', 'agent'), data: { title: 'Разобрать заявку' } }, node('Сделка', 'action')],
      edges: [edge('Заявка', 'Разобрать'), edge('Разобрать', 'Сделка')],
    };
    expect(diffGraphs(before, after)).toEqual({
      nodes: { added: ['Сделка'], changed: ['Разобрать'], removed: ['Ответить'], unchanged: ['Заявка'] },
      edges: { added: ['Разобрать.out-Сделка.in'], removed: ['Разобрать.out-Ответить.in'] },
    });
  });

  it('ignores position and selection: moving a step is not a change', () => {
    const after: CanvasGraph<Step> = { ...before, nodes: before.nodes.map((item) => ({ ...item, position: { x: 40, y: 80 }, selected: true, status: 'done' as const })) };
    expect(diffGraphs(before, after).nodes.changed).toEqual([]);
  });

  it('accepts a custom equality for step data', () => {
    const after: CanvasGraph<Step> = { ...before, nodes: before.nodes.map((item) => ({ ...item, data: { title: item.data.title.toUpperCase() } })) };
    expect(diffGraphs(before, after, { same: (a, b) => a.data.title.toLowerCase() === b.data.title.toLowerCase() }).nodes.changed).toEqual([]);
  });
});
