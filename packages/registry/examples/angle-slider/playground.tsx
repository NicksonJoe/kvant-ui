import { AngleSlider } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { defaultValue: 135 },
  render: (p) => (
    <AngleSlider
      key={p.num('defaultValue')}
      variant={p.pick('variant', ['dial', 'compact'] as const)}
      size={p.pick('size', ['md', 'lg'] as const)}
      disabled={p.bool('disabled')}
      defaultValue={p.num('defaultValue')}
      aria-label={p.text('aria-label')}
    />
  ),
  code: (p) => `<AngleSlider${p.attrs(['variant', 'size', 'disabled', 'defaultValue', 'aria-label'])} />`,
};

export default playground;
