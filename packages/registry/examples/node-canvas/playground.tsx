import { useState } from 'react';
import {
  CanvasControls,
  CanvasMiniMap,
  CanvasPanel,
  NodeCanvas,
  type CanvasBackground,
  type CanvasEdgePath,
  type CanvasGraph,
  type CanvasNode,
  type CanvasNodeRenderState,
  type CanvasPort,
  type CanvasTool,
} from '@/kvant';
import type { Playground } from '@/kvant/meta';

interface Step {
  title: string;
}

const PORTS: readonly CanvasPort[] = [
  { id: 'in', side: 'left', direction: 'in', type: 'object' },
  { id: 'out', side: 'right', direction: 'out', type: 'object' },
];

const GRAPH: CanvasGraph<Step> = {
  nodes: [
    { id: 'message', kind: 'trigger', position: { x: 0, y: 80 }, width: 180, height: 48, ports: [PORTS[1] as CanvasPort], data: { title: 'Новое сообщение' } },
    { id: 'agent', kind: 'agent', position: { x: 280, y: 0 }, width: 180, height: 48, ports: PORTS, data: { title: 'Разобрать заявку' } },
    { id: 'deal', kind: 'action', position: { x: 560, y: 80 }, width: 180, height: 48, ports: PORTS, data: { title: 'Создать сделку' } },
  ],
  edges: [
    { id: 'e1', source: 'message', sourcePort: 'out', target: 'agent', targetPort: 'in', status: 'running' },
    { id: 'e2', source: 'agent', sourcePort: 'out', target: 'deal', targetPort: 'in', label: 'бюджет' },
  ],
};

const renderNode = (node: CanvasNode<Step>, state: CanvasNodeRenderState) => (
  <div
    className={`flex h-full items-center rounded-md bg-surface-1 px-4 text-label-md font-semibold text-fg-1 ${state.selected ? 'shadow-[0_0_0_2px_var(--color-accent)]' : 'shadow-raised'}`}
  >
    {node.data.title}
  </div>
);

interface DemoProps {
  background: CanvasBackground;
  edgePath: CanvasEdgePath;
  gridSize: number;
  snapToGrid: boolean;
  tool: CanvasTool;
  readOnly: boolean;
}

function Demo(props: DemoProps) {
  const [graph, setGraph] = useState(GRAPH);
  return (
    <NodeCanvas<Step>
      aria-label="Воркфлоу"
      className="h-[360px] w-full rounded-xl shadow-raised"
      nodes={graph.nodes}
      edges={graph.edges}
      onGraphChange={setGraph}
      renderNode={renderNode}
      nodeLabel={(node) => node.data.title}
      {...props}
    >
      <CanvasPanel position="bottom-left">
        <CanvasControls />
      </CanvasPanel>
      <CanvasPanel position="bottom-right">
        <CanvasMiniMap />
      </CanvasPanel>
    </NodeCanvas>
  );
}

const playground: Playground = {
  render: (p) => (
    <Demo
      background={p.pick('background', ['dots', 'lines', 'cross', 'none'] as const)}
      edgePath={p.pick('edgePath', ['bezier', 'smoothstep', 'step', 'straight', 'orthogonal'] as const)}
      gridSize={p.num('gridSize')}
      snapToGrid={p.bool('snapToGrid')}
      tool={p.pick('tool', ['select', 'pan'] as const)}
      readOnly={p.bool('readOnly')}
    />
  ),
  code: (p) =>
    `<NodeCanvas aria-label="Воркфлоу" nodes={nodes} edges={edges} onGraphChange={history.change} renderNode={(node, state) => …}${p.attrs(['background', 'edgePath', 'gridSize', 'snapToGrid', 'tool', 'readOnly'])}>\n  <CanvasPanel position="bottom-left"><CanvasControls /></CanvasPanel>\n  <CanvasPanel position="bottom-right"><CanvasMiniMap /></CanvasPanel>\n</NodeCanvas>`,
};

export default playground;
