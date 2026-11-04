import { useRef, useState, type DragEvent } from 'react';
import {
  CanvasControls,
  CanvasEditor,
  CanvasInsertMenu,
  CanvasInspector,
  CanvasMiniMap,
  CanvasNodeCard,
  CanvasPanel,
  CanvasProblems,
  CanvasState,
  NodeCanvas,
  StepPalette,
  checkGraph,
  readCanvasStepDrag,
  useCanvasHistory,
  type CanvasEdge,
  type CanvasGraph,
  type CanvasInsertRequest,
  type CanvasNode,
  type CanvasNodeKind,
  type CanvasNodeRenderState,
  type CanvasPoint,
  type CanvasPort,
  type CanvasProblem,
  type CanvasStepTemplate,
  type NodeCanvasApi,
} from '@/kvant';
import { STEP_GROUPS } from '../step-palette/data';

interface Step {
  title: string;
  subtitle?: string;
  summary?: string;
}

const PORTS: readonly CanvasPort[] = [
  { id: 'in', side: 'top', direction: 'in', type: 'flow', required: true },
  { id: 'out', side: 'bottom', direction: 'out', type: 'flow' },
];
const TRIGGER_PORTS: readonly CanvasPort[] = [{ id: 'out', side: 'bottom', direction: 'out', type: 'flow' }];
const CONDITION_PORTS: readonly CanvasPort[] = [
  { id: 'in', side: 'top', direction: 'in', type: 'flow', required: true },
  { id: 'no', side: 'bottom', direction: 'out', type: 'flow', label: 'нет' },
  { id: 'yes', side: 'bottom', direction: 'out', type: 'flow', label: 'да' },
];

const portsOf = (kind: CanvasNodeKind) => (kind === 'trigger' ? TRIGGER_PORTS : kind === 'condition' ? CONDITION_PORTS : PORTS);

const step = (id: string, kind: CanvasNodeKind, x: number, y: number, data: Step): CanvasNode<Step> => ({
  id,
  kind,
  position: { x, y },
  ports: portsOf(kind),
  data,
});

const GRAPH: CanvasGraph<Step> = {
  nodes: [
    step('trigger', 'trigger', 300, 0, { title: 'Новое сообщение', subtitle: 'Триггер · Telegram', summary: '@norda_bot · личные' }),
    step('agent', 'agent', 284, 170, { title: 'Разобрать заявку', subtitle: 'Агент Норды' }),
    step('budget', 'condition', 300, 340, { title: 'Есть бюджет?', summary: 'budget ≥ 50 000' }),
    step('reply', 'action', 60, 520, { title: 'Ответить шаблоном', subtitle: 'Действие · Telegram' }),
    step('deal', 'action', 540, 520, { title: 'Создать сделку', subtitle: 'Действие · Сделки', summary: 'этап: Неразобранное' }),
  ],
  edges: [
    { id: 'e1', source: 'trigger', sourcePort: 'out', target: 'agent', targetPort: 'in' },
    { id: 'e2', source: 'agent', sourcePort: 'out', target: 'budget', targetPort: 'in' },
    { id: 'e3', source: 'budget', sourcePort: 'no', target: 'reply', targetPort: 'in', label: 'нет' },
    { id: 'e4', source: 'budget', sourcePort: 'yes', target: 'deal', targetPort: 'in', label: 'да' },
  ],
};

const TEMPLATES = new Map(STEP_GROUPS.flatMap((group) => group.items).map((item) => [item.id, item]));

const renderNode = (node: CanvasNode<Step>, state: CanvasNodeRenderState) => (
  <CanvasNodeCard
    kind={node.kind}
    title={node.data.title}
    subtitle={node.data.subtitle}
    summary={node.data.summary}
    status={node.status}
    selected={state.selected}
    disabled={node.disabled}
  />
);
const nodeLabel = (node: CanvasNode<Step>) => node.data.title;

let created = 0;

