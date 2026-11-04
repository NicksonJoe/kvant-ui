import { AgentFileCard, AgentPanel, AgentStatus, AgentTable, Conversation, ConversationTurn, Message, PromptInput, Stream } from '@/kvant';

const columns = [
  { key: 'stage', label: 'Этап' },
  { key: 'count', label: 'Сделок', numeric: true },
  { key: 'sum', label: 'Сумма', numeric: true },
] as const;
const rows = [
  { stage: 'Бриф', count: 1, sum: '420 000 ₽' },
  { stage: 'Предложение', count: 2, sum: '3 204 900 ₽' },
  { stage: 'Договор', count: 1, sum: '860 000 ₽' },
  { stage: 'В работе', count: 1, sum: '3 400 000 ₽' },
  { stage: 'Сдача', count: 1, sum: '540 000 ₽' },
];

export default function AgentAnswer() {
  return (
    <AgentPanel placement="inline" size="docked" workspace="Студия Север" onClose={() => {}} onSizeChange={() => {}} composer={<PromptInput placeholder="Спросите или поручите задачу…" onAttach={() => {}} onSubmit={() => {}} />}>
      <Conversation aria-label="Агент Норды" variant="agent">
        <Message direction="outgoing">Сделай отчёт по обороту за октябрь</Message>
        <ConversationTurn>
          <AgentStatus state="done" time="за 14 с" />
          <Stream state="done" text="В октябре оплачена одна сделка — «Съёмка весеннего каталога» для «Белой лодки» на 310 000 ₽. В работе 6 сделок на 8 424 900 ₽." />
          <AgentFileCard name="Оборот · октябрь 2026.xlsx" format="xlsx" meta="3 листа · 18 КБ" onDownload={() => {}} onOpen={() => {}} />
          <AgentTable
            title="Сделки в работе по этапам"
            caption="на 29 октября · 6 сделок"
            columns={columns}
            rows={rows}
            total={{ stage: 'Итого', count: 6, sum: '8 424 900 ₽' }}
            note="Оплачено в октябре — 310 000 ₽, одна сделка"
            onDownload={() => {}}
          />
        </ConversationTurn>
      </Conversation>
    </AgentPanel>
  );
}
