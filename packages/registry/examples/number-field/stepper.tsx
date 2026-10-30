import { useState } from 'react';
import { Stepper } from '@/kvant';

export default function NumberFieldStepper() {
  const [guests, setGuests] = useState(3);
  const [reminders, setReminders] = useState(1);
  return (
    <div className="w-full max-w-96 overflow-hidden rounded-2xl bg-surface-1 shadow-raised">
      <div className="flex h-13 items-center gap-3 pr-2.5 pl-4">
        <span className="min-w-0 flex-1 text-body-md text-fg-1">Гостей на встрече</span>
        <span className="text-body-md text-fg-3 tabular-nums">{guests}</span>
        <Stepper aria-label="Гостей на встрече" value={guests} onValueChange={setGuests} min={0} max={12} />
      </div>
      <div className="ml-4 h-px bg-separator" />
      <div className="flex h-13 items-center gap-3 pr-2.5 pl-4">
        <span className="min-w-0 flex-1 text-body-md text-fg-1">Напоминаний</span>
        <span className="text-body-md text-fg-3 tabular-nums">{reminders}</span>
        <Stepper aria-label="Напоминаний" value={reminders} onValueChange={setReminders} min={1} max={5} />
      </div>
    </div>
  );
}
