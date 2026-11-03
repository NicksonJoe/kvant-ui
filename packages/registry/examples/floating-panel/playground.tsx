import { FloatingPanel } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { title: 'Заметки к звонку', badge: '2 из 3' },
  render: (p) => (
    <div className="relative h-80 w-110 max-w-full overflow-hidden rounded-xl bg-surface-2 shadow-[inset_0_0_0_1px_var(--color-hairline)]">
      <FloatingPanel
        key={String(p.bool('defaultCollapsed'))}
        strategy="absolute"
        title={p.text('title')}
        badge={p.text('badge') || undefined}
        defaultCollapsed={p.bool('defaultCollapsed')}
        footer={<span className="text-caption text-fg-3 tabular-nums">Сохранено в 14:32</span>}
      >
        <p className="text-body-sm text-fg-2">«Орбита Лаб» · созвон 14:00–14:30. Бюджет согласован, запуск после 15 ноября.</p>
      </FloatingPanel>
    </div>
  ),
  code: (p) => `<FloatingPanel${p.attrs(['title', 'badge', 'defaultCollapsed'])} storageKey="call-notes" footer={…}>
  …
</FloatingPanel>`,
};

export default playground;
