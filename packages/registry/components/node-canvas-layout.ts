// Layered auto-layout without dagre/elk: ranks by longest path, order by barycentre, then stack.
import type { CanvasEdge, CanvasGraph, CanvasNode, CanvasPoint } from './canvas-types';
import { nodeSize, type CanvasSize } from './node-canvas-geometry';

export type CanvasLayoutDirection = 'right' | 'down';

export interface CanvasLayoutOptions {
  /** right: steps go left to right · down: top to bottom. */
  direction?: CanvasLayoutDirection;
  /** Between steps one after another («Между шагами»). */
  rankGap?: number;
  /** Between parallel branches («Между ветками»). */
  nodeGap?: number;
  /** Lay out only these nodes; the rest stay put. Default: every node. */
  nodeIds?: readonly string[];
  /** Measured sizes of nodes without width/height. */
  sizes?: ReadonlyMap<string, CanvasSize>;
}

const SWEEPS = 4;

interface Ranked {
  /** Node ids by rank, each rank in order across the flow. */
  ranks: string[][];
  rank: Map<string, number>;
  preds: Map<string, string[]>;
  succs: Map<string, string[]>;
}

/** Ranks of `ids` along edges between them, cycles broken at their back edges. */
function rankNodes(ids: readonly string[], edges: readonly (readonly [string, string])[], along: (id: string) => number): Ranked {
  const succs = new Map<string, string[]>(ids.map((id) => [id, []]));
  const indegree = new Map<string, number>(ids.map((id) => [id, 0]));
  for (const [from, to] of edges) {
    const list = succs.get(from);
    if (!list || from === to || list.includes(to) || !succs.has(to)) continue;
    list.push(to);
    indegree.set(to, (indegree.get(to) ?? 0) + 1);
  }
  // DFS from sources first (then by position): an edge back into the current path is a loop and is ignored.
  const starts = [...ids].sort((a, b) => (indegree.get(a) ?? 0) - (indegree.get(b) ?? 0) || along(a) - along(b));
  const state = new Map<string, 'open' | 'done'>();
  const kept = new Map<string, string[]>(ids.map((id) => [id, []]));
  const visit = (id: string) => {
    state.set(id, 'open');
    for (const next of succs.get(id) ?? []) {
      const seen = state.get(next);
      if (seen === 'open') continue;
      kept.get(id)?.push(next);
      if (seen === undefined) visit(next);
    }
    state.set(id, 'done');
  };
  for (const id of starts) if (!state.has(id)) visit(id);

  const preds = new Map<string, string[]>(ids.map((id) => [id, []]));
  for (const [from, list] of kept) for (const to of list) preds.get(to)?.push(from);
  const rank = new Map<string, number>();
  const rankOf = (id: string): number => {
    const known = rank.get(id);
    if (known !== undefined) return known;
    rank.set(id, 0);
    const value = Math.max(0, ...(preds.get(id) ?? []).map((pred) => rankOf(pred) + 1));
    rank.set(id, value);
    return value;
  };
  for (const id of ids) rankOf(id);
  const ranks: string[][] = [];
  for (const id of ids) {
    const index = rank.get(id) ?? 0;
    (ranks[index] ??= []).push(id);
  }
  return { ranks: ranks.filter(Boolean), rank, preds, succs: kept };
}

/** Node ids in the order the flow runs: rank by rank, top to bottom then left to right inside a rank. */
export function flowOrder(graph: CanvasGraph): string[] {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const position = (id: string): CanvasPoint => byId.get(id)?.position ?? { x: 0, y: 0 };
  const { ranks } = rankNodes(
    graph.nodes.map((node) => node.id),
    graph.edges.map((edge) => [edge.source, edge.target] as const),
    (id) => position(id).x + position(id).y,
  );
  return ranks.flatMap((rank) => [...rank].sort((a, b) => position(a).y - position(b).y || position(a).x - position(b).x));
}

/** The member of `bucket` that is `id` or contains it. */
function memberOf(id: string, bucket: ReadonlySet<string>, byId: ReadonlyMap<string, CanvasNode>): string | undefined {
  let current: string | undefined = id;
  for (let depth = 0; current !== undefined && depth <= byId.size; depth++) {
    if (bucket.has(current)) return current;
    current = byId.get(current)?.parentId;
  }
  return undefined;
}

