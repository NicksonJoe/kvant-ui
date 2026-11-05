import { useId, useState } from 'react';
import { TimeField } from '@/kvant';

export default function TimeFieldTyped() {
  const id = useId();
  const [time, setTime] = useState('');
  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className="text-label-sm font-medium text-fg-2">
        Напомнить в
      </span>
      <TimeField aria-labelledby={id} value={time} onValueChange={setTime} className="w-36" />
      <span className="text-caption text-fg-3">{time ? `Сохранено: ${time}` : 'Наберите «930» или «17:45», ↑↓ — по 15 минут.'}</span>
    </div>
  );
}
