import { Bell, Star } from 'lucide-react';
import { BUTTON_SIZES, ToggleButton } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { children: 'Избранное' },
  render: (p) => {
    const iconOnly = p.bool('iconOnly');
    return (
      <ToggleButton
        // remount when the starting state changes: it is uncontrolled
        key={String(p.bool('defaultPressed'))}
        defaultPressed={p.bool('defaultPressed')}
        size={p.pick('size', BUTTON_SIZES)}
        iconOnly={iconOnly}
        disabled={p.bool('disabled')}
        icon={iconOnly ? <Bell /> : <Star />}
        aria-label={iconOnly ? 'Уведомления по сделке' : undefined}
      >
        {p.text('children')}
      </ToggleButton>
    );
  },
  code: (p) =>
    p.bool('iconOnly')
      ? `<ToggleButton${p.attrs(['defaultPressed', 'size', 'iconOnly', 'disabled'])} icon={<Bell />} aria-label="Уведомления по сделке" />`
      : `<ToggleButton${p.attrs(['defaultPressed', 'size', 'disabled'])} icon={<Star />}>${p.text('children')}</ToggleButton>`,
};

export default playground;
