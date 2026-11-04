import { useEffect, useRef, useState } from 'react';
import { Button, CanvasRunPanel, type CanvasRunState, type CanvasRunStep } from '@/kvant';

const plan: { id: string; title: string; ms: number; detail?: string }[] = [
  { id: 'message', title: 'Новое сообщение', ms: 80 },
  { id: 'parse', title: 'Разобрать заявку', ms: 1500, detail: '840 токенов' },
  { id: 'budget', title: 'Есть бюджет?', ms: 40 },
  { id: 'deal', title: 'Создать сделку', ms: 600, detail: '1 запись' },
];
// each step starts 20 ms after the previous one ends
const starts = plan.map((_, index) => plan.slice(0, index).reduce((sum, step) => sum + step.ms + 20, 0));
const total = (starts.at(-1) ?? 0) + (plan.at(-1)?.ms ?? 0);
const outputs: Record<string, { budget?: number; task?: string; deal?: string; branch?: string; text?: string }> = {
  message: { text: 'Нужен сайт до 15 декабря, бюджет 120 тысяч' },
  parse: { budget: 120000, task: 'Сайт' },
  budget: { branch: 'да' },
  deal: { deal: 'D-1043' },
};

// A scripted run: the clock ticks every 100 ms and the steps resolve in order.
export default function CanvasRunLive() {
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<CanvasRunState>('running');
  const [selected, setSelected] = useState('parse');
  const timer = useRef<number | undefined>(undefined);

  const steps: CanvasRunStep[] = plan.map((step, index) => {
    const from = starts[index] ?? 0;
    if (elapsed < from) return { id: step.id, title: step.title, status: status === 'stopped' ? 'skipped' : 'waiting', reason: status === 'stopped' ? 'остановлен вручную' : undefined };
    const duration = Math.min(step.ms, elapsed - from);
    return { id: step.id, title: step.title, status: duration < step.ms ? (status === 'stopped' ? 'skipped' : 'running') : 'done', start: from, duration, detail: duration < step.ms ? undefined : step.detail };
  });
  const active = status === 'running' && elapsed < total;
  const shown: CanvasRunState = status === 'running' && !active ? 'done' : status;

  useEffect(() => {
    if (!active) return undefined;
    timer.current = window.setInterval(() => setElapsed((value) => value + 100), 100);
    return () => window.clearInterval(timer.current);
  }, [active]);

  return (
    <div className="flex w-full flex-col items-start gap-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setElapsed(0);
          setStatus('running');
        }}
      >
        Запустить заново
      </Button>
      <CanvasRunPanel
        className="w-full"
        title="Запуск № 24"
        status={shown}
        elapsed={Math.min(elapsed, total)}
        testLabel="тест: «Заявка Ивана, сайт, 120 000 ₽»"
        steps={steps}
        selectedStepId={selected}
        onSelectStep={setSelected}
        input={selected === 'message' ? undefined : outputs.message}
        output={steps.find((step) => step.id === selected)?.status === 'done' ? outputs[selected] : undefined}
        log={['14:28:03 вызов модели «Норда · быстрая»', '14:28:04 ответ 840 токенов']}
        onStop={() => setStatus('stopped')}
        onPin={() => {}}
      />
    </div>
  );
}