/** The whole editor: palette, engine with node cards, insert menu, inspector of the selected step and the graph check before publishing. */
export default function CanvasEditorFull() {
  const history = useCanvasHistory(GRAPH);
  const { graph } = history;
  const canvas = useRef<NodeCanvasApi>(null);
  const area = useRef<HTMLDivElement>(null);
  const [problems, setProblems] = useState<readonly CanvasProblem[] | null>(null);
  const [inserting, setInserting] = useState<CanvasInsertRequest | null>(null);
  const [version, setVersion] = useState(7);
  const [saved, setSaved] = useState('сохранено только что');
  const selected = graph.nodes.find((node) => node.selected);
  const errors = checkGraph(graph, { label: nodeLabel }).filter((problem) => problem.severity === 'error').length;

  const add = (template: CanvasStepTemplate, position: CanvasPoint, from?: CanvasNode<Step>) => {
    created += 1;
    const node = step(`step-${created}`, template.kind, position.x - 104, position.y - 28, { title: template.title });
    const out = from?.ports.find((port) => port.direction === 'out');
    const edges: CanvasEdge[] = from && out ? [{ id: `${from.id}-${node.id}`, source: from.id, sourcePort: out.id, target: node.id, targetPort: 'in' }] : [];
    history.change({ nodes: [...graph.nodes, node], edges: [...graph.edges, ...edges] }, { type: 'add', nodeIds: [node.id] });
    setSaved(`добавлен шаг «${template.title}»`);
  };

  const viewCentre = (): CanvasPoint => {
    const box = area.current?.getBoundingClientRect();
    return canvas.current?.screenToGraph({ x: (box?.left ?? 0) + (box?.width ?? 0) / 2, y: (box?.top ?? 0) + (box?.height ?? 0) / 2 }) ?? { x: 0, y: 0 };
  };

  // Palette click: under the selected step, or in the middle of the view.
  const insertFromPalette = (template: CanvasStepTemplate) => {
    if (selected) add(template, { x: selected.position.x + 104, y: selected.position.y + 200 }, selected);
    else add(template, viewCentre());
  };

  const drop = (event: DragEvent<HTMLDivElement>) => {
    const payload = readCanvasStepDrag(event.dataTransfer);
    const template = payload && TEMPLATES.get(payload.templateId);
    if (!template || !canvas.current) return;
    event.preventDefault();
    add(template, canvas.current.screenToGraph({ x: event.clientX, y: event.clientY }));
  };

  const publish = () => {
    setVersion((current) => current + 1);
    setSaved(`опубликовано как v${version + 1}`);
    setProblems(null);
  };

  const deselect = () =>
    history.change({ ...graph, nodes: graph.nodes.map((node) => (node.selected ? { ...node, selected: false } : node)) }, { type: 'select' });

  const inspector = problems ? (
    <CanvasProblems
      problems={problems}
      onShow={(problem) => {
        const id = problem.nodeIds[0];
        if (id) canvas.current?.centerOnNode(id);
      }}
      onPublish={publish}
    />
  ) : selected ? (
    <CanvasInspector
      title={selected.data.title}
      subtitle={selected.data.subtitle}
      onClose={deselect}
      params={<p className="text-body-sm text-fg-2">{selected.data.summary ?? 'Шаг ещё не настроен.'}</p>}
    />
  ) : null;

  const from = inserting?.from ? graph.nodes.find((node) => node.id === inserting.from?.nodeId) : undefined;

  return (
    <CanvasEditor
      className="h-[720px] w-full rounded-xl shadow-raised"
      breadcrumbs={[{ label: 'Автоматизации', href: '#' }]}
      title="Заявка из Telegram → сделка"
      version={`Черновик · опубликована v${version}`}
      saved={saved}
      saveState="saved"
      errors={errors}
      onValidate={() => setProblems(checkGraph(graph, { label: nodeLabel }))}
      onPublish={publish}
      palette={<StepPalette groups={STEP_GROUPS} onInsert={insertFromPalette} />}
      inspector={inspector}
      inspectorOpen={inspector !== null}
    >
      <div ref={area} className="relative size-full" onDragOver={(event) => event.preventDefault()} onDrop={drop}>
        <NodeCanvas<Step>
          ref={canvas}
          aria-label="Воркфлоу «Заявка из Telegram → сделка»"
          className="size-full"
          nodes={graph.nodes}
          edges={graph.edges}
          onGraphChange={(next, change) => {
            history.change(next, change);
            if (change.type !== 'select') setProblems(null);
          }}
          onUndo={history.undo}
          onRedo={history.redo}
          renderNode={renderNode}
          nodeLabel={nodeLabel}
          onRequestInsert={setInserting}
          renderEmpty={() => <CanvasState kind="empty" onAddStep={() => setInserting({ position: viewCentre() })} />}
        >
          <CanvasPanel position="bottom-left">
            <CanvasControls />
          </CanvasPanel>
          <CanvasPanel position="bottom-right">
            <CanvasMiniMap />
          </CanvasPanel>
          {inserting ? (
            <CanvasPanel position="top-center">
              <CanvasInsertMenu
                groups={STEP_GROUPS}
                context={from ? `после «${from.data.title}»` : undefined}
                onInsert={(template) => {
                  add(template, inserting.position, from);
                  setInserting(null);
                }}
                onClose={() => setInserting(null)}
              />
            </CanvasPanel>
          ) : null}
        </NodeCanvas>
      </div>
    </CanvasEditor>
  );
}
