import { CanvasRunPanel, type CanvasRunStep } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const steps: CanvasRunStep[] = [
  { id: 'message', title: 'Новое сообщение', status: 'done', start: 0, duration: 80 },
  { id: 'parse', title: 'Разобрать заявку', status: 'running', start: 100, duration: 1500, detail: '840 токенов' },
  { id: 'budget', title: 'Есть бюджет?', status: 'waiting' },
  { id: 'deal', title: 'Создать сделку', status: 'waiting' },
  { id: 'reply', title: 'Ответить шаблоном', status: 'skipped', reason: 'пропущен — ветка «нет» не выбрана' },
];

const playground: Playground = {
  initial: { title: 'Запуск № 24', elapsed: 1600, testLabel: 'тест: «Заявка Ивана, сайт, 120 000 ₽»' },
  render: (p) => (
    <CanvasRunPanel
      className="w-full"
      title={p.text('title')}
      status={p.pick('status', ['running', 'done', 'error', 'stopped'] as const)}
      elapsed={p.num('elapsed')}
      testLabel={p.text('testLabel') || undefined}
      collapsed={p.bool('collapsed')}
      onCollapsedChange={() => {}}
      steps={steps}
      selectedStepId="parse"
      output={{ budget: 120000, deadline: '2026-12-15', task: 'Сайт', contact: { name: 'Иван', phone: '+7 900 000-00-00' } }}
      onStop={() => {}}
      onPin={() => {}}
    />
  ),
  code: (p) => `<CanvasRunPanel${p.attrs(['title', 'status', 'elapsed', 'testLabel', 'collapsed'])} steps={steps} selectedStepId={selected} onSelectStep={select} output={output} onStop={stop} />`,
};

export default playground;
