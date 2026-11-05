import { Columns3, List } from 'lucide-react';
import { useState } from 'react';
import { SegmentedControl } from '@/kvant';

type View = 'list' | 'board';
type Period = 'week' | 'month' | 'quarter' | 'year';

/** On the phone: the 44 capsule across the screen for the view, 36 for the period. */
export default function SegmentedControlPhone() {
  const [view, setView] = useState<View>('list');
  const [period, setPeriod] = useState<Period>('month');
  return (
    <div className="flex w-full max-w-[402px] flex-col gap-4 rounded-xl bg-background p-4 shadow-[inset_0_0_0_1px_var(--color-hairline)]">
      <SegmentedControl<View>
        aria-label="Вид сделок"
        size="lg"
        className="w-full"
        value={view}
        onValueChange={setView}
        options={[
          { value: 'list', label: <><List aria-hidden /> Список</> },
          { value: 'board', label: <><Columns3 aria-hidden /> Доска</> },
        ]}
      />
      <SegmentedControl<Period>
        aria-label="Период"
        size="md"
        className="self-start"
        value={period}
        onValueChange={setPeriod}
        options={[
          { value: 'week', label: 'Неделя' },
          { value: 'month', label: 'Месяц' },
          { value: 'quarter', label: 'Квартал' },
          { value: 'year', label: 'Год' },
        ]}
      />
    </div>
  );
}
