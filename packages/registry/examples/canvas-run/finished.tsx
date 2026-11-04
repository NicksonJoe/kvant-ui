import { useState } from 'react';
import { CanvasRunPanel, type CanvasRunStep } from '@/kvant';

const done: CanvasRunStep[] = [
  { id: 'message', title: 'Новое сообщение', status: 'done', start: 0, duration: 80 },
  { id: 'parse', title: 'Разобрать заявку', status: 'done', start: 100, duration: 1400, detail: '840 токенов' },
  { id: 'budget', title: 'Есть бюджет?', status: 'done', start: 1520, duration: 40 },
  { id: 'deal', title: 'Создать сделку', status: 'done', start: 1580, duration: 700, detail: '1 запись' },
  { id: 'reply', title: 'Ответить шаблоном', status: 'skipped', reason: 'пропущен — ветка «нет» не выбрана' },
];
const failed: CanvasRunStep[] = [
  ...done.slice(0, 3),
  { id: 'deal', title: 'Создать сделку', status: 'error', start: 1580, duration: 10_000, reason: 'CRM не ответила за 10 с' },
  { id: 'reply', title: 'Ответить шаблоном', status: 'waiting' },
];

export default function CanvasRunFinished() {
  const [selected, setSelected] = useState('deal');
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex w-full flex-col gap-6">
      <CanvasRunPanel title="Запуск № 23" status="done" elapsed={2300} steps={done} selectedStepId={selected} onSelectStep={setSelected} output={{ deal: 'D-1043', stage: 'Новые' }} collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <CanvasRunPanel title="Запуск № 22" status="error" elapsed={11_600} steps={failed} selectedStepId="deal" log={['14:20:11 POST crm/deals', '14:20:21 таймаут 10 с — шаг остановлен']} />
    </div>
  );
}
