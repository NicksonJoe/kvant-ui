import { useState } from 'react';
import {
  CanvasCommentPin,
  CanvasCommentThread,
  CanvasControls,
  CanvasCursor,
  CanvasEditingLabel,
  CanvasNodeCard,
  CanvasPanel,
  CanvasPresence,
  CanvasSticky,
  NodeCanvas,
  presenceRing,
  useCanvasHistory,
  type CanvasComment,
  type CanvasGraph,
  type CanvasNode,
  type CanvasNodeRenderState,
} from '@/kvant';

interface Step {
  title: string;
  /** Presence slot of the colleague who has this step selected. */
  heldBy?: 1 | 2 | 3;
}

const GRAPH: CanvasGraph<Step> = {
  nodes: [
    {
      id: 'agent',
      kind: 'agent',
      position: { x: 0, y: 0 },
      ports: [{ id: 'out', side: 'right', direction: 'out', type: 'flow' }],
      data: { title: 'Разобрать заявку', heldBy: 2 },
    },
    {
      id: 'budget',
      kind: 'condition',
      position: { x: 320, y: 0 },
      ports: [{ id: 'in', side: 'left', direction: 'in', type: 'flow' }],
      data: { title: 'Есть бюджет?' },
    },
  ],
  edges: [{ id: 'e1', source: 'agent', sourcePort: 'out', target: 'budget', targetPort: 'in' }],
};

const renderNode = (node: CanvasNode<Step>, state: CanvasNodeRenderState) => (
  <CanvasNodeCard kind={node.kind} title={node.data.title} selected={state.selected} style={node.data.heldBy ? presenceRing(node.data.heldBy) : undefined} />
);
const nodeLabel = (node: CanvasNode<Step>) => node.data.title;

// Controls in the graph layer keep their own pointer: otherwise a press there starts a selection box.
const stop = { onPointerDown: (event: { stopPropagation: () => void }) => event.stopPropagation() };

/** Cursors, stickers and comments live in the engine's graph layer: they pan and zoom with the steps. */
export default function CanvasTogether() {
  const history = useCanvasHistory(GRAPH);
  const [open, setOpen] = useState(true);
  const [resolved, setResolved] = useState(false);
  const [comments, setComments] = useState<CanvasComment[]>([
    { id: '1', author: 'Анна', time: '10 мин назад', text: 'Порог 50 000 не слишком высокий для повторных?' },
    { id: '2', author: 'Игорь', time: '2 мин назад', text: 'Сделаю отдельную ветку для повторных — 30 000.' },
  ]);
  return (
    <NodeCanvas<Step>
      aria-label="Воркфлоу с коллегами"
      className="h-[480px] w-full rounded-xl bg-background shadow-[inset_0_0_0_1px_var(--color-hairline)]"
      nodes={history.graph.nodes}
      edges={history.graph.edges}
      onGraphChange={history.change}
      onUndo={history.undo}
      onRedo={history.redo}
      renderNode={renderNode}
      nodeLabel={nodeLabel}
    >
      <CanvasEditingLabel name="Игорь" presence={2} x={0} y={-22} />
      {resolved ? null : (
        <div {...stop}>
          <CanvasCommentPin author="Анна" count={comments.length} x={500} y={-40} aria-expanded={open} onClick={() => setOpen((value) => !value)} />
        </div>
      )}
      {open && !resolved ? (
        <div {...stop}>
          <CanvasCommentThread
            aria-label="Комментарии к «Есть бюджет?»"
            x={320}
            y={90}
            comments={comments}
            onReply={(text) => setComments((list) => [...list, { id: String(list.length + 1), author: 'Вы', time: 'только что', text }])}
            onResolve={() => setResolved(true)}
            onClose={() => setOpen(false)}
          />
        </div>
      ) : null}
      <CanvasSticky author="Анна" time="2 мин назад" x={0} y={140}>
        Порог бюджета согласовать с Игорем — может, 30 000 ₽ для повторных клиентов?
      </CanvasSticky>
      <CanvasCursor name="Анна" presence={1} x={250} y={200} />
      <CanvasPanel position="top-left">
        <CanvasPresence
          people={[
            { id: 'anna', name: 'Анна', presence: 1 },
            { id: 'igor', name: 'Игорь', presence: 2 },
          ]}
        />
      </CanvasPanel>
      <CanvasPanel position="bottom-left">
        <CanvasControls />
      </CanvasPanel>
    </NodeCanvas>
  );
}
