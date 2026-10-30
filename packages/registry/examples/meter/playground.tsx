import { Meter } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { label: 'Хранилище', valueLabel: '4,2 из 10 ГБ', status: 'места достаточно' },
  render: (p) => (
    <Meter
      className="w-[320px] max-w-full"
      value={p.pick('value', [42, 72, 93] as const)}
      label={p.text('label') || undefined}
      valueLabel={p.text('valueLabel') || undefined}
      status={p.text('status') || undefined}
    />
  ),
  code: (p) => `<Meter${p.attrs(['label', 'valueLabel'])} value={${p.pick('value', [42, 72, 93] as const)}}${p.attrs(['status'])} />`,
};

export default playground;
