import { useState } from 'react';
import {
  Button,
  CanvasControls,
  CanvasEditor,
  CanvasMiniMap,
  CanvasNodeCard,
  CanvasNote,
  CanvasPanel,
  NodeCanvas,
  StepPalette,
  useCanvasHistory,
  type CanvasGraph,
  type CanvasNode,
  type CanvasNodeRenderState,
  type CanvasPort,
  type CanvasRunStatus,
  type CanvasSaveState,
  type CanvasStepTemplate,
} from '@/kvant';
import { STEP_GROUPS } from '../step-palette/data';

interface DemoStep {
  title: string;
  subtitle?: string;
  summary?: string;
  statusText?: string;
  outputCount?: number;
  changed?: boolean;
}

const IN: CanvasPort = { id: 'in', side: 'top', direction: 'in', type: 'flow' };
const OUT: CanvasPort = { id: 'out', side: 'bottom', direction: 'out', type: 'flow' };

const demoStep = (id: string, kind: CanvasNode['kind'], x: number, y: number, data: DemoStep, status?: CanvasRunStatus): CanvasNode<DemoStep> => ({
  id,
  kind,
  position: { x, y },
  ports: kind === 'trigger' ? [OUT] : kind === 'note' ? [] : [IN, OUT],
  status,
  data,
  ...(kind === 'note' ? { width: 220, height: 120 } : {}),
});

const DEMO_GRAPH: CanvasGraph<DemoStep> = {
  nodes: [
    demoStep('trigger', 'trigger', 0, 0, { title: 'Новое сообщение', subtitle: 'Триггер · Telegram', summary: '@norda_bot · личные', outputCount: 12 }, 'done'),
    demoStep('agent', 'agent', -16, 160, { title: 'Разобрать заявку', subtitle: 'Агент Норды', statusText: 'Выполняется · 1,2 с' }, 'running'),
    demoStep('budget', 'condition', 0, 330, { title: 'Есть бюджет?', summary: 'budget ≥ 50 000', changed: true }),
    demoStep('note', 'note', 280, 0, { title: 'Порог бюджета согласовать с Игорем — может, 30 000 ₽ для повторных клиентов?' }),
  ],
  edges: [
    { id: 'e1', source: 'trigger', sourcePort: 'out', target: 'agent', targetPort: 'in', status: 'done' },
    { id: 'e2', source: 'agent', sourcePort: 'out', target: 'budget', targetPort: 'in', status: 'running' },
  ],
};

const renderDemoNode = (node: CanvasNode<DemoStep>, state: CanvasNodeRenderState) =>
  node.kind === 'note' ? (
    <CanvasNote className="size-full" author={{ name: 'Анна', color: 'var(--color-chart-2)' }} time="2 мин назад">
      {node.data.title}
    </CanvasNote>
  ) : (
    <CanvasNodeCard
      kind={node.kind}
      title={node.data.title}
      subtitle={node.data.subtitle}
      summary={node.data.summary}
      status={node.status}
      statusText={node.data.statusText}
      outputCount={node.data.outputCount}
      changed={node.data.changed}
      selected={state.selected}
    />
  );
const demoLabel = (node: CanvasNode<DemoStep>) => node.data.title;

/** The canvas of the editor examples: the real engine, so the graph pans, zooms and fits like in the product. */
export function DemoCanvas() {
  const history = useCanvasHistory(DEMO_GRAPH);
  return (
    <NodeCanvas<DemoStep>
      aria-label="Воркфлоу «Заявка из Telegram → сделка»"
      className="size-full min-h-[480px]"
      nodes={history.graph.nodes}
      edges={history.graph.edges}
      onGraphChange={history.change}
      onUndo={history.undo}
      onRedo={history.redo}
      renderNode={renderDemoNode}
      nodeLabel={demoLabel}
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

export function DemoPalette({ onInsert }: { onInsert: (template: CanvasStepTemplate) => void }) {
  return <StepPalette groups={STEP_GROUPS} onInsert={onInsert} />;
}

export function DemoInspector() {
  return (
    <div className="flex flex-col gap-1 p-4">
      <span className="text-body-sm font-semibold text-fg-1">Разобрать заявку</span>
      <span className="text-caption text-fg-3">Агент Норды · шаг 2</span>
      <p className="mt-4 text-body-xs text-fg-2">Здесь инспектор выделенного шага: параметры, данные и запуски.</p>
    </div>
  );
}

export default function CanvasEditorWorkflow() {
  const [saved, setSaved] = useState('сохранено только что');
  const [saveState, setSaveState] = useState<CanvasSaveState>('saved');
  const [errors, setErrors] = useState(1);
  const [message, setMessage] = useState('');
  return (
    <div className="flex w-full flex-col gap-3">
      <CanvasEditor
        className="h-[640px] w-full rounded-xl shadow-raised"
        breadcrumbs={[{ label: 'Автоматизации', href: '#' }]}
        title="Заявка из Telegram → сделка"
        version="Черновик · опубликована v7"
        saved={saved}
        saveState={saveState}
        onRetrySave={() => setSaveState('saved')}
        errors={errors}
        people={[
          { name: 'Анна Носова', color: 'var(--color-chart-2)' },
          { name: 'Игорь Гусев', color: 'var(--color-chart-6)' },
          { name: 'Мария Котова', color: 'var(--color-chart-3)' },
          { name: 'Пётр Лосев', color: 'var(--color-chart-8)' },
        ]}
        onHistory={() => setMessage('Открыта история изменений')}
        onValidate={() => setMessage(errors > 0 ? '1 шаг не настроен: «Ответить шаблоном» — не выбран шаблон' : 'Ошибок нет')}
        onRun={() => setMessage('Тестовый запуск начался')}
        onPublish={() => setSaved('опубликовано как v8')}
        palette={<DemoPalette onInsert={(step) => setSaved(`добавлен шаг «${step.title}»`)} />}
        actions={
          errors > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setErrors(0)}>
              Исправить
            </Button>
          ) : null
        }
        inspector={<DemoInspector />}
      >
        <DemoCanvas />
      </CanvasEditor>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setSaveState(saveState === 'failed' ? 'saved' : 'failed')}>
          {saveState === 'failed' ? 'Сохранение прошло' : 'Сбой сохранения'}
        </Button>
        <p className="min-h-5 text-body-sm text-fg-2">{message}</p>
      </div>
    </div>
  );
}
