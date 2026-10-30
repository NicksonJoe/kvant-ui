import { Spinner } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => <Spinner size={p.pick('size', [16, 20, 24] as const)} label={p.text('label') || undefined} inherit={p.bool('inherit')} />,
  code: (p) => `<Spinner${p.attrs(['size', 'label', 'inherit'])} />`,
};

export default playground;
