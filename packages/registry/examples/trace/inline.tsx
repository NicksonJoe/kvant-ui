import { RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, ConversationTurn, Message, Stream, Trace, type TraceStepData } from '@/kvant';

const SCRIPT: readonly TraceStepData[] = [
  { id: 'deals', title: 'Собрал сделки за октябрь', status: 'done', tool: 'crm.deals.search', detail: '7 сделок · 0,6 с' },
  { id: 'payments', title: 'Сверил оплаты со счетами', status: 'done', tool: 'billing.invoices', detail: '1,1 с' },
  { id: 'funnel', title: 'Посчитал воронку по этапам', status: 'done', tool: 'crm.pipeline.stats', detail: '0,4 с' },
  { id: 'overdue', title: 'Нашёл просроченные шаги', status: 'done', tool: 'crm.tasks.overdue', detail: '2 сделки' },
];
// what a step says while it runs
const ACTIVE = ['Собираю сделки за октябрь…', 'Сверяю оплаты со счетами…', 'Считаю воронку по этапам…', 'Ищу просроченные шаги…'];
const STEP_MS = 1500;

// The status line of a turn: «В процессе» with a live timer, then «Готово за N с»; the steps open on click.
export default function TraceInline() {
  const [seconds, setSeconds] = useState(0);
  const [run, setRun] = useState(0);
  const elapsed = seconds * 1000;
  const doneCount = Math.min(Math.floor(elapsed / STEP_MS), SCRIPT.length);
  const finished = doneCount === SCRIPT.length;
  const steps = SCRIPT.map((step, index): TraceStepData =>
    index < doneCount ? step : index === doneCount ? { ...step, status: 'running', title: ACTIVE[index] ?? step.title, detail: undefined } : { ...step, status: 'pending', detail: undefined },
  );

  useEffect(() => {
    if (finished) return undefined;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [finished, run]);

  return (
    <div className="flex w-full max-w-[512px] flex-col gap-5">
      <Message direction="outgoing">Сделай отчёт по обороту за октябрь</Message>
      <ConversationTurn>
        <Trace variant="inline" steps={steps} time={finished ? `за ${seconds} с` : `${seconds} с`} />
        {finished ? (
          <Stream
            state="done"
            text="В октябре оплачена одна сделка — «Съёмка весеннего каталога» для «Белой лодки» на 310 000 ₽. В работе 6 сделок на 8 424 900 ₽, две ждут шага: «Навигация для ТЦ» — 5 дней, «Сайт для яхт-клуба» — 2 дня."
          />
        ) : null}
      </ConversationTurn>
      <Button
        variant="ghost"
        size="sm"
        leadingIcon={<RotateCcw aria-hidden />}
        onClick={() => {
          setSeconds(0);
          setRun((value) => value + 1);
        }}
        className="self-start"
      >
        Ещё раз
      </Button>
    </div>
  );
}
