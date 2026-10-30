import { NavigationProgress } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { loading: true },
  render: (p) => (
    <div className="relative grid h-28 w-[320px] max-w-full place-items-center overflow-hidden rounded-xl bg-surface-1 text-body-sm text-fg-3 shadow-raised">
      <NavigationProgress loading={p.bool('loading')} className="absolute!" />
      {p.bool('loading') ? 'Страница загружается…' : 'Страница готова'}
    </div>
  ),
  code: (p) => `<NavigationProgress loading={${p.bool('loading')}} />`,
};

export default playground;
