import { AgentEmpty, AgentHistory, AgentPanel, PromptInput, type AgentPanelSize } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const suggestions = ['Сделай отчёт по обороту за октябрь', 'Какие сделки зависли и почему?', 'Что у меня сегодня?', 'Напомни клиентам о неоплаченных счетах'];
const now = new Date(2026, 9, 29, 15, 0);
const conversations = [
  { id: 'turnover', title: 'Оборот за октябрь', date: new Date(2026, 9, 29, 14, 32), preview: 'Готово: «Оборот · октябрь 2026.xlsx»' },
  { id: 'bills', title: 'Напоминания о счетах', date: new Date(2026, 9, 28, 18, 40), status: 'waiting' as const, preview: 'письмо кофейне «Зерно» готово' },
];

const playground: Playground = {
  initial: { workspace: 'Студия Север', placement: 'inline' },
  render: (p) => (
    <AgentPanel
      placement={p.pick('placement', ['inline', 'fixed'] as const)}
      size={p.pick('size', ['floating', 'docked'] as const) satisfies AgentPanelSize}
      workspace={p.text('workspace') || undefined}
      historyOpen={p.bool('historyOpen')}
      onHistoryChange={() => {}}
      onSizeChange={() => {}}
      onClose={() => {}}
      composer={<PromptInput placeholder="Спросите или поручите задачу…" onAttach={() => {}} onSubmit={() => {}} />}
    >
      {p.bool('historyOpen') ? (
        <AgentHistory conversations={conversations} activeId="turnover" now={now} onSelect={() => {}} onNew={() => {}} />
      ) : (
        <AgentEmpty name="Анна" description="Знаю всё о «Студии Север»: клиентов, сделки, задачи и деньги." suggestions={suggestions} onSelect={() => {}} />
      )}
    </AgentPanel>
  ),
  code: (p) => `<AgentPanel${p.attrs(['workspace', 'size', 'historyOpen', 'placement'])} onClose={close} composer={<PromptInput onSubmit={send} />}>
  <AgentEmpty name="Анна" suggestions={suggestions} onSelect={send} />
</AgentPanel>`,
};

export default playground;
