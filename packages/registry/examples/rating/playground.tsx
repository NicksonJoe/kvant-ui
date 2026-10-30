import { Rating } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { defaultValue: 4, showLabel: true },
  render: (p) => (
    <Rating
      // remount when the starting score changes: it is uncontrolled
      key={p.num('defaultValue')}
      aria-label="Оценка проекта"
      defaultValue={p.pick('defaultValue', [0, 1, 2, 3, 4, 5] as const)}
      size={p.pick('size', ['sm', 'md', 'lg'] as const)}
      showLabel={p.bool('showLabel')}
      readOnly={p.bool('readOnly')}
      disabled={p.bool('disabled')}
    />
  ),
  code: (p) => `<Rating aria-label="Оценка проекта"${p.attrs(['defaultValue', 'size', 'showLabel', 'readOnly', 'disabled'])} />`,
};

export default playground;
