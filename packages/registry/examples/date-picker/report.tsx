import { useState } from 'react';
import { DateRangePicker, type DateRange } from '@/kvant';

const today = new Date();

export default function DatePickerReport() {
  const [period, setPeriod] = useState<DateRange>({
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29),
    end: today,
  });
  return (
    <div className="flex w-80 max-w-full flex-col gap-1.5">
      <span className="text-label-sm font-medium text-fg-2">Период отчёта</span>
      <DateRangePicker aria-label="Период отчёта" max={today} value={period} onValueChange={setPeriod} />
      <span className="text-caption text-fg-3">Будущие даты недоступны: сегодня — последний день периода.</span>
    </div>
  );
}
