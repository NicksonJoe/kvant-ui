import { Progress } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { label: 'Импорт контактов' },
  controls: [{ name: 'indeterminate', type: 'boolean', default: false, description: 'Без значения — бегущий отрезок.' }],
  render: (p) => (
    <Progress
      label={p.text('label') || undefined}
      aria-label={p.text('label') ? undefined : 'Прогресс'}
      value={p.bool('indeterminate') ? null : p.num('value')}
      size={p.pick('size', ['sm', 'md', 'lg'] as const)}
      className="w-80 max-w-full"
    />
  ),
  code: (p) => `<Progress${p.attrs(['label'])} value={${p.bool('indeterminate') ? 'null' : p.num('value')}}${p.attrs(['size'])} />`,
};

export default playground;
