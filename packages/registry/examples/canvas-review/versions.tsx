import { useState } from 'react';
import { CanvasChangeNote, CanvasVersionBar, CanvasVersionList, diffGraphs, type CanvasGraph, type CanvasNode, type CanvasVersion } from '@/kvant';

interface Step {
  title: string;
  instruction?: string;
}

const step = (id: string, kind: CanvasNode['kind'], data: Step): CanvasNode<Step> => ({ id, kind, position: { x: 0, y: 0 }, ports: [], data });
const v7: CanvasGraph<Step> = {
  nodes: [step('message', 'trigger', { title: 'Новое сообщение' }), step('parse', 'agent', { title: 'Разобрать заявку', instruction: 'Найди бюджет и срок.' }), step('reply', 'action', { title: 'Ответить шаблоном' })],
  edges: [],
};
const draft: CanvasGraph<Step> = {
  nodes: [
    step('message', 'trigger', { title: 'Новое сообщение' }),
    step('parse', 'agent', { title: 'Разобрать заявку', instruction: 'Найди бюджет, срок и задачу. Нет бюджета — верни 0.' }),
    step('budget', 'condition', { title: 'Есть бюджет?' }),
    step('deal', 'action', { title: 'Создать сделку' }),
  ],
  edges: [],
};
const versions: CanvasVersion[] = [
  { id: 'draft', label: 'Черновик', draft: true, note: 'с тех пор 2 правки' },
  { id: 'v7', label: 'Версия 7', date: new Date(2026, 9, 28), byline: 'Опубликовала Ирина', current: true },
  { id: 'v6', label: 'Версия 6', date: new Date(2026, 9, 20), byline: 'Опубликовал Игорь' },
];

export default function CanvasVersions() {
  const [comparing, setComparing] = useState('v7');
  return (
    <div className="flex w-full flex-wrap items-start gap-6">
      <CanvasVersionList className="w-[312px]" versions={versions} comparingId={comparing} onCompare={setComparing} onRestore={() => {}} />
      <div className="flex flex-col items-start gap-4">
        <CanvasVersionBar from="v7 · 28 октября" to="Черновик" diff={diffGraphs(v7, draft)} restoreLabel="Восстановить v7" onRestore={() => {}} />
        <CanvasChangeNote title="Инструкция агента" before="Найди бюджет и срок." after="Найди бюджет, срок и задачу. Нет бюджета — верни 0." meta="Вы · 4 мин назад" />
      </div>
    </div>
  );
}
