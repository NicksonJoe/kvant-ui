import { BackToTop } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { visible: true },
  render: (p) => (
    <BackToTop
      placement="inline"
      variant={p.pick('variant', ['icon', 'label', 'progress'] as const)}
      label={p.text('label')}
      fab={p.bool('fab')}
      visible={p.bool('visible')}
      progress={0.62}
    />
  ),
  code: (p) => `<BackToTop${p.attrs(['variant', 'label', 'fab', 'visible'])} />`,
};

export default playground;
