import { SwipeActions } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: () => (
    <div className="w-full max-w-sm overflow-hidden rounded-xl shadow-raised">
      <SwipeActions
        leading={[{ id: 'done', label: 'Готово', tone: 'success', onSelect: () => {} }]}
        trailing={[{ id: 'task', label: 'Задача', onSelect: () => {} }, { id: 'more', label: 'Ещё', tone: 'neutral', onSelect: () => {} }]}
      >
        <div className="px-4 py-3 text-label-md">Проведите по строке пальцем</div>
      </SwipeActions>
    </div>
  ),
  code: () => `<SwipeActions leading={[{ id: 'done', label: 'Готово', tone: 'success', onSelect }]} trailing={[{ id: 'task', label: 'Задача', onSelect }]}>
  <DealRow />
</SwipeActions>`,
};

export default playground;
