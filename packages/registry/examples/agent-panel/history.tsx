import { useState } from 'react';
import { AgentHistory, AgentPanel, PromptInput, type AgentConversation } from '@/kvant';

const now = new Date(2026, 9, 29, 15, 0);
const start: AgentConversation[] = [
  { id: 'turnover', title: 'Оборот за октябрь', date: new Date(2026, 9, 29, 14, 32), preview: 'Готово: «Оборот · октябрь 2026.xlsx», 3 листа и сводка по этапам' },
  { id: 'sync', title: 'Сверка оплат за октябрь', date: new Date(2026, 9, 29, 14, 50), status: 'working', elapsed: '6 с' },
  { id: 'deals', title: 'Зависшие сделки', date: new Date(2026, 9, 29, 11, 5), preview: '«Навигация для ТЦ» ждёт шага 5 дней, «Сайт для яхт-клуба» — 2 дня' },
  { id: 'bills', title: 'Напоминания о счетах', date: new Date(2026, 9, 28, 18, 40), status: 'waiting', preview: 'письмо кофейне «Зерно» готово к отправке' },
  { id: 'plan', title: 'План на среду', date: new Date(2026, 9, 28, 9, 12), preview: '3 встречи и 2 просроченных шага, начать с «Навигации для ТЦ»' },
  { id: 'brief', title: 'Бриф по чайной линейке', date: new Date(2026, 9, 26, 16, 20), preview: 'Собрал 12 вопросов для «Листвы» — отправить их клиенту?' },
];

export default function AgentHistoryExample() {
  const [list, setList] = useState(start);
  const [active, setActive] = useState('turnover');
  return (
    <AgentPanel placement="inline" workspace="Студия Север" historyOpen onHistoryChange={() => {}} onClose={() => {}} composer={<PromptInput placeholder="Спросите или поручите задачу…" onSubmit={() => {}} />}>
      <AgentHistory
        conversations={list}
        activeId={active}
        now={now}
        onSelect={setActive}
        onNew={() => setActive('')}
        onRename={() => {}}
        onDelete={(id) => setList((items) => items.filter((item) => item.id !== id))}
      />
    </AgentPanel>
  );
}
