import { Kbd } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { children: '⌘K' },
  render: (p) => <Kbd>{p.text('children')}</Kbd>,
  code: (p) => `<Kbd>${p.text('children')}</Kbd>`,
};

export default playground;
