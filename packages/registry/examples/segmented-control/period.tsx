import { SegmentedControl } from '@/kvant';

export default function SegmentedControlPeriod() {
  return (
    <SegmentedControl
      aria-label="Период"
      defaultValue="week"
      options={[
        { value: 'day', label: 'День' },
        { value: 'week', label: 'Неделя' },
        { value: 'month', label: 'Месяц' },
        { value: 'year', label: 'Год' },
      ]}
    />
  );
}
