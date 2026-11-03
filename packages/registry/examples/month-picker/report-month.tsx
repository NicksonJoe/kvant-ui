import { useState } from 'react';
import { Field, MonthPicker } from '@/kvant';

const today = new Date();

export default function MonthPickerReportMonth() {
  const [month, setMonth] = useState<Date | null>(new Date(today.getFullYear(), today.getMonth() - 1, 1));
  const future = month !== null && month > today;
  return (
    <Field
      label="Отчётный месяц"
      description="Напечатайте «10.2026» или «окт 26» — или выберите в сетке."
      error={future ? 'Период ещё не начался' : undefined}
      className="w-80 max-w-full"
    >
      <MonthPicker value={month} onValueChange={setMonth} />
    </Field>
  );
}
