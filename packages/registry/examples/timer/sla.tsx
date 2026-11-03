import { useState } from 'react';
import { Badge, Button, Progress, Timer, useCountdown } from '@/kvant';

const SLA = 4 * 3_600_000;

export default function TimerSla() {
  // the request came 1 h 45 min 23 s ago, the answer is due 4 h after it
  const [deadline] = useState(() => Date.now() + 2 * 3_600_000 + 14 * 60_000 + 37_000);
  const left = useCountdown(deadline);
  const spent = Math.min(SLA, SLA - left);
  const hours = Math.floor(spent / 3_600_000);
  const minutes = Math.floor((spent % 3_600_000) / 60_000);

  return (
    <div className="flex w-160 max-w-full flex-col gap-6 rounded-xl bg-surface-1 p-6 shadow-raised">
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-col gap-0.5">
          <h3 className="text-body-md font-semibold tracking-heading-xs text-fg-1">Ответить клиенту</h3>
          <p className="text-body-xs text-fg-3">«Студия Север» · обращение № 4821 · SLA 4 часа</p>
        </div>
        {left > 0 ? (
          <Badge tone="success" icon={<span className="size-1.5 rounded-full bg-success" />}>
            В срок
          </Badge>
        ) : (
          <Badge tone="danger">Просрочено</Badge>
        )}
      </div>
      <Timer value={left} aria-label="До ответа клиенту" />
      <div className="flex flex-col gap-2">
        <div className="flex justify-between gap-3 text-body-xs/(--leading-overline)">
          <span className="font-medium text-fg-2">
            Прошло {hours} ч {minutes} мин из 4 ч
          </span>
          <span className="text-fg-3">до 18:30</span>
        </div>
        <Progress value={(spent / SLA) * 100} aria-label="Прошло от срока ответа" />
      </div>
      <dl className="flex flex-wrap gap-x-8 gap-y-3 border-t border-separator pt-4">
        {[
          ['Получено', 'Сегодня, 14:30'],
          ['Первый ответ', 'до 18:30'],
          ['Ответственная', 'Вера Ланская'],
        ].map(([term, value]) => (
          <div key={term} className="flex flex-col gap-0.5">
            <dt className="text-caption font-medium text-fg-3">{term}</dt>
            <dd className="text-body-sm/(--leading-label-md) font-medium text-fg-1">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center gap-2">
        <Button size="sm">Ответить</Button>
        <Button size="sm" variant="ghost">
          Перенести срок
        </Button>
      </div>
    </div>
  );
}
