import { Plus, SlidersHorizontal } from 'lucide-react';
import { AppBar, AppBarActions, AppBarBack, AppBarButton } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { title: 'Сделки' },
  controls: [{ name: 'back', type: 'boolean', default: true, description: 'Кнопка «назад» слева.' }],
  render: (p) => (
    <div className="w-full max-w-[402px] rounded-2xl bg-background">
      <AppBar
        title={p.text('title')}
        titleSize={p.pick('titleSize', ['inline', 'large'] as const)}
        scrolled={p.bool('scrolled')}
        leading={p.bool('back') ? <AppBarBack href="#home" label="Сводка" /> : undefined}
        trailing={
          <AppBarActions>
            <AppBarButton icon={<SlidersHorizontal />} aria-label="Фильтры" />
            <AppBarButton icon={<Plus />} aria-label="Новая сделка" />
          </AppBarActions>
        }
      />
    </div>
  ),
  code: (p) => `<AppBar${p.attrs(['title', 'titleSize', 'scrolled'])}${p.bool('back') ? '\n  leading={<AppBarBack href="/" label="Сводка" />}' : ''}
  trailing={
    <AppBarActions>
      <AppBarButton icon={<SlidersHorizontal />} aria-label="Фильтры" />
      <AppBarButton icon={<Plus />} aria-label="Новая сделка" />
    </AppBarActions>
  }
/>`,
};

export default playground;