function layoutBucket(
  members: readonly CanvasNode[],
  edges: readonly CanvasEdge[],
  byId: ReadonlyMap<string, CanvasNode>,
  options: Required<Omit<CanvasLayoutOptions, 'nodeIds' | 'sizes'>> & { sizes: ReadonlyMap<string, CanvasSize> },
): Map<string, CanvasPoint> {
  const down = options.direction === 'down';
  const ids = members.map((node) => node.id);
  const set = new Set(ids);
  const size = (id: string): CanvasSize => {
    const node = byId.get(id) as CanvasNode;
    return nodeSize(node, options.sizes.get(id));
  };
  const along = (id: string) => (down ? byId.get(id)?.position.y : byId.get(id)?.position.x) ?? 0;
  const across = (id: string) => (down ? byId.get(id)?.position.x : byId.get(id)?.position.y) ?? 0;
  const pairs: (readonly [string, string])[] = [];
  for (const edge of edges) {
    const from = memberOf(edge.source, set, byId);
    const to = memberOf(edge.target, set, byId);
    if (from !== undefined && to !== undefined) pairs.push([from, to]);
  }
  const { ranks, preds, succs } = rankNodes(ids, pairs, along);

  for (const rank of ranks) rank.sort((a, b) => across(a) - across(b));
  const order = new Map<string, number>();
  const index = () => ranks.forEach((rank) => rank.forEach((id, place) => order.set(id, place)));
  index();
  for (let sweep = 0; sweep < SWEEPS; sweep++) {
    const forward = sweep % 2 === 0;
    const sequence = forward ? ranks : [...ranks].reverse();
    for (const rank of sequence) {
      const key = new Map(
        rank.map((id) => {
          const linked = (forward ? preds.get(id) : succs.get(id)) ?? [];
          const places = linked.map((other) => order.get(other) ?? 0);
          return [id, places.length ? places.reduce((sum, place) => sum + place, 0) / places.length : (order.get(id) ?? 0)] as const;
        }),
      );
      rank.sort((a, b) => (key.get(a) ?? 0) - (key.get(b) ?? 0));
      rank.forEach((id, place) => order.set(id, place));
    }
  }

  const alongSize = (id: string) => (down ? size(id).height : size(id).width);
  const acrossSize = (id: string) => (down ? size(id).width : size(id).height);
  const placed = new Map<string, { along: number; across: number }>();
  let start = 0;
  for (const rank of ranks) {
    const depth = Math.max(...rank.map(alongSize));
    const total = rank.reduce((sum, id) => sum + acrossSize(id), 0) + options.nodeGap * (rank.length - 1);
    let offset = -total / 2;
    for (const id of rank) {
      placed.set(id, { along: start + (depth - alongSize(id)) / 2, across: offset });
      offset += acrossSize(id) + options.nodeGap;
    }
    start += depth + options.rankGap;
  }
  // Keep the laid-out block where its nodes were: same top-left corner.
  const minAlong = Math.min(...[...placed.values()].map((item) => item.along));
  const minAcross = Math.min(...[...placed.values()].map((item) => item.across));
  const originAlong = Math.min(...ids.map(along));
  const originAcross = Math.min(...ids.map(across));
  const out = new Map<string, CanvasPoint>();
  for (const [id, item] of placed) {
    const a = item.along - minAlong + originAlong;
    const c = item.across - minAcross + originAcross;
    out.set(id, down ? { x: c, y: a } : { x: a, y: c });
  }
  return out;
}

/**
 * Layered layout of the whole graph or of `nodeIds`. Nodes inside a group are laid out inside it, separately from
 * the top level; each laid-out block keeps its top-left corner. Pure: returns a new graph, untouched nodes keep identity.
 */
export function layoutGraph<TData>(graph: CanvasGraph<TData>, options: CanvasLayoutOptions = {}): CanvasGraph<TData> {
  const settings = {
    direction: options.direction ?? 'right',
    rankGap: options.rankGap ?? 64,
    nodeGap: options.nodeGap ?? 40,
    sizes: options.sizes ?? new Map<string, CanvasSize>(),
  };
  const chosen = options.nodeIds ? new Set(options.nodeIds) : null;
  const byId = new Map<string, CanvasNode>(graph.nodes.map((node) => [node.id, node]));
  const buckets = new Map<string, CanvasNode[]>();
  for (const node of graph.nodes) {
    if (chosen && !chosen.has(node.id)) continue;
    const key = node.parentId ?? '';
    buckets.set(key, [...(buckets.get(key) ?? []), node]);
  }
  const positions = new Map<string, CanvasPoint>();
  for (const members of buckets.values()) {
    for (const [id, point] of layoutBucket(members, graph.edges, byId, settings)) positions.set(id, point);
  }
  return {
    ...graph,
    nodes: graph.nodes.map((node) => {
      const point = positions.get(node.id);
      return point && (point.x !== node.position.x || point.y !== node.position.y) ? { ...node, position: point } : node;
    }),
  };
}
