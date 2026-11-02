import { AnimatedNumber } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { suffix: ' ₽' },
  render: (p) => <AnimatedNumber value={p.num('value')} suffix={p.text('suffix') || undefined} className="text-display-sm font-semibold" />,
  code: (p) => `<AnimatedNumber${p.attrs(['value', 'suffix'])} />`,
};

export default playground;
