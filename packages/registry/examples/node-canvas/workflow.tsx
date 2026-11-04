import { Ban, Briefcase, ChevronsDownUp, ChevronsUpDown, GitBranch, Redo2, Send, Sparkles, Trash2, Undo2, Wallet, Zap, type LucideIcon } from 'lucide-react';
import {
  CanvasControls,
  CanvasMiniMap,
  CanvasPanel,
  NodeCanvas,
  Toolbar,
  ToolbarButton,
  useCanvasHistory,
  type CanvasEdge,
  type CanvasGraph,
  type CanvasInsertRequest,
  type CanvasNode,
  type CanvasNodeRenderState,
  type CanvasPoint,
  type CanvasPort,
} from '@/kvant';

interface Step {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Tile classes of the step family. */
  tone?: string;
}

const FLOW: readonly CanvasPort[] = [
  { id: 'in', side: 'top', direction: 'in', type: 'flow' },
  { id: 'out', side: 'bottom', direction: 'out', type: 'flow' },
];
const ROW: readonly CanvasPort[] = [
  { id: 'in', side: 'left', direction: 'in', type: 'flow' },
  { id: 'out', side: 'right', direction: 'out', type: 'flow' },
];

const step = (id: string, kind: CanvasNode['kind'], x: number, y: number, data: Step, extra: Partial<CanvasNode<Step>> = {}): CanvasNode<Step> => ({
  id,
  kind,
  position: { x, y },
  ports: FLOW,
  data,
  ...extra,
});

const GRAPH: CanvasGraph<Step> = {
  nodes: [
    step('trigger', 'trigger', 300, 0, { title: 'Новое сообщение', subtitle: 'Триггер · Telegram', icon: Zap, tone: 'bg-chart-5/14 text-chart-5' }, { ports: [FLOW[1] as CanvasPort], status: 'done' }),
    step(
      'agent',
      'agent',
      300,
      140,
      { title: 'Разобрать заявку', subtitle: 'Агент Норды', icon: Sparkles, tone: 'bg-chart-7/14 text-chart-7' },
      {
        status: 'running',
        ports: [...FLOW, { id: 'memory', side: 'right', direction: 'in', type: 'memory', label: 'память' }, { id: 'tools', side: 'right', direction: 'in', type: 'tool', label: 'инструменты' }],
      },
    ),
    step(
      'budget',
      'condition',
      300,
      280,
      { title: 'Есть бюджет?', subtitle: 'Условие', icon: GitBranch, tone: 'bg-chart-4/16 text-chart-4' },
      {
        ports: [
          { id: 'in', side: 'top', direction: 'in', type: 'flow' },
          { id: 'no', side: 'bottom', direction: 'out', type: 'flow', label: 'нет' },
          { id: 'yes', side: 'bottom', direction: 'out', type: 'flow', label: 'да' },
        ],
      },
    ),
    step('reply', 'action', 40, 440, { title: 'Ответить шаблоном', subtitle: 'Действие · Telegram', icon: Send, tone: 'bg-chart-1/14 text-chart-1' }),
    step('payment', 'group', 400, 440, { title: 'Обработка оплаты' }, { width: 540, height: 150, ports: [] }),
    step('invoice', 'action', 20, 56, { title: 'Выставить счёт', subtitle: 'Действие · Банк', icon: Wallet, tone: 'bg-chart-1/14 text-chart-1' }, { parentId: 'payment', ports: ROW }),
    step('deal', 'action', 300, 56, { title: 'Создать сделку', subtitle: 'Действие · Сделки', icon: Briefcase, tone: 'bg-chart-1/14 text-chart-1' }, { parentId: 'payment', ports: ROW }),
    step('note', 'note', 620, 120, { title: 'Порог бюджета согласовать с Игорем — может, 30 000 ₽ для повторных клиентов?' }, { width: 240, height: 100, ports: [] }),
  ],
  edges: [
    { id: 'e1', source: 'trigger', sourcePort: 'out', target: 'agent', targetPort: 'in', status: 'done' },
    { id: 'e2', source: 'agent', sourcePort: 'out', target: 'budget', targetPort: 'in', status: 'running', label: '12 записей' },
    { id: 'e3', source: 'budget', sourcePort: 'no', target: 'reply', targetPort: 'in', label: 'нет' },
    { id: 'e4', source: 'budget', sourcePort: 'yes', target: 'invoice', targetPort: 'in', label: 'да' },
    { id: 'e5', source: 'invoice', sourcePort: 'out', target: 'deal', targetPort: 'in' },
  ],
};

