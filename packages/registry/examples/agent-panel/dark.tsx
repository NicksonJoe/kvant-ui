import { AgentEmpty, AgentFileCard, AgentLauncher, AgentPanel, PromptInput } from '@/kvant';

const suggestions = ['Сделай отчёт по обороту за октябрь', 'Какие сделки зависли и почему?', 'Что у меня сегодня?'];

export default function AgentDark() {
  return (
    <div data-mode="dark" className="flex w-full flex-wrap items-end gap-8 rounded-2xl bg-background p-8 text-fg-1">
      <AgentPanel placement="inline" workspace="Студия Север" onClose={() => {}} onHistoryChange={() => {}} composer={<PromptInput placeholder="Спросите или поручите задачу…" onAttach={() => {}} onSubmit={() => {}} />}>
        <AgentEmpty name="Анна" description="Знаю всё о «Студии Север»: клиентов, сделки, задачи и деньги." suggestions={suggestions} onSelect={() => {}} />
      </AgentPanel>
      <div className="flex flex-col items-end gap-6">
        <AgentFileCard className="w-[356px]" name="Оборот · октябрь 2026.xlsx" format="xlsx" meta="3 листа · 18 КБ" onDownload={() => {}} onOpen={() => {}} />
        <div className="flex gap-6">
          <AgentLauncher placement="inline" />
          <AgentLauncher placement="inline" status="working" />
          <AgentLauncher placement="inline" status="unread" />
        </div>
      </div>
    </div>
  );
}
