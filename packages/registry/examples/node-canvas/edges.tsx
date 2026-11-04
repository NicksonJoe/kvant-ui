import { useState } from 'react';
import { NodeCanvas, type CanvasEdgePath, type CanvasGraph, type CanvasNode, type CanvasNodeRenderState, type CanvasPortType } from '@/kvant';

interface Box {
  title: string;
}

const PATHS: readonly CanvasEdgePath[] = ['bezier', 'smoothstep', 'step', 'straight', 'orthogonal'];

const box = (id: string, x: number, y: number, title: string, type: CanvasPortType = 'object'): CanvasNode<Box> => ({
  id,
  kind: 'data',
  position: { x, y },
  width: 120,
  height: 44,
  ports: [
    { id: 'in', side: 'left', direction: 'in', type, label: title },
    { id: 'out', side: 'right', direction: 'out', type, label: title },
  ],
  data: { title },
});

// One pair per edge shape, top to bottom; the orthogonal one has a card in its way.
const GRAPH: CanvasGraph<Box> = {
  nodes: [
    ...PATHS.flatMap((path, index) => [box(`${path}-a`, 0, index * 110, path), box(`${path}-b`, 320, index * 110 + 50, path)]),
    box('blocker', 170, 440, 'на пути'),
    box('number', 620, 0, 'число', 'number'),
    box('any', 620, 160, 'любой', undefined),
  ],
  edges: PATHS.map((path) => ({ id: path, source: `${path}-a`, sourcePort: 'out', target: `${path}-b`, targetPort: 'in', path })),
};

function BoxCard({ node, state }: { node: CanvasNode<Box>; state: CanvasNodeRenderState }) {
  return (
    <div
      className={`flex h-full items-center justify-center rounded-md bg-surface-1 font-mono text-caption text-fg-2 ${state.selected ? 'shadow-[0_0_0_2px_var(--color-accent)]' : 'shadow-raised'}`}
    >
      {node.data.title}
    </div>
  );
}

const renderNode = (node: CanvasNode<Box>, state: CanvasNodeRenderState) => <BoxCard node={node} state={state} />;

/** Drag from any port: inputs of another type fade, a fitting one pulls the end in from 24 px. */
export default function EdgesExample() {
  const [graph, setGraph] = useState(GRAPH);
  return (
    <NodeCanvas<Box>
      aria-label="Формы связей"
      className="h-[600px] w-full rounded-xl shadow-raised"
      background="lines"
      nodes={graph.nodes}
      edges={graph.edges}
      onGraphChange={setGraph}
      renderNode={renderNode}
      nodeLabel={(node) => node.data.title}
    />
  );
}
