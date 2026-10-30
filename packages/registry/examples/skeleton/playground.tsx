import { Skeleton } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const sizes = { text: 'w-64', circle: 'size-12', rect: 'h-32 w-56' } as const;

const playground: Playground = {
  render: (p) => {
    const shape = p.pick('shape', ['text', 'circle', 'rect'] as const);
    return <Skeleton shape={shape} className={sizes[shape]} />;
  },
  code: (p) => `<Skeleton${p.attrs(['shape'])} className="${sizes[p.pick('shape', ['text', 'circle', 'rect'] as const)]}" />`,
};

export default playground;
