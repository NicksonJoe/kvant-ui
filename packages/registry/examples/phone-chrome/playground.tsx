import { PhoneHomeIndicator, PhoneStatusBar } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <div className="flex w-full max-w-[402px] flex-col overflow-hidden rounded-xl bg-background shadow-[inset_0_0_0_1px_var(--color-hairline)]">
      <PhoneStatusBar time={p.text('time')} />
      <div className="h-24" />
      <PhoneHomeIndicator />
    </div>
  ),
  code: (p) => `<PhoneStatusBar${p.attrs(['time'])} />
{/* экран */}
<PhoneHomeIndicator />`,
};

export default playground;
