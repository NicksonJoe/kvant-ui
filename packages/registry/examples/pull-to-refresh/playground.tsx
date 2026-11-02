import { PullToRefresh } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: () => (
    <PullToRefresh className="h-56 w-full max-w-sm overflow-hidden rounded-xl bg-surface-1 shadow-raised" onRefresh={async () => 'Обновлено только что'}>
      <p className="px-4 py-3 text-body-sm">Потяните список вниз пальцем.</p>
    </PullToRefresh>
  ),
  code: () => `<PullToRefresh onRefresh={async () => { await reload(); return '1 новая сделка'; }}>
  <DealList />
</PullToRefresh>`,
};

export default playground;
