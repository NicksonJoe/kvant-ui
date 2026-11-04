import { LayoutGrid } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  Button,
  CanvasControls,
  CanvasPanel,
  NodeCanvas,
  SegmentedControl,
  useCanvasHistory,
  type CanvasGraph,
  type CanvasLayoutDirection,
  type CanvasNode,
  type CanvasNodeRenderState,
  type CanvasPort,
  type NodeCanvasApi,
} from '@/kvant';

interface Item {
  title: string;
}

const PORTS: readonly CanvasPort[] = [
  { id: 'in', side: 'left', direction: 'in' },
  { id: 'out', side: 'right', direction: 'out' },
];

const SCATTERED: [string, string, number, number][] = [
  ['lead', 'Заявка', 40, 260],
  ['score', 'Оценка', 420, 40],
  ['call', 'Звонок', 120, 420],
  ['mail', 'Письмо', 560, 360],
  ['deal', 'Сделка', 300, 200],
  ['invoice', 'Счёт', 700, 120],
  ['paid', 'Оплата', 20, 40],
];

const GRAPH: CanvasGraph<Item> = {
  nodes: SCATTERED.map(([id, title, x, y]) => ({ id, kind: 'action', position: { x, y }, width: 160, height: 48, ports: PORTS, data: { title } })),
  edges: [
    ['lead', 'score'],
    ['score', 'call'],
    ['score', 'mail'],
    ['call', 'deal'],
    ['mail', 'deal'],
    ['deal', 'invoice'],
    ['invoice', 'paid'],
  ].map(([source, target]) => ({ id: `${source}-${target}`, source: source as string, sourcePort: 'out', target: target as string, targetPort: 'in' })),
};

function ItemCard({ node, state }: { node: CanvasNode<Item>; state: CanvasNodeRenderState }) {
  return (
    <div
      className={`flex h-full items-center rounded-md bg-surface-1 px-4 text-label-md font-semibold text-fg-1 ${state.selected ? 'shadow-[0_0_0_2px_var(--color-accent)]' : 'shadow-raised'}`}
    >
      {node.data.title}
    </div>
  );
}

const renderNode = (node: CanvasNode<Item>, state: CanvasNodeRenderState) => <ItemCard node={node} state={state} />;

/** «Разложить» lays out everything, or only the selected nodes when there are two or more; ⌘Z puts it back. */
export default function LayoutExample() {
  const history = useCanvasHistory(GRAPH);
  const canvas = useRef<NodeCanvasApi>(null);
  const [direction, setDirection] = useState<CanvasLayoutDirection>('right');
  const selected = history.graph.nodes.filter((node) => node.selected).map((node) => node.id);
  return (
    <NodeCanvas<Item>
      ref={canvas}
      aria-label="Воронка сделки"
      className="h-[520px] w-full rounded-xl shadow-raised"
      edgePath="smoothstep"
      nodes={history.graph.nodes}
      edges={history.graph.edges}
      onGraphChange={history.change}
      onUndo={history.undo}
      onRedo={history.redo}
      renderNode={renderNode}
      nodeLabel={(node) => node.data.title}
    >
      <CanvasPanel position="top-left" aria-label="Раскладка">
        <SegmentedControl<CanvasLayoutDirection>
          aria-label="Направление"
          options={[
            { value: 'right', label: '→ Вправо' },
            { value: 'down', label: '↓ Вниз' },
          ]}
          value={direction}
          onValueChange={setDirection}
        />
        <Button
          size="sm"
          leadingIcon={<LayoutGrid />}
          onClick={() => {
            canvas.current?.layout({ direction, nodeIds: selected.length > 1 ? selected : undefined, fit: true });
          }}
        >
          {selected.length > 1 ? `Разложить выделенное · ${selected.length}` : 'Разложить'}
        </Button>
      </CanvasPanel>
      <CanvasPanel position="bottom-left">
        <CanvasControls />
      </CanvasPanel>
    </NodeCanvas>
  );
}
