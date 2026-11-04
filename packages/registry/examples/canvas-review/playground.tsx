import { CanvasProblems, type CanvasProblem } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const problems: CanvasProblem[] = [
  { id: 'cycle', kind: 'cycle', severity: 'error', title: 'Цикл без выхода', description: 'Напомнить → Ждать 3 дня → Напомнить. Добавьте условие «не больше 3 раз».', nodeIds: ['remind'] },
  { id: 'input', kind: 'required-input', severity: 'error', title: 'Пустой обязательный вход', description: '«Счёт в банк» ждёт «клиент», но к нему ничего не подключено.', nodeIds: ['bill'] },
  { id: 'branch', kind: 'open-branch', severity: 'warning', title: 'Ветка обрывается', description: 'После «Ответить шаблоном» ничего нет — клиент не попадёт в CRM.', nodeIds: ['reply'] },
  { id: 'type', kind: 'type-mismatch', severity: 'warning', title: 'Текст идёт в число', description: '«Сумма» получает текст — вставить конвертер «текст → число»?', nodeIds: ['deal'] },
];

const playground: Playground = {
  controls: [{ name: 'errors', type: 'boolean', default: true, description: 'С ошибками или только предупреждения.' }],
  render: (p) => (
    <CanvasProblems
      className="w-full max-w-[650px]"
      problems={p.bool('errors') ? problems : problems.filter((problem) => problem.severity === 'warning')}
      publishing={p.bool('publishing')}
      onShow={() => {}}
      canFix={(problem) => problem.kind === 'type-mismatch'}
      onFix={() => {}}
      onPublish={() => {}}
    />
  ),
  code: (p) => `<CanvasProblems problems={checkGraph(graph, { label })}${p.attrs(['publishing'])} onShow={focusNode} onPublish={publish} />`,
};

export default playground;
