import { CopyButton } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { value: 'norda.app/i/4F7K-29QX', 'aria-label': 'Копировать ссылку' },
  render: (p) => (
    <CopyButton
      value={p.text('value')}
      label={p.text('label') || undefined}
      aria-label={p.text('aria-label')}
      disabled={p.bool('disabled')}
    />
  ),
  code: (p) =>
    p.text('label') ? `<CopyButton${p.attrs(['value', 'label', 'disabled'])} />` : `<CopyButton${p.attrs(['value', 'aria-label', 'disabled'])} />`,
};

export default playground;
