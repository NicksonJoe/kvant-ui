import { useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from 'react';
import { CHART_COLORS, ChartLegend, ChartPlot, ChartTooltip, formatNumber, formatPercent, niceTicks, seriesColor, stepIndex, useWidth } from '../lib/chart-kit';
import { cn } from '../lib/cn';

/* ---------- Tidy tree layout ---------- */

export interface TidyNode {
  /** Width of the node box along the breadth axis. */
  width: number;
  children?: readonly TidyNode[];
}

interface Subtree {
  kids: Subtree[];
  /** Child centres relative to this node's centre. */
  offsets: number[];
  /** [left, right] edge per depth, relative to this node's centre. */
  contour: [number, number][];
}

function pack(node: TidyNode, gap: number): Subtree {
  const kids = (node.children ?? []).map((kid) => pack(kid, gap));
  const offsets: number[] = [];
  const merged: [number, number][] = [];
  kids.forEach((kid, i) => {
    let offset = 0;
    if (i > 0) {
      offset = -Infinity;
      kid.contour.forEach(([left], depth) => {
        const placed = merged[depth];
        if (placed) offset = Math.max(offset, placed[1] - left + gap);
      });
    }
    offsets.push(offset);
    kid.contour.forEach(([left, right], depth) => {
      const placed = merged[depth];
      merged[depth] = placed ? [Math.min(placed[0], left + offset), Math.max(placed[1], right + offset)] : [left + offset, right + offset];
    });
  });
  const shift = offsets.length > 0 ? ((offsets[0] ?? 0) + (offsets[offsets.length - 1] ?? 0)) / 2 : 0;
  const half = node.width / 2;
  return {
    kids,
    offsets: offsets.map((offset) => offset - shift),
    contour: [[-half, half], ...merged.map(([left, right]): [number, number] => [left - shift, right - shift])],
  };
}

/**
 * Tidy tree (Reingold–Tilford by contours): each subtree is packed against its left siblings as close as every level allows,
 * the parent sits over the middle of its first and last child. Deterministic. Returns centres in pre-order, left edge at 0.
 */
export function layoutTree(root: TidyNode, gap = 10): { nodes: { x: number; depth: number }[]; width: number } {
  const tree = pack(root, gap);
  const left = Math.min(...tree.contour.map(([edge]) => edge));
  const right = Math.max(...tree.contour.map(([, edge]) => edge));
  const nodes: { x: number; depth: number }[] = [];
  const walk = (sub: Subtree, x: number, depth: number) => {
    nodes.push({ x: x - left, depth });
    sub.kids.forEach((kid, i) => walk(kid, x + (sub.offsets[i] ?? 0), depth + 1));
  };
  walk(tree, 0, 0);
  return { nodes, width: right - left };
}

/* ---------- Tree navigation shared by the org chart and the mind map ---------- */

interface Branching<T> {
  children?: readonly T[];
}

interface Visible<T> {
  node: T;
  /** Path id: «0», «0.2», «0.2.1». */
  id: string;
  level: number;
  parent: string | null;
  position: number;
  size: number;
  branch: boolean;
  open: boolean;
}

function flatten<T extends Branching<T>>(node: T, closed: ReadonlySet<string>, id = '0', level = 1, parent: string | null = null, position = 1, size = 1): Visible<T>[] {
  const kids = node.children ?? [];
  const branch = kids.length > 0;
  const open = branch && !closed.has(id);
  return [
    { node, id, level, parent, position, size, branch, open },
    ...(open ? kids.flatMap((kid, i) => flatten(kid, closed, `${id}.${i}`, level + 1, id, i + 1, kids.length)) : []),
  ];
}

/** Ids of branches at `depth` (0-based) and deeper: they start folded. */
function foldedFrom<T extends Branching<T>>(node: T, depth: number, id = '0', level = 0): string[] {
  const kids = node.children ?? [];
  return [...(kids.length > 0 && level >= depth ? [id] : []), ...kids.flatMap((kid, i) => foldedFrom(kid, depth, `${id}.${i}`, level + 1))];
}

/** WAI tree pattern: ↑ ↓ through visible nodes, → opens or enters, ← closes or goes to the parent, Home End, Enter and Space fold. */
function useTree<T extends Branching<T>>(root: T, initiallyClosed: () => ReadonlySet<string>) {
  const [closed, setClosed] = useState<ReadonlySet<string>>(initiallyClosed);
  const [focused, setFocused] = useState<string | null>(null);
  const [focusIn, setFocusIn] = useState(false);
  const elements = useRef(new Map<string, HTMLElement | SVGElement>());
  const visible = flatten(root, closed);
  const tabStop = visible.find((item) => item.id === focused) ?? visible[0];

  const toggle = (id: string) =>
    setClosed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const focus = (id: string | null | undefined) => {
    if (!id) return;
    setFocused(id);
    elements.current.get(id)?.focus();
  };

  const itemProps = (item: Visible<T>, index: number) => ({
    ref: (element: HTMLElement | SVGElement | null) => {
      if (element) elements.current.set(item.id, element);
      else elements.current.delete(item.id);
    },
    role: 'treeitem',
    'aria-level': item.level,
    'aria-posinset': item.position,
    'aria-setsize': item.size,
    'aria-expanded': item.branch ? item.open : undefined,
    tabIndex: item.id === tabStop?.id ? 0 : -1,
    onFocus: () => {
      setFocused(item.id);
      setFocusIn(true);
    },
    onBlur: () => setFocusIn(false),
    onClick: () => {
      setFocused(item.id);
      if (item.branch) toggle(item.id);
    },
    onKeyDown: (event: KeyboardEvent) => {
      const fold = () => {
        if (item.branch) toggle(item.id);
      };
      const actions: Record<string, () => void> = {
        ArrowDown: () => focus(visible[index + 1]?.id),
        ArrowUp: () => focus(visible[index - 1]?.id),
        Home: () => focus(visible[0]?.id),
        End: () => focus(visible[visible.length - 1]?.id),
        ArrowRight: () => {
          if (item.branch && !item.open) toggle(item.id);
          else if (item.open) focus(`${item.id}.0`);
        },
        ArrowLeft: () => {
          if (item.open) toggle(item.id);
          else focus(item.parent);
        },
        Enter: fold,
        ' ': fold,
      };
      const action = actions[event.key];
      if (!action) return;
      event.preventDefault();
      action();
    },
  });

  return { visible, itemProps, active: focusIn ? focused : null };
}

function walkAll<T extends Branching<T>>(node: T, visit: (node: T, parent: T | null) => void, parent: T | null = null) {
  visit(node, parent);
  for (const kid of node.children ?? []) walkAll(kid, visit, node);
}

/* ---------- Org chart ---------- */

export interface OrgChartNode {
  /** Unit or person: «Продажи», «Анна Петрова». */
  title: string;
  /** Second line: head of the unit or role. */
  subtitle?: string;
  /** Number in the corner: people in the unit. */
  value?: number;
  children?: readonly OrgChartNode[];
}

export interface OrgChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  data: OrgChartNode;
  formatValue?: (value: number) => string;
  /** What `value` counts, for the tooltip and the table. */
  valueLabel?: string;
  /** Levels shown at first; deeper branches start folded with «+N». */
  expandDepth?: number;
  /** tree: top-down; stack: leaves stacked under their parent; indent: a list with 24 per level. auto takes the first that fits. */
  layout?: 'auto' | 'tree' | 'stack' | 'indent';
}

