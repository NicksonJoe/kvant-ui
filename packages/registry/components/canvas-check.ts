import type { CanvasEdge, CanvasGraph, CanvasNode, CanvasPort, CanvasPortType } from './canvas-types';

/* ---------- Graph check ---------- */

export type CanvasProblemSeverity = 'error' | 'warning';

export type CanvasProblemKind = 'no-trigger' | 'cycle' | 'required-input' | 'unreachable' | 'open-branch' | 'broken-edge' | 'type-mismatch';

export interface CanvasProblem {
  /** Stable between runs of the same graph: kind plus the ids involved. */
  id: string;
  kind: CanvasProblemKind;
  /** error blocks publishing, warning does not. */
  severity: CanvasProblemSeverity;
  /** «Цикл без выхода». */
  title: string;
  /** What is wrong and how to fix it, with step names. */
  description: string;
  /** Steps to show: the first one gets the camera. */
  nodeIds: readonly string[];
  edgeId?: string;
  portId?: string;
}

export interface CheckGraphOptions<TData> {
  /** Step name in the messages; default — the node id. */
  label?: (node: CanvasNode<TData>) => string;
  /** Inputs that must be connected; default — ports marked `required`, the same ones the canvas draws in danger. */
  isRequired?: (node: CanvasNode<TData>, port: CanvasPort) => boolean;
}

/** Notes and groups are not steps: they never run and need no connections. */
const isStep = (node: CanvasNode<unknown>) => node.kind !== 'note' && node.kind !== 'group';

const typeNames: Record<CanvasPortType, string> = {
  flow: 'поток',
  text: 'текст',
  number: 'число',
  date: 'дата',
  boolean: 'да/нет',
  object: 'объект',
  list: 'список',
  tool: 'инструмент',
  memory: 'память',
  knowledge: 'знания',
};

