import { TimeField } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <TimeField
      aria-label="Время встречи"
      defaultValue="10:30"
      step={p.pick('step', [1, 5, 10, 15, 30] as const)}
      placeholder={p.text('placeholder')}
      size={p.pick('size', ['sm', 'md', 'lg'] as const)}
      invalid={p.bool('invalid')}
      disabled={p.bool('disabled')}
      className="w-36 max-w-full"
    />
  ),
  code: (p) => `<TimeField aria-label="Время встречи" defaultValue="10:30"${p.attrs(['step', 'placeholder', 'size', 'invalid', 'disabled'])} />`,
};

export default playground;
