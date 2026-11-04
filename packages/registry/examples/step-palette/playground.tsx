import { StepPalette } from '@/kvant';
import type { Playground } from '@/kvant/meta';
import { STEP_GROUPS } from './data';

const playground: Playground = {
  render: (p) => (
    <div className="h-[560px] w-56 overflow-y-auto rounded-xl bg-surface-1 shadow-raised">
      <StepPalette groups={STEP_GROUPS} shortcut={p.text('shortcut')} onInsert={() => undefined} />
    </div>
  ),
  code: (p) => `<StepPalette groups={groups}${p.attrs(['shortcut'])} onInsert={(step) => insertAfterSelection(step)} />`,
};

export default playground;
