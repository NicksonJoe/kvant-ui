import { useState } from 'react';
import { MonthCalendar } from '@/kvant';

export default function MonthPickerInline() {
  const [month, setMonth] = useState<Date>(new Date(new Date().getFullYear(), 9, 1));
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface-1 p-4 shadow-raised">
      <MonthCalendar value={month} onValueChange={setMonth} />
      <p className="px-1.5 text-label-sm text-fg-2">
        Закрытие: {month.toLocaleDateString('ru', { month: 'long', year: 'numeric' })}
      </p>
    </div>
  );
}
