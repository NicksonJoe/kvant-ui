import { NumberField } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { defaultValue: 4, min: 1, max: 20 },
  render: (p) => (
    <NumberField
      // remount when the starting value changes: it is uncontrolled
      key={p.text('defaultValue')}
      aria-label="Участников"
      defaultValue={p.text('defaultValue') ? p.num('defaultValue') : undefined}
      min={p.text('min') ? p.num('min') : undefined}
      max={p.text('max') ? p.num('max') : undefined}
      step={p.num('step')}
      invalid={p.bool('invalid')}
      disabled={p.bool('disabled')}
      readOnly={p.bool('readOnly')}
    />
  ),
  code: (p) => `<NumberField${p.attrs(['defaultValue', 'min', 'max', 'step', 'invalid', 'disabled', 'readOnly'])} aria-label="Участников" />`,
};

export default playground;
