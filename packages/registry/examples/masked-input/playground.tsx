import { MaskedInput } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const masks = ['(###) ###-##-##', '#### #### #### ####', '##.##.####'] as const;

const playground: Playground = {
  initial: { prefix: '+7' },
  render: (p) => (
    <MaskedInput
      // remount when the mask or the starting digits change: it is uncontrolled
      key={`${p.text('mask')}-${p.text('defaultValue')}`}
      aria-label="Номер"
      mask={p.pick('mask', masks)}
      prefix={p.text('prefix') || undefined}
      defaultValue={p.text('defaultValue')}
      size={p.pick('size', ['sm', 'md', 'lg'] as const)}
      invalid={p.bool('invalid')}
      disabled={p.bool('disabled')}
      className="w-76 max-w-full"
    />
  ),
  code: (p) => `<MaskedInput mask="${p.pick('mask', masks)}"${p.attrs(['prefix', 'defaultValue', 'size', 'invalid', 'disabled'])} />`,
};

export default playground;
