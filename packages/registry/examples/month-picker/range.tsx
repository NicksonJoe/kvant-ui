import { useState } from 'react';
import { MonthRangePicker, type MonthRange } from '@/kvant';

const today = new Date();
const quarter = Math.floor(today.getMonth() / 3) * 3;

export default function MonthPickerRange() {
  const [period, setPeriod] = useState<MonthRange>({
    start: new Date(today.getFullYear(), quarter - 3, 1),
    end: new Date(today.getFullYear(), quarter - 1, 1),
  });
  return (
    <div className="flex w-80 max-w-full flex-col gap-1.5">
      <span className="text-label-sm font-medium text-fg-2">Период выручки</span>
      <MonthRangePicker aria-label="Период выручки" max={today} value={period} onValueChange={setPeriod} />
      <span className="text-caption text-fg-3">Квартал — одной кнопкой; будущие месяцы недоступны.</span>
    </div>
  );
}
