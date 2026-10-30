import { useId } from 'react';
import { DateField } from '@/kvant';

export default function DateFieldDeadline() {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className="text-label-sm font-medium text-fg-2">
        Срок оплаты
      </span>
      <DateField aria-labelledby={id} min={new Date()} className="w-47" />
      <span className="text-caption text-fg-3">Календарь за кнопкой не даст выбрать прошедший день.</span>
    </div>
  );
}