/** Russian name of a port type: «текст», «число». */
export function portTypeName(type: CanvasPortType): string {
  return typeNames[type];
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const plurals = new Intl.PluralRules('ru');

/** Russian noun for a count: `pluralRu(2, ['ошибка', 'ошибки', 'ошибок'])` → «ошибки». */
export function pluralRu(count: number, [one, few, many]: readonly [one: string, few: string, many: string]): string {
  const rule = plurals.select(count);
  return rule === 'one' ? one : rule === 'few' ? few : many;
}

// Anything becomes text without loss, so number, date and yes/no flow into text silently.
const intoText: ReadonlySet<CanvasPortType> = new Set(['number', 'date', 'boolean']);

function compatibility(from: CanvasPortType | undefined, to: CanvasPortType | undefined): 'ok' | 'convert' | 'wrong' {
  if (!from || !to || from === to) return 'ok';
  if (from === 'flow' || to === 'flow') return 'wrong';
  if (to === 'text' && intoText.has(from)) return 'ok';
  return 'convert';
}

/** Strongly connected components (Tarjan), each in discovery order. */
function components(ids: readonly string[], next: ReadonlyMap<string, readonly string[]>): string[][] {
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const result: string[][] = [];
  let counter = 0;

  const visit = (id: string) => {
    index.set(id, counter);
    low.set(id, counter);
    counter += 1;
    stack.push(id);
    onStack.add(id);
    for (const target of next.get(id) ?? []) {
      if (!index.has(target)) {
        visit(target);
        low.set(id, Math.min(low.get(id) ?? 0, low.get(target) ?? 0));
      } else if (onStack.has(target)) {
        low.set(id, Math.min(low.get(id) ?? 0, index.get(target) ?? 0));
      }
    }
    if (low.get(id) !== index.get(id)) return;
    const component: string[] = [];
    let member: string | undefined;
    do {
      member = stack.pop();
      if (member === undefined) break;
      onStack.delete(member);
      component.push(member);
    } while (member !== id);
    result.push(component);
  };

  for (const id of ids) if (!index.has(id)) visit(id);
  return result;
}

/** One loop through the component from its first step, to name it «А → Б → А». */
function loopPath(start: string, members: ReadonlySet<string>, next: ReadonlyMap<string, readonly string[]>): string[] {
  const path: string[] = [];
  const seen = new Set<string>();
  const walk = (id: string): boolean => {
    path.push(id);
    seen.add(id);
    for (const target of next.get(id) ?? []) {
      if (target === start) return true;
      if (members.has(target) && !seen.has(target) && walk(target)) return true;
    }
    path.pop();
    return false;
  };
  walk(start);
  return path;
}

/**
 * Finds what breaks a run before it starts: cycles with no way out, empty required inputs, steps the trigger never
 * reaches, branches left open after a fork, edges to missing ports and data of the wrong type. Errors come first.
 */
export function checkGraph<TData>(graph: CanvasGraph<TData>, options: CheckGraphOptions<TData> = {}): CanvasProblem[] {
  const { label = (node: CanvasNode<TData>) => node.id, isRequired = (_node: CanvasNode<TData>, port: CanvasPort) => port.required === true } = options;
  const problems: CanvasProblem[] = [];
  const steps = graph.nodes.filter((node) => isStep(node) && !node.disabled);
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const name = (id: string) => {
    const node = byId.get(id);
    return node ? label(node) : id;
  };
  const portOf = (node: CanvasNode<TData> | undefined, id: string) => node?.ports.find((port) => port.id === id);

  // Edges that point at real ports in the right direction; the rest are broken.
  const edges: CanvasEdge[] = [];
  for (const edge of graph.edges) {
    const source = portOf(byId.get(edge.source), edge.sourcePort);
    const target = portOf(byId.get(edge.target), edge.targetPort);
    if (source?.direction === 'out' && target?.direction === 'in') {
      edges.push(edge);
      continue;
    }
    problems.push({
      id: `broken-edge:${edge.id}`,
      kind: 'broken-edge',
      severity: 'error',
      title: 'Связь никуда не ведёт',
      description: `Связь «${name(edge.source)}» → «${name(edge.target)}» держится за порт, которого нет. Удалите её и протяните заново.`,
      nodeIds: [edge.source, edge.target].filter((id) => byId.has(id)),
      edgeId: edge.id,
    });
  }

  const next = new Map<string, string[]>();
  for (const edge of edges) next.set(edge.source, [...(next.get(edge.source) ?? []), edge.target]);

  if (steps.length && !steps.some((node) => node.kind === 'trigger')) {
    problems.push({
      id: 'no-trigger',
      kind: 'no-trigger',
      severity: 'error',
      title: 'Нет триггера',
      description: 'Граф ничто не запускает. Добавьте триггер: сообщение, расписание или вебхук.',
      nodeIds: [],
    });
  }

  for (const component of components(
    steps.map((node) => node.id),
    next,
  )) {
    const members = new Set(component);
    const [only] = component;
    if (component.length === 1 && only !== undefined && !(next.get(only) ?? []).includes(only)) continue;
    const exits = component.some((id) => {
      const kind = byId.get(id)?.kind;
      return (kind === 'condition' || kind === 'loop') && (next.get(id) ?? []).some((target) => !members.has(target));
    });
    if (exits) continue;
    const first = steps.find((node) => members.has(node.id))?.id ?? component[0] ?? '';
    const path = loopPath(first, members, next);
    const ordered = [...path, ...component.filter((id) => !path.includes(id))];
    problems.push({
      id: `cycle:${[...component].sort().join(',')}`,
      kind: 'cycle',
      severity: 'error',
      title: 'Цикл без выхода',
      description: `${[...path, first].map(name).join(' → ')}. Добавьте условие, которое выводит из цикла, например «не больше 3 раз».`,
      nodeIds: ordered,
    });
  }

  for (const node of steps) {
    for (const port of node.ports) {
      if (port.direction !== 'in' || !isRequired(node, port)) continue;
      if (edges.some((edge) => edge.target === node.id && edge.targetPort === port.id)) continue;
      problems.push({
        id: `required-input:${node.id}:${port.id}`,
        kind: 'required-input',
        severity: 'error',
        title: 'Пустой обязательный вход',
        description: `«${label(node)}» ждёт «${port.label ?? port.id}», но к нему ничего не подключено.`,
        nodeIds: [node.id],
        portId: port.id,
      });
    }
  }

  const triggers = steps.filter((node) => node.kind === 'trigger');
  if (triggers.length) {
    const reached = new Set<string>();
    const queue = triggers.map((node) => node.id);
    for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
      if (reached.has(id)) continue;
      reached.add(id);
      queue.push(...(next.get(id) ?? []));
    }
    for (const node of steps) {
      if (reached.has(node.id)) continue;
      problems.push({
        id: `unreachable:${node.id}`,
        kind: 'unreachable',
        severity: 'warning',
        title: 'Шаг не запустится',
        description: `До «${label(node)}» не доходит ни одна связь от триггера. Подключите его или удалите.`,
        nodeIds: [node.id],
      });
    }
  }

  for (const node of steps) {
    const outs = node.ports.filter((port) => port.direction === 'out' && (port.type ?? 'flow') === 'flow');
    if (outs.length < 2) continue;
    const used = outs.filter((port) => edges.some((edge) => edge.source === node.id && edge.sourcePort === port.id));
    if (!used.length) continue;
    for (const port of outs) {
      if (used.includes(port)) continue;
      problems.push({
        id: `open-branch:${node.id}:${port.id}`,
        kind: 'open-branch',
        severity: 'warning',
        title: 'Ветка обрывается',
        description: `У «${label(node)}» ветка «${port.label ?? port.id}» никуда не ведёт — этот случай останется без действия.`,
        nodeIds: [node.id],
        portId: port.id,
      });
    }
  }

  for (const edge of edges) {
    const from = portOf(byId.get(edge.source), edge.sourcePort)?.type;
    const to = portOf(byId.get(edge.target), edge.targetPort);
    const verdict = compatibility(from, to?.type);
    if (verdict === 'ok' || !from || !to?.type) continue;
    const wrong = verdict === 'wrong';
    problems.push({
      id: `type-mismatch:${edge.id}`,
      kind: 'type-mismatch',
      severity: wrong ? 'error' : 'warning',
      title: wrong ? 'Данные вместо шага' : `${capitalize(typeNames[from])} идёт в ${typeNames[to.type]}`,
      description: wrong
        ? `Связь «${name(edge.source)}» → «${name(edge.target)}» соединяет порядок шагов с данными. Подключите её к порту того же вида.`
        : `«${to.label ?? to.id}» получает ${typeNames[from]} — вставить конвертер «${typeNames[from]} → ${typeNames[to.type]}»?`,
      nodeIds: [edge.target, edge.source],
      edgeId: edge.id,
      portId: to.id,
    });
  }

  // Array#sort is stable: within a severity the order of discovery stays.
  return problems.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1));
}

