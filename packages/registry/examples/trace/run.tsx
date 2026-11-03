import { RotateCcw } from 'lucide-react';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Avatar, AvatarGroup, Button, Trace, TraceApproval, TraceApprovalDetail, type TraceDecision, type TraceStepData } from '@/kvant';

const start: TraceStepData[] = [
  { id: 'find', title: 'Ищу клиентов без активности за 30 дней…', status: 'running', tool: 'crm.contacts.search' },
  { id: 'calendar', title: 'Проверить встречи в календаре', status: 'pending', tool: 'calendar.events' },
  { id: 'draft', title: 'Составить письмо с предложением продлить договор', status: 'pending', tool: 'mail.draft' },
  { id: 'threads', title: 'Проверить, кому уже писали на этой неделе', status: 'pending', tool: 'mail.threads' },
  { id: 'send', title: 'Отправить письма клиентам', status: 'pending', needsApproval: true },
];

const CLIENTS = 18;
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

// A scripted run: each step resolves on a timer; the calendar fails once and is retried by hand.
export default function TraceRun() {
  const [steps, setSteps] = useState(start);
  const [seconds, setSeconds] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [decision, setDecision] = useState<TraceDecision | undefined>();
  const [pending, setPending] = useState(false);
  const [run, setRun] = useState(0);
  const timers = useRef<number[]>([]);

  const patch = (id: string, change: Partial<TraceStepData>) => setSteps((list) => list.map((step) => (step.id === id ? { ...step, ...change } : step)));
  const later = (ms: number, task: () => void) => timers.current.push(window.setTimeout(task, ms));
  const clear = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };

  const retryCalendar = () => {
    patch('calendar', { status: 'running', title: 'Проверяю встречи в календаре…', detail: undefined, onRetry: undefined });
    later(1100, () => patch('calendar', { status: 'done', title: 'Проверил календарь — встреч с ними нет', detail: '1,1 с' }));
  };

  const script = useEffectEvent(() => {
    later(900, () => {
      patch('find', { status: 'done', title: `Нашёл ${CLIENTS} клиентов без активности за 30 дней`, detail: '0,8 с' });
      patch('calendar', { status: 'running', title: 'Проверяю встречи в календаре…' });
    });
    later(2200, () => {
      patch('calendar', { status: 'error', title: 'Календарь не ответил — встречи не проверены', detail: 'таймаут 10 с', onRetry: retryCalendar });
      patch('draft', { status: 'running', title: 'Составляю письмо…' });
    });
    later(3600, () => {
      patch('draft', { status: 'done', title: 'Составил письмо с предложением продлить договор', detail: '2 варианта темы · 146 слов' });
      patch('threads', { status: 'running', title: 'Проверяю, кому уже писали на этой неделе…', progress: { value: 0, max: CLIENTS } });
    });
    for (let value = 1; value <= CLIENTS; value++) later(3600 + value * 180, () => patch('threads', { progress: { value, max: CLIENTS } }));
    later(3600 + CLIENTS * 180 + 200, () => patch('threads', { status: 'done', title: 'Проверил переписку: писали двоим, их пропущу', progress: undefined, detail: '3,4 с' }));
  });
  const stopAll = useEffectEvent(clear);

  // the script starts again with «Сначала»
  useEffect(() => {
    script();
    return () => stopAll();
  }, [run]);

  const finished = stopped || decision !== undefined;
  // the timer runs while the agent works
  useEffect(() => {
    if (finished) return undefined;
    const tick = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(tick);
  }, [finished, run]);

  const restart = () => {
    clear();
    setSteps(start);
    setSeconds(0);
    setStopped(false);
    setDecision(undefined);
    setPending(false);
    setRun((value) => value + 1);
  };

  const sentAt = new Date().toLocaleTimeString('ru-RU', { hour: 'numeric', minute: '2-digit' });
  const waiting = !finished && steps.every((step) => step.status !== 'running' && (step.id === 'send' || step.status !== 'pending'));
  const decide = (choice: TraceDecision) => {
    setPending(true);
    later(700, () => {
      setPending(false);
      setDecision(choice);
      if (choice === 'approved') patch('send', { status: 'done', title: `Отправил письма ${CLIENTS - 2} клиентам`, needsApproval: false, tool: 'mail.send', detail: '2,1 с' });
      else setStopped(true);
    });
  };

  return (
    <div className="flex w-full max-w-[640px] flex-col gap-4">
      <Trace
        steps={steps}
        task="Письма клиентам без активности"
        time={clock(seconds)}
        stopped={stopped}
        onStop={() => {
          clear();
          setStopped(true);
        }}
      />
      {waiting || decision ? (
        <TraceApproval
          title={`Отправить письмо ${CLIENTS - 2} клиентам?`}
          description="Агент подготовил письмо и не отправит его без вашего решения."
          details={
            <>
              <TraceApprovalDetail label="Тема">Продлим договор на 2027 год со скидкой 10 %</TraceApprovalDetail>
              <TraceApprovalDetail label="Кому">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <AvatarGroup size={24} max={3}>
                    <Avatar name="Студия Север" size={24} />
                    <Avatar name="Орбита Лаб" size={24} />
                    <Avatar name="Мост Капитал" size={24} />
                    <Avatar name="Белая лодка" size={24} />
                  </AvatarGroup>
                  <span className="text-body-xs text-fg-2">«Студия Север», «Орбита Лаб», «Мост Капитал» и ещё {CLIENTS - 5}</span>
                </span>
              </TraceApprovalDetail>
            </>
          }
          edit={
            <Button variant="link" size="md">
              Изменить письмо
            </Button>
          }
          pending={pending}
          decision={decision}
          result={decision === 'approved' ? `${CLIENTS - 2} писем отправлено в ${sentAt}` : 'агент остановился и ничего не отправил'}
          onApprove={() => decide('approved')}
          onReject={() => decide('rejected')}
        />
      ) : null}
      <Button variant="ghost" size="sm" leadingIcon={<RotateCcw aria-hidden />} onClick={restart} className="self-start">
        Сначала
      </Button>
    </div>
  );
}
