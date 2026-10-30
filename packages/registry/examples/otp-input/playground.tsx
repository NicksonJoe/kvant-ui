import { OtpInput } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <OtpInput
      // remount when the shape or the starting code changes: it is uncontrolled
      key={`${p.num('length')}-${p.text('defaultValue')}`}
      aria-label="Код из СМС"
      length={p.num('length')}
      groupSize={p.num('groupSize')}
      validationType={p.pick('validationType', ['numeric', 'alphanumeric', 'alpha'] as const)}
      defaultValue={p.text('defaultValue') || undefined}
      invalid={p.bool('invalid')}
      success={p.bool('success')}
      disabled={p.bool('disabled')}
    />
  ),
  code: (p) =>
    `<OtpInput${p.attrs(['length', 'groupSize', 'validationType', 'defaultValue', 'invalid', 'success', 'disabled'])} onValueComplete={verify} aria-label="Код из СМС" />`,
};

export default playground;
