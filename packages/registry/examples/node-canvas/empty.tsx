import { Plus, Workflow } from 'lucide-react';
import { Button, CanvasControls, CanvasPanel, NodeCanvas, useCanvasHistory, type CanvasGraph, type CanvasNode, type CanvasPoint, type CanvasPort } from '@/kvant';

interface Step {
  title: string;
}

const PORTS: readonly CanvasPort[] = [
  { id: 'in', side: 'left', direction: 'in' },
  { id: 'out', side: 'right', direction: 'out' },
];

const EMPTY: CanvasGraph<Step> = { nodes: [], edges: [] };

const renderNode = (node: CanvasNode<Step>) => (
  <div className="flex h-full items-center rounded-md bg-surface-1 px-4 text-label-md font-semibold text-fg-1 shadow-raised">{node.data.title}</div>
);

/** No nodes yet: renderEmpty sits in the middle; the button, Enter on the canvas and a double click add the first step. */
export default function EmptyExample() {
  const history = useCanvasHistory(EMPTY);
  const add = (position: CanvasPoint) => {
    const id = crypto.randomUUID();
    history.change(
      { ...history.graph, nodes: [...history.graph.nodes, { id, kind: 'action', position, width: 160, height: 48, ports: PORTS, data: { title: 'Новый шаг' } }] },
      { type: 'add', nodeIds: [id] },
    );
  };
  return (
    <NodeCanvas<Step>
      aria-label="Новый воркфлоу"
      className="h-[420px] w-full rounded-xl shadow-raised"
      nodes={history.graph.nodes}
      edges={history.graph.edges}
      onGraphChange={history.change}
      onUndo={history.undo}
      onRedo={history.redo}
      renderNode={renderNode}
      nodeLabel={(node) => node.data.title}
      onRequestInsert={(request) => add(request.position)}
      renderEmpty={() => (
        <div className="flex max-w-[32ch] flex-col items-center gap-3 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-fill-1 text-fg-2 [&_svg]:size-5">
            <Workflow strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-body-md font-semibold text-fg-1">Пока ни одного шага</p>
            <p className="text-body-sm text-fg-2">С чего начинается процесс? Добавьте первый шаг кнопкой или Enter на канвасе.</p>
          </div>
          <Button size="sm" leadingIcon={<Plus />} onClick={() => add({ x: 0, y: 0 })}>
            Добавить шаг
          </Button>
        </div>
      )}
    >
      <CanvasPanel position="bottom-left">
        <CanvasControls />
      </CanvasPanel>
    </NodeCanvas>
  );
}
