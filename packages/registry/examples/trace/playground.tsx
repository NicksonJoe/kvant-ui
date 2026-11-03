import { Trace, type TraceStepData } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const running: TraceStepData[] = [
  { id: 'find', title: 'Нашёл 18 клиентов без активности за 30 дней', status: 'done', tool: 'crm.contacts.search', detail: '0,8 с' },
  { id: 'calendar', title: 'Календарь не ответил — встречи не проверены', status: 'error', tool: 'calendar.events', detail: 'таймаут 10 с', onRetry: () => {} },
  { id: 'draft', title: 'Составил письмо с предложением продлить договор', status: 'done', tool: 'mail.draft', detail: '2 варианта темы · 146 слов' },
  { id: 'threads', title: 'Проверяю, кому уже писали на этой неделе…', status: 'running', tool: 'mail.threads', progress: { value: 3, max: 18 } },
  { id: 'send', title: 'Отправить письма клиентам', status: 'pending', needsApproval: true },
];
const done = running.map((step): TraceStepData => (step.status === 'done' ? step : { ...step, status: 'done', title: step.title.replace('…', ''), progress: undefined, needsApproval: false }));

const playground: Playground = {
  initial: { task: 'Письма клиентам без активности', time: '0:42' },
  controls: [{ name: 'run', type: 'enum', options: ['running', 'done'], default: 'running', description: 'Шаги: в работе или все закончены.' }],
  render: (p) => (
    <Trace
      key={`${p.text('variant')}-${p.bool('defaultOpen')}`}
      className="w-full max-w-[640px]"
      steps={p.pick('run', ['running', 'done'] as const) === 'done' ? done : running}
      variant={p.pick('variant', ['card', 'inline'] as const)}
      task={p.text('task') || undefined}
      time={p.text('time') || undefined}
      stopped={p.bool('stopped')}
      defaultOpen={p.bool('defaultOpen')}
      onStop={() => {}}
    />
  ),
  code: (p) => `<Trace steps={steps}${p.attrs(['variant', 'task', 'time', 'stopped', 'defaultOpen'])} onStop={stop} />`,
};

export default playground;
