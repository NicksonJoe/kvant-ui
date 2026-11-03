import { MonthPicker } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <MonthPicker
      aria-label="Отчётный месяц"
      granularity={p.pick('granularity', ['month', 'year'] as const)}
      placeholder={p.text('placeholder') || undefined}
      disabled={p.bool('disabled')}
      invalid={p.bool('invalid')}
      className="w-80 max-w-full"
    />
  ),
  code: (p) => `<MonthPicker aria-label="Отчётный месяц"${p.attrs(['granularity', 'placeholder', 'disabled', 'invalid'])} />`,
};

export default playground;
