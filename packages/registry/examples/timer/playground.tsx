import { TIMER_MODES, TIMER_VARIANTS, Timer } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { value: 8_077_000, 'aria-label': 'До ответа клиенту' },
  render: (p) => (
    <Timer
      value={p.num('value')}
      mode={p.pick('mode', TIMER_MODES)}
      variant={p.pick('variant', TIMER_VARIANTS)}
      tenths={p.bool('tenths')}
      paused={p.bool('paused')}
      aria-label={p.text('aria-label')}
    />
  ),
  code: (p) => `<Timer${p.attrs(['value', 'mode', 'variant', 'tenths', 'paused', 'aria-label'])} />`,
};

export default playground;