function StepCard({ node, state }: { node: CanvasNode<Step>; state: CanvasNodeRenderState }) {
  const { title, subtitle, icon: Icon, tone } = node.data;
  if (node.kind === 'group') {
    return <div className="size-full rounded-lg border border-chart-6/40 bg-chart-6/7 px-4 py-3 text-label-md font-semibold text-fg-1">{title}</div>;
  }
  if (node.kind === 'note') {
    return <div className="size-full overflow-hidden rounded-md bg-warning-soft p-3 text-body-sm text-warning-soft-fg shadow-raised">{title}</div>;
  }
  return (
    <div
      className={`flex w-[208px] items-center gap-2.5 rounded-md bg-surface-1 p-3 ${state.selected ? 'shadow-[0_0_0_2px_var(--color-accent)]' : 'shadow-raised'} ${node.disabled ? 'opacity-50' : ''}`}
    >
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-sm ${tone ?? 'bg-fill-2 text-fg-2'}`}>{Icon ? <Icon className="size-4" /> : null}</span>
      {state.detail === 'minimal' ? null : (
        <span className="min-w-0">
          <span className="block truncate text-label-md font-semibold text-fg-1">{title}</span>
          {state.detail === 'full' && subtitle ? <span className="block truncate text-caption text-fg-3">{subtitle}</span> : null}
        </span>
      )}
    </div>
  );
}

const renderNode = (node: CanvasNode<Step>, state: CanvasNodeRenderState) => <StepCard node={node} state={state} />;
const nodeLabel = (node: CanvasNode<Step>) => node.data.title;

let created = 0;
function newStep(position: CanvasPoint): CanvasNode<Step> {
  created += 1;
  return step(`step-${created}`, 'action', position.x - 104, position.y - 28, {
    title: 'Новый шаг',
    subtitle: 'Действие',
    icon: Briefcase,
    tone: 'bg-chart-1/14 text-chart-1',
  });
}

export default function WorkflowExample() {
  const history = useCanvasHistory(GRAPH);
  const { graph } = history;

  const insert = (request: CanvasInsertRequest) => {
    const added = newStep(request.position);
    const from = request.from;
    const source = from ? graph.nodes.find((item) => item.id === from.nodeId) : undefined;
    const port = source?.ports.find((item) => item.id === from?.portId) ?? source?.ports.find((item) => item.direction === 'out');
    const edges: CanvasEdge[] = [];
    if (source && port) {
      edges.push(
        port.direction === 'out'
          ? { id: `${source.id}-${added.id}`, source: source.id, sourcePort: port.id, target: added.id, targetPort: 'in' }
          : { id: `${added.id}-${source.id}`, source: added.id, sourcePort: 'out', target: source.id, targetPort: port.id },
      );
    }
    history.change({ nodes: [...graph.nodes, added], edges: [...graph.edges, ...edges] }, { type: 'add', nodeIds: [added.id] });
  };

  const insertOnEdge = (edge: CanvasEdge, position: CanvasPoint) => {
    const added = newStep(position);
    history.change(
      {
        nodes: [...graph.nodes, added],
        edges: [
          ...graph.edges.filter((item) => item.id !== edge.id),
          { id: `${edge.id}-a`, source: edge.source, sourcePort: edge.sourcePort, target: added.id, targetPort: 'in' },
          { id: `${edge.id}-b`, source: added.id, sourcePort: 'out', target: edge.target, targetPort: edge.targetPort },
        ],
      },
      { type: 'add', nodeIds: [added.id] },
    );
  };

  const update = (ids: readonly string[], patch: (node: CanvasNode<Step>) => CanvasNode<Step>) =>
    history.change({ ...graph, nodes: graph.nodes.map((node) => (ids.includes(node.id) ? patch(node) : node)) }, { type: 'update', nodeIds: ids });

  return (
    <NodeCanvas<Step>
      aria-label="Воркфлоу «Заявка из Telegram → сделка»"
      className="h-[560px] w-full rounded-xl bg-background shadow-raised"
      nodes={graph.nodes}
      edges={graph.edges}
      edgePath="smoothstep"
      onGraphChange={history.change}
      onUndo={history.undo}
      onRedo={history.redo}
      renderNode={renderNode}
      nodeLabel={nodeLabel}
      onRequestInsert={insert}
      onInsertOnEdge={insertOnEdge}
      renderNodeToolbar={(nodes) => {
        const ids = nodes.map((node) => node.id);
        const group = nodes.length === 1 && nodes[0]?.kind === 'group' ? nodes[0] : undefined;
        return (
          <Toolbar variant="selection" aria-label="Действия с шагом">
            {group ? (
              <ToolbarButton
                label={group.collapsed ? 'Развернуть' : 'Свернуть'}
                icon={group.collapsed ? <ChevronsUpDown /> : <ChevronsDownUp />}
                onClick={() => update([group.id], (node) => ({ ...node, collapsed: !node.collapsed, height: node.collapsed ? 150 : 64 }))}
              >
                {group.collapsed ? 'Развернуть' : 'Свернуть'}
              </ToolbarButton>
            ) : (
              <ToolbarButton label="Отключить" icon={<Ban />} onClick={() => update(ids, (node) => ({ ...node, disabled: !node.disabled }))} />
            )}
          </Toolbar>
        );
      }}
      renderEdgeToolbar={(edge) => (
        <Toolbar variant="selection" aria-label="Действия со связью">
          <ToolbarButton
            label="Удалить связь"
            icon={<Trash2 />}
            onClick={() => history.change({ ...graph, edges: graph.edges.filter((item) => item.id !== edge.id) }, { type: 'delete', edgeIds: [edge.id] })}
          />
        </Toolbar>
      )}
    >
      <div aria-hidden className="pointer-events-none absolute left-0 top-0" style={{ transform: 'translate(700px, 250px)' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" className="fill-chart-7">
          <path d="M1 1l11 5-5 1.5L5.5 13z" />
        </svg>
        <span className="ml-3 rounded-xs bg-chart-7 px-1.5 py-0.5 text-caption font-medium text-white">Анна</span>
      </div>
      <CanvasPanel position="bottom-left">
        <CanvasControls>
          <button
            type="button"
            aria-label="Отменить"
            disabled={!history.canUndo}
            className="flex size-8 items-center justify-center rounded-sm text-fg-2 hover:bg-fill-2 disabled:opacity-40"
            onClick={history.undo}
          >
            <Undo2 className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Вернуть"
            disabled={!history.canRedo}
            className="flex size-8 items-center justify-center rounded-sm text-fg-2 hover:bg-fill-2 disabled:opacity-40"
            onClick={history.redo}
          >
            <Redo2 className="size-4" />
          </button>
        </CanvasControls>
      </CanvasPanel>
      {/* Top corner: the bottom row is taken by the controls with undo and redo. */}
      <CanvasPanel position="top-right">
        <CanvasMiniMap cursors={[{ id: 'anna', position: { x: 700, y: 250 }, color: 'var(--color-chart-7)', name: 'Анна' }]} />
      </CanvasPanel>
    </NodeCanvas>
  );
}
