import { SegmentedControl } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <SegmentedControl
      aria-label="Период"
      size={p.pick('size', ['sm', 'md'] as const)}
      disabled={p.bool('disabled')}
      options={[
        { value: 'day', label: 'День' },
        { value: 'week', label: 'Неделя' },
        { value: 'month', label: 'Месяц' },
      ]}
    />
  ),
  code: (p) => `<SegmentedControl
  aria-label="Период"${p.attrs(['size', 'disabled']).replace(/ (?=\w)/g, '\n  ')}
  options={[
    { value: 'day', label: 'День' },
    { value: 'week', label: 'Неделя' },
    { value: 'month', label: 'Месяц' },
  ]}
/>`,
};

export default playground;
