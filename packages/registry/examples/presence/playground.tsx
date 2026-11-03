import { Avatar, Presence } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { present: true },
  render: (p) => (
    <div className="min-h-16 w-full max-w-96">
      <Presence present={p.bool('present')} motion={p.pick('motion', ['fade', 'rise', 'collapse'] as const)} index={p.num('index')}>
        <div className="flex h-16 items-center gap-3 rounded-xl bg-surface-1 px-4 shadow-raised">
          <Avatar name="Анна Соколова" size={40} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-label-md font-medium text-fg-1">Анна Соколова</span>
            <span className="text-body-xs text-fg-3">Стрижка и укладка</span>
          </div>
          <time className="text-body-sm text-fg-2">14:30</time>
        </div>
      </Presence>
    </div>
  ),
  code: (p) => `<Presence present={${p.bool('present')}}${p.attrs(['motion', 'index'])}>
  <div>…</div>
</Presence>`,
};

export default playground;
