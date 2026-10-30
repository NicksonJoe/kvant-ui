import { CountBadge } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => <CountBadge count={p.num('count')} max={p.num('max')} />,
  code: (p) => `<CountBadge count={${p.num('count')}}${p.attrs(['max'])} />`,
};

export default playground;
