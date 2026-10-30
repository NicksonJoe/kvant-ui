import { useId } from 'react';
import { TimeSlots } from '@/kvant';

export default function TimePickerSlots() {
  const id = useId();
  return (
    <div className="flex max-w-104 flex-col gap-3">
      <span id={id} className="text-label-sm font-medium text-fg-2">
        Пятница, 30 октября · 45 минут
      </span>
      <TimeSlots
        aria-labelledby={id}
        slots={['09:30', '10:00', '10:30', '11:15', '12:30', '14:00', '15:30', '16:15', '17:00']}
        unavailable={['10:00', '16:15']}
        defaultValue="10:30"
      />
      <p className="text-caption text-fg-3">Зачёркнутые слоты уже заняты — их видно, чтобы не гадать, куда делось время.</p>
    </div>
  );
}
