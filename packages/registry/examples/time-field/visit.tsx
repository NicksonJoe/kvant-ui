import { useId, useState } from 'react';
import { TimeField } from '@/kvant';

export default function TimeFieldVisit() {
  const start = useId();
  const end = useId();
  const error = useId();
  const [from, setFrom] = useState('10:00');
  const [to, setTo] = useState('11:30');
  const invalid = Boolean(from && to && to <= from);
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <span id={start} className="text-label-sm font-medium text-fg-2">
          Начало
        </span>
        <TimeField aria-labelledby={start} value={from} onValueChange={setFrom} step={15} className="w-32" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span id={end} className="text-label-sm font-medium text-fg-2">
          Конец
        </span>
        <TimeField aria-labelledby={end} value={to} onValueChange={setTo} step={15} invalid={invalid} aria-describedby={invalid ? error : undefined} className="w-32" />
      </div>
      {invalid ? <span id={error} className="pb-2 text-caption text-danger">Конец раньше начала</span> : null}
    </div>
  );
}
