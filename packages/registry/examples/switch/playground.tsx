import { Switch } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { children: 'Уведомления о новых сделках' },
  render: (p) => (
    <Switch
      // remount when the starting state changes: it is uncontrolled
      key={String(p.bool('defaultChecked'))}
      defaultChecked={p.bool('defaultChecked')}
      size={p.pick('size', ['md', 'lg'] as const)}
      loading={p.bool('loading')}
      disabled={p.bool('disabled')}
      description={p.text('description') || undefined}
      aria-label={p.text('children') ? undefined : 'Переключатель'}
    >
      {p.text('children') || undefined}
    </Switch>
  ),
  code: (p) => {
    const attrs = p.attrs(['description', 'defaultChecked', 'size', 'loading', 'disabled']);
    return p.text('children') ? `<Switch${attrs}>${p.text('children')}</Switch>` : `<Switch${attrs} aria-label="Переключатель" />`;
  },
};

export default playground;
