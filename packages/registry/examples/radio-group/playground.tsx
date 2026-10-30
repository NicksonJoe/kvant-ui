import { RadioGroup, RadioItem } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  controls: [{ name: 'checked', type: 'boolean', default: true, description: 'Первый вариант выбран.' }],
  render: (p) => (
    <RadioGroup
      // remount when the starting choice changes: the group is uncontrolled
      key={String(p.bool('checked'))}
      label={p.text('label') || undefined}
      aria-label={p.text('label') ? undefined : 'Способ связи'}
      defaultValue={p.bool('checked') ? 'phone' : undefined}
      orientation={p.pick('orientation', ['vertical', 'horizontal'] as const)}
      size={p.pick('size', ['md', 'lg'] as const)}
      error={p.text('error') || undefined}
      disabled={p.bool('disabled')}
    >
      <RadioItem value="phone">По телефону</RadioItem>
      <RadioItem value="email">По почте</RadioItem>
    </RadioGroup>
  ),
  code: (p) => {
    const name = p.text('label') ? '' : ' aria-label="Способ связи"';
    const value = p.bool('checked') ? ' defaultValue="phone"' : '';
    return `<RadioGroup${name}${p.attrs(['label', 'orientation', 'size', 'error', 'disabled'])}${value}>
  <RadioItem value="phone">По телефону</RadioItem>
  <RadioItem value="email">По почте</RadioItem>
</RadioGroup>`;
  },
};

export default playground;
