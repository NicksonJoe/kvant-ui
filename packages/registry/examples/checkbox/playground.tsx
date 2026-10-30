import { Checkbox } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { children: 'Напомнить за день до встречи' },
  render: (p) => (
    <Checkbox
      // remount when the starting state changes: it is uncontrolled
      key={String(p.bool('defaultChecked'))}
      defaultChecked={p.bool('defaultChecked')}
      indeterminate={p.bool('indeterminate')}
      size={p.pick('size', ['md', 'lg'] as const)}
      invalid={p.bool('invalid')}
      disabled={p.bool('disabled')}
    >
      {p.text('children') || undefined}
    </Checkbox>
  ),
  code: (p) => {
    const attrs = p.attrs(['defaultChecked', 'indeterminate', 'size', 'invalid', 'disabled']);
    return p.text('children') ? `<Checkbox${attrs}>${p.text('children')}</Checkbox>` : `<Checkbox${attrs} aria-label="Выбрать" />`;
  },
};

export default playground;