/* ---------- Version diff ---------- */

export interface CanvasGraphDiff {
  nodes: { added: string[]; changed: string[]; removed: string[]; unchanged: string[] };
  edges: { added: string[]; removed: string[] };
}

export interface DiffGraphsOptions<TData> {
  /** Whether a step stayed the same; default compares kind, ports, parent, flags and data deeply. */
  same?: (before: CanvasNode<TData>, after: CanvasNode<TData>) => boolean;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (a instanceof Date || b instanceof Date) return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a).filter((key) => (a as Record<string, unknown>)[key] !== undefined);
  const keysB = Object.keys(b).filter((key) => (b as Record<string, unknown>)[key] !== undefined);
  return keysA.length === keysB.length && keysA.every((key) => deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
}

// Position, size, selection and run status are view state: moving a step is not an edit of the automation.
const meaning = <TData>({ kind, ports, parentId, disabled, collapsed, data }: CanvasNode<TData>) => ({ kind, ports, parentId, disabled, collapsed, data });

/** What changed between two versions: steps added, changed, removed; edges added and removed. */
export function diffGraphs<TData>(before: CanvasGraph<TData>, after: CanvasGraph<TData>, options: DiffGraphsOptions<TData> = {}): CanvasGraphDiff {
  const { same = (a: CanvasNode<TData>, b: CanvasNode<TData>) => deepEqual(meaning(a), meaning(b)) } = options;
  const old = new Map(before.nodes.map((node) => [node.id, node]));
  const fresh = new Set(after.nodes.map((node) => node.id));
  const diff: CanvasGraphDiff = { nodes: { added: [], changed: [], removed: [], unchanged: [] }, edges: { added: [], removed: [] } };
  for (const node of after.nodes) {
    const previous = old.get(node.id);
    if (!previous) diff.nodes.added.push(node.id);
    else if (same(previous, node)) diff.nodes.unchanged.push(node.id);
    else diff.nodes.changed.push(node.id);
  }
  diff.nodes.removed = before.nodes.filter((node) => !fresh.has(node.id)).map((node) => node.id);
  const key = (edge: CanvasEdge) => `${edge.source}\u0000${edge.sourcePort}\u0000${edge.target}\u0000${edge.targetPort}`;
  const oldEdges = new Set(before.edges.map(key));
  const newEdges = new Set(after.edges.map(key));
  diff.edges.added = after.edges.filter((edge) => !oldEdges.has(key(edge))).map((edge) => edge.id);
  diff.edges.removed = before.edges.filter((edge) => !newEdges.has(key(edge))).map((edge) => edge.id);
  return diff;
}
