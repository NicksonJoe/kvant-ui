import { useId } from 'react';
import { DateField } from '@/kvant';

export default function DateFieldContract() {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className="text-label-sm font-medium text-fg-2">
        Дата договора
      </span>
      <DateField aria-labelledby={id} defaultValue={new Date(2026, 9, 27)} className="w-47" />
    </div>
  );
}