const CARD = { width: 118, root: 180, height: 52, level: 110, gap: 10, indent: 24, row: 60, stackIndent: 12 };

interface OrgBox {
  left: number;
  top: number;
  width: number;
  /** Placed in a column under its parent (stack layout). */
  stacked: boolean;
}

/** Top-down tree of cards 118×52 r8 with elbow links in border 1.5; the root in accent-soft. Branches fold; narrower screens stack leaves, then indent. */
export function OrgChart({
  data,
  formatValue = formatNumber,
  valueLabel = 'Сотрудников',
  expandDepth = 3,
  layout = 'auto',
  className,
  'aria-label': label,
  ...props
}: OrgChartProps) {
  const [ref, width] = useWidth(1272);
  const [hovered, setHovered] = useState<string | null>(null);
  const { visible, itemProps, active } = useTree(data, () => new Set(foldedFrom(data, expandDepth - 1)));

  const cardWidth = (level: number) => (level === 1 ? CARD.root : CARD.width);
  const kidsOf = (id: string) => visible.filter((item) => item.parent === id);
  const stackW = CARD.width + CARD.stackIndent;

  const tidyLayout = (stack: boolean) => {
    const order: (Visible<OrgChartNode> | null)[] = [];
    const stacks = new Set<string>();
    const build = (item: Visible<OrgChartNode>): TidyNode => {
      order.push(item);
      const kids = kidsOf(item.id);
      if (stack && item.level > 1 && kids.length > 0 && kids.every((kid) => !kid.open)) {
        stacks.add(item.id);
        // the column of stacked cards reaches into the levels below: reserve its width there with placeholders
        const dummy = (left: number): TidyNode => {
          order.push(null);
          return { width: stackW, children: left > 1 ? [dummy(left - 1)] : [] };
        };
        const levels = Math.ceil((kids.length * CARD.row) / CARD.level);
        return { width: stackW, children: levels > 0 ? [dummy(levels)] : [] };
      }
      return { width: cardWidth(item.level), children: kids.map(build) };
    };
    const first = visible[0];
    const tidy = first ? layoutTree(build(first), CARD.gap) : { nodes: [], width: 0 };
    const shift = Math.max(0, (width - tidy.width) / 2);
    const boxes = new Map<string, OrgBox>();
    order.forEach((item, i) => {
      const place = tidy.nodes[i];
      if (!item || !place) return;
      const column = stacks.has(item.id);
      const w = cardWidth(item.level);
      const left = shift + place.x - (column ? stackW : w) / 2;
      const top = place.depth * CARD.level;
      boxes.set(item.id, { left, top, width: w, stacked: false });
      if (column) {
        kidsOf(item.id).forEach((kid, k) =>
          boxes.set(kid.id, { left: left + CARD.stackIndent, top: top + (k + 1) * CARD.row, width: CARD.width, stacked: true }),
        );
      }
    });
    return { boxes, width: tidy.width };
  };

  const tree = tidyLayout(false);
  const stacked = tidyLayout(true);
  const mode = layout !== 'auto' ? layout : tree.width <= width ? 'tree' : stacked.width <= width ? 'stack' : 'indent';
  const boxes =
    mode === 'tree'
      ? tree.boxes
      : mode === 'stack'
        ? stacked.boxes
        : new Map(
            visible.map((item, index): [string, OrgBox] => {
              const left = (item.level - 1) * CARD.indent;
              return [item.id, { left, top: index * CARD.row, width: Math.max(160, Math.min(280, width - left)), stacked: false }];
            }),
          );
  const box = (id: string): OrgBox => boxes.get(id) ?? { left: 0, top: 0, width: 0, stacked: false };
  const canvasW = mode === 'indent' ? width : Math.max(width, (mode === 'tree' ? tree : stacked).width);
  const canvasH = Math.max(...visible.map((item) => box(item.id).top)) + CARD.height + 12;

  const links = visible.flatMap((item) => {
    if (!item.parent) return [];
    const from = box(item.parent);
    const to = box(item.id);
    if (mode === 'indent') return [{ id: item.id, d: `M${from.left + 12} ${from.top + CARD.height}V${to.top + CARD.height / 2}H${to.left}` }];
    if (to.stacked) return [{ id: item.id, d: `M${from.left + CARD.stackIndent / 2} ${from.top + CARD.height}V${to.top + CARD.height / 2}H${to.left}` }];
    const px = from.left + from.width / 2;
    const mid = from.top + CARD.height + (CARD.level - CARD.height) / 2;
    return [{ id: item.id, d: `M${px} ${from.top + CARD.height}V${mid}H${to.left + to.width / 2}V${to.top}` }];
  });

  const total = data.value;
  const tipId = hovered ?? active;
  const tipItem = visible.find((item) => item.id === tipId);
  const tipBox = tipItem ? box(tipItem.id) : null;
  // the side is decided by the card centre; ChartTooltip would decide by the anchor edge
  const flip = tipBox ? tipBox.left + tipBox.width / 2 > canvasW * 0.6 : false;

  const tableRows: { header: string; cells: string[] }[] = [];
  walkAll(data, (node, parent) =>
    tableRows.push({ header: node.title, cells: [node.subtitle ?? '', node.value === undefined ? '' : formatValue(node.value), parent?.title ?? ''] }),
  );

  return (
    <div data-slot="org-chart" className={cn('flex flex-col', className)} {...props}>
      <ChartPlot ref={ref} aria-label={label} focusable={false} table={{ rowHeader: 'Узел', columns: ['Подпись', valueLabel, 'Подчиняется'], rows: tableRows }}>
        <div className="overflow-x-auto">
          <div role="tree" aria-label={label} className="relative" style={{ width: canvasW, height: canvasH }}>
            <svg aria-hidden width={canvasW} height={canvasH} className="absolute inset-0 block">
              {links.map((link) => (
                <path
                  key={link.id}
                  data-slot="org-chart-link"
                  d={link.d}
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth={1.5}
                  className="transition-opacity duration-(--duration-base) ease-out starting:opacity-0"
                />
              ))}
            </svg>
            {visible.map((item, index) => {
              const { node } = item;
              const { left, top, width: w, stacked: inColumn } = box(item.id);
              const folded =
                item.branch && !item.open ? (
                  <span
                    aria-hidden
                    className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-surface-1 px-1.5 text-overline font-semibold text-fg-2 shadow-[inset_0_0_0_1px_var(--color-border)] tabular-nums"
                  >
                    +{node.children?.length ?? 0}
                  </span>
                ) : null;
              return (
                <div
                  key={item.id}
                  {...itemProps(item, index)}
                  aria-label={[node.title, node.subtitle, node.value === undefined ? undefined : `${valueLabel.toLowerCase()} ${formatValue(node.value)}`]
                    .filter(Boolean)
                    .join(', ')}
                  data-slot="org-chart-node"
                  data-layout={mode}
                  data-x={left}
                  data-y={top}
                  data-width={w}
                  onPointerEnter={() => setHovered(item.id)}
                  onPointerLeave={() => setHovered(null)}
                  className={cn(
                    'absolute flex select-none flex-col justify-center gap-0.5 rounded-sm px-2.5 shadow-[inset_0_0_0_1px_var(--color-border)] focus-visible:outline-offset-2',
                    'transition-[opacity,scale] duration-(--duration-base) ease-out starting:scale-95 starting:opacity-0',
                    item.level === 1 ? 'bg-accent-soft' : 'bg-surface-2',
                    item.branch ? 'cursor-pointer hover:shadow-[inset_0_0_0_1px_var(--color-fg-4)]' : 'cursor-default',
                  )}
                  style={{ left, top, width: w, height: CARD.height }}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-caption font-semibold text-fg-1">{node.title}</span>
                    {folded && mode === 'indent' ? folded : null}
                  </span>
                  <span className="flex items-baseline gap-2 text-overline">
                    <span className="min-w-0 flex-1 truncate text-fg-3">{node.subtitle}</span>
                    {node.value === undefined ? null : <span className="font-semibold text-fg-2 tabular-nums">{formatValue(node.value)}</span>}
                  </span>
                  {folded && mode !== 'indent' ? (
                    <span className={cn('absolute', inColumn ? 'top-1/2 -right-2.5 -translate-y-1/2' : '-bottom-2.5 left-1/2 -translate-x-1/2')}>{folded}</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        {tipItem && tipBox ? (
          <ChartTooltip
            x={flip ? tipBox.left : tipBox.left + tipBox.width}
            width={flip ? 0 : Infinity}
            y={tipBox.top}
            title={tipItem.node.title}
            rows={[
              ...(tipItem.node.value === undefined ? [] : [{ name: valueLabel, value: formatValue(tipItem.node.value) }]),
              ...(tipItem.node.value !== undefined && total ? [{ name: 'Доля', value: formatPercent(tipItem.node.value / total) }] : []),
              ...(tipItem.node.children?.length ? [{ name: 'Подразделений', value: String(tipItem.node.children.length) }] : []),
            ]}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- Dendrogram ---------- */

export interface DendrogramNode {
  /** Leaf name; on a merge — the group name shown in the legend when the cut makes it a group. */
  label?: string;
  /** Merge distance; leaves are at 0. */
  height?: number;
  children?: readonly DendrogramNode[];
}

export interface DendrogramProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  data: DendrogramNode;
  /** Cut distance: branches below it take their group colour, above it fg-4. */
  cut?: number;
  axisLabel?: string;
  formatValue?: (value: number) => string;
}

interface Merge {
  node: DendrogramNode;
  y: number;
  h: number;
  group: number | null;
  kids: Merge[];
  leaves: string[];
}

const LEAF = { top: 19, pitch: 22 };
const plural = (n: number, one: string, few: string, many: string) => {
  const tens = n % 100;
  const units = n % 10;
  if (tens >= 11 && tens <= 14) return many;
  return units === 1 ? one : units >= 2 && units <= 4 ? few : many;
};

/** Leaves on the left in merge order, elbow links to the right; the merge height says how unlike the groups are. A dashed cut colours the groups. */
export function Dendrogram({ data, cut, axisLabel = 'расстояние', formatValue = formatNumber, className, 'aria-label': label, ...props }: DendrogramProps) {
  const [ref, width] = useWidth(604);
  const [active, setActive] = useState<number | null>(null);
  const [spoken, setSpoken] = useState('');

  const groups: string[] = [];
  const leaves: { label: string; y: number; group: number | null; parent: Merge | null }[] = [];
  const merges: Merge[] = [];
  const build = (node: DendrogramNode, inherited: number | null, parent: Merge | null): Merge => {
    const kidsIn = node.children ?? [];
    const h = kidsIn.length > 0 ? (node.height ?? 0) : 0;
    let group = inherited;
    if (group === null && cut !== undefined && h < cut) {
      group = groups.length;
      groups.push(node.label ?? `Группа ${groups.length + 1}`);
    }
    const merge: Merge = { node, y: 0, h, group, kids: [], leaves: [] };
    if (kidsIn.length === 0) {
      merge.y = LEAF.top + leaves.length * LEAF.pitch;
      merge.leaves = [node.label ?? ''];
      leaves.push({ label: node.label ?? '', y: merge.y, group, parent });
      return merge;
    }
    merges.push(merge);
    merge.kids = kidsIn.map((kid) => build(kid, group, merge));
    merge.y = ((merge.kids[0]?.y ?? 0) + (merge.kids[merge.kids.length - 1]?.y ?? 0)) / 2;
    merge.leaves = merge.kids.flatMap((kid) => kid.leaves);
    return merge;
  };
  const root = build(data, null, null);

  const labelW = Math.max(74, ...leaves.map((leaf) => leaf.label.length * 6.6));
  const x0 = labelW + 8;
  const xEnd = width - 53;
  const maxH = root.h || 1;
  const x = (h: number) => x0 + (h / maxH) * (xEnd - x0);
  const bottom = LEAF.top + (leaves.length - 1) * LEAF.pitch + 11;
  const ticks = niceTicks(maxH, 4).filter((tick) => tick <= maxH * 1.001);
  const colorOf = (group: number | null) => (group === null ? 'var(--color-fg-4)' : seriesColor(group));
  const activeGroup = active === null ? null : (leaves[active]?.group ?? null);

  const describe = (index: number) => {
    const leaf = leaves[index];
    if (!leaf) return null;
    const near = leaf.parent?.kids.filter((kid) => !kid.leaves.includes(leaf.label)).flatMap((kid) => kid.leaves) ?? [];
    const nearText = near.length > 3 ? `${near.slice(0, 3).join(', ')}…` : near.join(', ');
    return { leaf, near: nearText, distance: leaf.parent ? formatValue(leaf.parent.h) : '', group: leaf.group === null ? null : (groups[leaf.group] ?? '') };
  };
  const pickAt = (index: number) => {
    setActive(index);
    const info = describe(index);
    if (info) {
      const parts = [info.group, info.near ? `ближе всего: ${info.near}` : null, info.distance ? `расстояние ${info.distance}` : null].filter(Boolean);
      setSpoken(`${info.leaf.label}: ${parts.join(', ')}`);
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = ({ ArrowDown: 'ArrowRight', ArrowUp: 'ArrowLeft' } as Record<string, string>)[event.key] ?? event.key;
    const index = stepIndex(key, active, leaves.length);
    if (index === null) return;
    event.preventDefault();
    pickAt(index);
  };
  const pick = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const index = Math.floor((event.clientY - box.top) / LEAF.pitch);
    setActive(Math.min(leaves.length - 1, Math.max(0, index)));
  };
  const info = active === null ? null : describe(active);

  return (
    <div data-slot="dendrogram" className={cn('flex flex-col gap-3', className)} {...props}>
      {groups.length > 0 ? <ChartLegend items={groups.map((name, i) => ({ name, color: seriesColor(i) }))} marker="line" /> : null}
      <ChartPlot
        ref={ref}
        aria-label={label}
        table={{
          rowHeader: 'Элемент',
          columns: ['Группа', 'Ближе всего', 'Расстояние'],
          rows: leaves.map((_, i) => {
            const row = describe(i);
            return { header: row?.leaf.label ?? '', cells: [row?.group ?? '', row?.near ?? '', row?.distance ?? ''] };
          }),
        }}
        spoken={spoken}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        <svg aria-hidden width={width} height={bottom + 22} className="block overflow-visible">
          {ticks.map((tick) => (
            <g key={tick}>
              {tick > 0 ? <line x1={x(tick)} x2={x(tick)} y1={4} y2={bottom} stroke="var(--color-separator)" shapeRendering="crispEdges" /> : null}
              {x(tick) + 12 < width - 6 - axisLabel.length * 6 ? (
                <text x={x(tick)} y={bottom + 16} textAnchor="middle" className="fill-fg-3 text-overline tabular-nums">
                  {formatValue(tick)}
                </text>
              ) : null}
            </g>
          ))}
          <text x={width - 6} y={bottom + 16} textAnchor="end" className="fill-fg-3 text-overline">
            {axisLabel}
          </text>
          {leaves.map((leaf, i) => (
            <text
              key={i}
              data-slot="dendrogram-leaf"
              x={x0 - 8}
              y={leaf.y + 4}
              textAnchor="end"
              className={cn('fill-fg-1 text-caption', active === i && 'font-semibold')}
            >
              {leaf.label}
            </text>
          ))}
          <g className="transition-[clip-path] duration-(--duration-deliberate) ease-out [clip-path:inset(-4px_-4px_-4px_-4px)] starting:[clip-path:inset(-4px_100%_-4px_-4px)]">
            {merges.map((merge, i) => {
              const xm = x(merge.h);
              const first = merge.kids[0]?.y ?? merge.y;
              const last = merge.kids[merge.kids.length - 1]?.y ?? merge.y;
              return (
                <path
                  key={i}
                  data-slot="dendrogram-link"
                  data-group={merge.group ?? undefined}
                  d={`${merge.kids.map((kid) => `M${x(kid.h)} ${kid.y}H${xm}`).join('')}M${xm} ${first}V${last}`}
                  fill="none"
                  stroke={colorOf(merge.group)}
                  strokeWidth={2}
                  opacity={activeGroup !== null && merge.group !== null && merge.group !== activeGroup ? 0.3 : 1}
                  className="transition-opacity duration-(--duration-quick)"
                />
              );
            })}
            <path d={`M${x(root.h)} ${root.y}H${x(root.h) + 14}`} fill="none" stroke="var(--color-fg-4)" strokeWidth={2} />
          </g>
          {cut !== undefined ? (
            <g data-slot="dendrogram-cut">
              <line x1={x(cut)} x2={x(cut)} y1={2} y2={bottom + 2} stroke="var(--color-fg-1)" strokeWidth={1.5} strokeDasharray="4 3" />
              <text x={x(cut) + 6} y={12} className="fill-fg-1 text-overline font-semibold">
                {`срез: ${groups.length} ${plural(groups.length, 'группа', 'группы', 'групп')}`}
              </text>
            </g>
          ) : null}
          <rect
            x={0}
            y={LEAF.top - 11}
            width={width}
            height={bottom - LEAF.top + 11}
            fill="transparent"
            onPointerMove={pick}
            onPointerDown={pick}
            onPointerLeave={() => setActive(null)}
          />
        </svg>
        {info ? (
          <ChartTooltip
            x={x(info.leaf.parent?.h ?? 0)}
            width={width}
            y={info.leaf.y > bottom / 2 ? info.leaf.y - 104 : info.leaf.y + 10}
            title={info.leaf.label}
            marker="line"
            rows={[
              ...(info.group === null ? [] : [{ name: 'Группа', value: info.group, color: colorOf(info.leaf.group) }]),
              ...(info.near ? [{ name: 'Ближе всего', value: info.near }] : []),
              ...(info.distance ? [{ name: 'Расстояние', value: info.distance }] : []),
            ]}
          />
        ) : null}
      </ChartPlot>
    </div>
  );
}

/* ---------- Mind map ---------- */

export interface MindMapNode {
  label: string;
  children?: readonly MindMapNode[];
}

export interface MindMapProps extends Omit<ComponentProps<'div'>, 'children'> {
  'aria-label': string;
  /** The centre; its children are the branches. */
  data: MindMapNode;
  /** both: branches split left and right evenly by height; right: all to the right (auto when both do not fit). */
  side?: 'auto' | 'both' | 'right';
}

const MAP = { pitch: 22, gap: 18, branch: 82, reach: 24, twig: 28, pill: 36, pad: 8 };
// shortcut: label widths are estimated per character (Inter 12 ≈ 6.4, 13 semibold ≈ 7.6); measure text if labels overflow their lines
const textW = (text: string, depth: number) => text.length * (depth === 1 ? 7.6 : 6.4);

interface MapPlace {
  id: string;
  depth: number;
  side: 1 | -1;
  branch: number;
  /** Line from start to end, at y; relative to the centre x. */
  start: number;
  end: number;
  y: number;
  parentEnd: number;
  parentY: number;
}

/** Centre pill fg-1, branches in category order chart-1…5 with lines 3 → 1.5 towards leaves, labels over the lines without frames. */
export function MindMap({ data, side = 'auto', className, 'aria-label': label, ...props }: MindMapProps) {
  const [ref, width] = useWidth(604);
  const [hoveredBranch, setHoveredBranch] = useState<number | null>(null);
  const { visible, itemProps, active } = useTree(data, () => new Set<string>());
  const byId = new Map(visible.map((item) => [item.id, item]));
  const kidsOf = (id: string) => visible.filter((item) => item.parent === id);

  const height = (id: string): number => {
    const kids = kidsOf(id);
    if (kids.length === 0) return MAP.pitch;
    return kids.reduce((sum, kid, i) => sum + height(kid.id) + (i > 0 && (kid.open || kids[i - 1]?.open) ? MAP.gap : 0), 0);
  };
  const branches = kidsOf('0');
  const heights = branches.map((item) => height(item.id));
  const stack = (from: number, to: number) => heights.slice(from, to).reduce((sum, h, i) => sum + h + (i > 0 ? MAP.gap : 0), 0);
  // sides are balanced on the unfolded tree, so folding a branch never moves others across the centre
  const fullHeight = (node: MindMapNode): number => {
    const kids = node.children ?? [];
    if (kids.length === 0) return MAP.pitch;
    return kids.reduce((sum, kid, i) => sum + fullHeight(kid) + (i > 0 && (kid.children?.length || kids[i - 1]?.children?.length) ? MAP.gap : 0), 0);
  };
  const full = (data.children ?? []).map(fullHeight);
  const sideHeight = (from: number, to: number) => full.slice(from, to).reduce((sum, h, i) => sum + h + (i > 0 ? MAP.gap : 0), 0);
  const imbalance = (k: number) => Math.abs(sideHeight(0, k) - sideHeight(k, full.length));
  const bothSplit = full.reduce((best, _, k) => (imbalance(k + 1) < imbalance(best) ? k + 1 : best), 0);

  const pillW = Math.max(80, data.label.length * 6.9 + 14);
  const layoutFor = (split: number) => {
    const places = new Map<string, MapPlace>();
    const placeKids = (parent: MapPlace, top: number) => {
      let cursor = top;
      const kids = kidsOf(parent.id);
      const ys: number[] = [];
      kids.forEach((kid, i) => {
        if (i > 0 && (kid.open || kids[i - 1]?.open)) cursor += MAP.gap;
        ys.push(place(kid.id, parent.depth + 1, parent.side, parent.branch, parent.end, parent.y, cursor));
        cursor += height(kid.id);
      });
      return ys;
    };
    const place = (id: string, depth: number, dir: 1 | -1, branch: number, parentEnd: number, parentY: number, top: number): number => {
      const item = byId.get(id);
      const text = item?.node.label ?? '';
      const start = parentEnd + dir * (depth === 1 ? MAP.reach : MAP.twig);
      const length = depth === 1 ? Math.max(MAP.branch, textW(text, 1) + 12) : textW(text, depth) + (item?.open ? 24 : 2);
      const own: MapPlace = { id, depth, side: dir, branch, start, end: start + dir * length, y: 0, parentEnd, parentY };
      places.set(id, own);
      const ys = item?.open ? placeKids(own, top) : [];
      own.y = ys.length > 0 ? ((ys[0] ?? 0) + (ys[ys.length - 1] ?? 0)) / 2 - 6 : top + 17;
      // children were laid out before the parent knew its y: refresh their curve origin
      for (const kid of kidsOf(id)) {
        const placed = places.get(kid.id);
        if (placed) placed.parentY = own.y;
      }
      return own.y;
    };
    const total = Math.max(MAP.pill, stack(0, split), stack(split, branches.length));
    const columns: [number, number, 1 | -1][] = [
      [0, split, -1],
      [split, branches.length, 1],
    ];
    for (const [from, to, dir] of columns) {
      let cursor = (total - stack(from, to)) / 2;
      for (let i = from; i < to; i += 1) {
        const item = branches[i];
        if (item) place(item.id, 1, dir, i, (dir * pillW) / 2 - dir * 2, total / 2, cursor);
        cursor += (heights[i] ?? 0) + MAP.gap;
      }
    }
    const all = [...places.values()];
    const reach = (dir: 1 | -1) => Math.max(pillW / 2, ...all.filter((p) => p.side === dir).map((p) => dir * p.end));
    return { places, total, left: reach(-1), right: reach(1) };
  };

  const both = layoutFor(bothSplit);
  const useBoth = side === 'both' || (side === 'auto' && both.left + both.right <= width);
  const map = useBoth ? both : layoutFor(0);
  const canvasW = Math.max(width, map.left + map.right);
  const cx = useBoth ? map.left + (canvasW - map.left - map.right) / 2 : map.left;
  const canvasH = map.total + 2 * MAP.pad;
  const cy = map.total / 2;
  const focusedPlace = active ? map.places.get(active) : undefined;

  const tableRows: { header: string; cells: string[] }[] = [];
  walkAll(data, (node, parent) => tableRows.push({ header: node.label, cells: [parent?.label ?? ''] }));

  return (
    <div data-slot="mind-map" className={cn('flex flex-col', className)} {...props}>
      <ChartPlot ref={ref} aria-label={label} focusable={false} table={{ rowHeader: 'Узел', columns: ['Родитель'], rows: tableRows }}>
        <div className="overflow-x-auto">
          <svg role="tree" aria-label={label} width={canvasW} height={canvasH} className="block">
            <g transform={`translate(0 ${MAP.pad})`}>
            {visible.map((item) => {
              const p = map.places.get(item.id);
              if (!p) return null;
              const x1 = cx + p.parentEnd;
              const x2 = cx + p.start;
              const y1 = p.parentY;
              const y2 = p.y;
              const pull = p.depth === 1 ? [16, 20] : [18, 18];
              return (
                <path
                  key={item.id}
                  data-slot="mind-map-link"
                  data-depth={p.depth}
                  d={`M${x1} ${y1}C${x1 + p.side * (pull[0] ?? 0)} ${y1} ${x2 - p.side * (pull[1] ?? 0)} ${y2} ${x2} ${y2}H${cx + p.end}`}
                  fill="none"
                  stroke={CHART_COLORS[p.branch % CHART_COLORS.length]}
                  strokeWidth={p.depth === 1 ? 3 : 1.5}
                  strokeLinecap="round"
                  opacity={hoveredBranch !== null && hoveredBranch !== p.branch ? 0.3 : 1}
                  style={{ transitionDelay: `${p.depth * 80}ms` }}
                  className="transition-opacity duration-(--duration-slow) ease-out starting:opacity-0"
                />
              );
            })}
            {focusedPlace ? (
              <rect
                aria-hidden
                x={cx + Math.min(focusedPlace.start, focusedPlace.end) - 4}
                y={focusedPlace.y - (focusedPlace.depth === 1 ? 22 : 19)}
                width={Math.abs(focusedPlace.end - focusedPlace.start) + 8}
                height={focusedPlace.depth === 1 ? 26 : 22}
                rx={6}
                fill="none"
                stroke="var(--color-ring)"
                strokeWidth={2}
              />
            ) : null}
            {visible.map((item, index) => {
              const treeProps = itemProps(item, index);
              const folded = item.branch && !item.open ? (
                <tspan dx={6} className="fill-fg-3 font-normal">{`+${item.node.children?.length ?? 0}`}</tspan>
              ) : null;
              if (item.level === 1) {
                return (
                  <g key={item.id} {...treeProps} aria-label={item.node.label} data-side="center" className="cursor-pointer outline-none">
                    <rect
                      x={cx - pillW / 2}
                      y={cy - MAP.pill / 2}
                      width={pillW}
                      height={MAP.pill}
                      rx={MAP.pill / 2}
                      fill="var(--color-fg-1)"
                      stroke={active === item.id ? 'var(--color-ring)' : 'none'}
                      strokeWidth={2}
                    />
                    <text x={cx} y={cy + 5} textAnchor="middle" className="fill-surface-1 text-label-sm font-semibold">
                      {item.node.label}
                      {folded}
                    </text>
                  </g>
                );
              }
              const p = map.places.get(item.id);
              if (!p) return null;
              const branch = p.depth === 1;
              return (
                <g
                  key={item.id}
                  {...treeProps}
                  aria-label={item.node.label}
                  data-side={p.side === 1 ? 'right' : 'left'}
                  onPointerEnter={() => setHoveredBranch(p.branch)}
                  onPointerLeave={() => setHoveredBranch(null)}
                  opacity={hoveredBranch !== null && hoveredBranch !== p.branch ? 0.35 : 1}
                  style={{ transitionDelay: `${p.depth * 80}ms` }}
                  className={cn('outline-none transition-opacity duration-(--duration-slow) ease-out starting:opacity-0', item.branch ? 'cursor-pointer' : 'cursor-default')}
                >
                  {/* hit area over the label and its line */}
                  <rect x={cx + Math.min(p.start, p.end)} y={p.y - 18} width={Math.abs(p.end - p.start)} height={24} fill="transparent" />
                  <text
                    x={cx + p.start + p.side * (branch ? 4 : 2)}
                    y={p.y - (branch ? 6 : 4)}
                    textAnchor={p.side === 1 ? 'start' : 'end'}
                    className={branch ? 'fill-fg-1 text-label-sm font-semibold' : 'fill-fg-2 text-caption'}
                  >
                    {item.node.label}
                    {folded}
                  </text>
                </g>
              );
            })}
            </g>
          </svg>
        </div>
      </ChartPlot>
    </div>
  );
}
