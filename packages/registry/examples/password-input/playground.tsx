import { PasswordInput } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { defaultValue: 'Sever-2026!' },
  render: (p) => (
    <PasswordInput
      // remount when the starting value changes: it is uncontrolled
      key={p.text('defaultValue')}
      aria-label="Новый пароль"
      defaultValue={p.text('defaultValue')}
      placeholder={p.text('placeholder') || undefined}
      showStrength={p.bool('showStrength')}
      size={p.pick('size', ['sm', 'md', 'lg'] as const)}
      invalid={p.bool('invalid')}
      disabled={p.bool('disabled')}
      className="w-76 max-w-full"
    />
  ),
  code: (p) => `<PasswordInput${p.attrs(['showStrength', 'defaultValue', 'placeholder', 'size', 'invalid', 'disabled'])} />`,
};

export default playground;
