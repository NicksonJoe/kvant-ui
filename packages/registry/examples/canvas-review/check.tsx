import { useState } from 'react';
import { CanvasProblems, checkGraph, type CanvasGraph, type CanvasNode, type CanvasPort } from '@/kvant';

interface Step {
  title: string;
}

const flowIn: CanvasPort = { id: 'in', side: 'top', direction: 'in', type: 'flow' };
const flowOut: CanvasPort = { id: 'out', side: 'bottom', direction: 'out', type: 'flow' };
const step = (id: string, title: string, kind: CanvasNode['kind'], ports: CanvasPort[] = [flowIn, flowOut]): CanvasNode<Step> => ({ id, kind, position: { x: 0, y: 0 }, ports, data: { title } });

const graph: CanvasGraph<Step> = {
  nodes: [
    step('message', 'Новое сообщение', 'trigger', [flowOut]),
    step('parse', 'Разобрать заявку', 'agent', [flowIn, flowOut, { id: 'task', side: 'right', direction: 'out', type: 'text' }]),
    step('budget', 'Есть бюджет?', 'condition', [flowIn, { id: 'yes', side: 'right', direction: 'out', type: 'flow', label: 'да' }, { id: 'no', side: 'bottom', direction: 'out', type: 'flow', label: 'нет' }]),
    step('deal', 'Создать сделку', 'action', [flowIn, { id: 'sum', side: 'left', direction: 'in', type: 'number', label: 'Сумма' }]),
    step('bill', 'Счёт в банк', 'action', [flowIn, { id: 'client', side: 'left', direction: 'in', type: 'object', label: 'клиент', required: true }]),
    step('remind', 'Напомнить', 'action'),
    step('wait', 'Ждать 3 дня', 'wait'),
  ],
  edges: [
    { id: 'e1', source: 'message', sourcePort: 'out', target: 'parse', targetPort: 'in' },
    { id: 'e2', source: 'parse', sourcePort: 'out', target: 'budget', targetPort: 'in' },
    { id: 'e3', source: 'budget', sourcePort: 'yes', target: 'deal', targetPort: 'in' },
    { id: 'e4', source: 'parse', sourcePort: 'task', target: 'deal', targetPort: 'sum' },
    { id: 'e5', source: 'deal', sourcePort: 'out', target: 'bill', targetPort: 'in' },
    { id: 'e6', source: 'bill', sourcePort: 'out', target: 'remind', targetPort: 'in' },
    { id: 'e7', source: 'remind', sourcePort: 'out', target: 'wait', targetPort: 'in' },
    { id: 'e8', source: 'wait', sourcePort: 'out', target: 'remind', targetPort: 'in' },
  ],
};

export default function CanvasCheck() {
  const [shown, setShown] = useState<string | null>(null);
  const problems = checkGraph(graph, { label: (node) => node.data.title });
  const name = (id: string | undefined) => graph.nodes.find((node) => node.id === id)?.data.title;
  return (
    <div className="flex w-full max-w-[650px] flex-col gap-3">
      <CanvasProblems problems={problems} onShow={(problem) => setShown(name(problem.nodeIds[0]) ?? null)} onPublish={() => {}} />
      <p className="text-caption text-fg-3">{shown ? `Камера у шага «${shown}»` : 'Нажмите «Показать» — камера поедет к шагу.'}</p>
    </div>
  );
}
