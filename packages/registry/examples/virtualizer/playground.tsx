import { VirtualList } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <VirtualList
      aria-label="Строки"
      className="h-[320px] w-full max-w-md rounded-xl bg-surface-1 shadow-raised"
      count={p.num('count')}
      rowHeight={p.num('rowHeight')}
      loading={p.bool('loading')}
      empty={<p className="text-body-sm text-fg-3">Строк нет</p>}
      renderRow={(index) => <div className="flex h-full items-center border-b border-separator px-5 text-body-sm text-fg-1">Строка {index + 1}</div>}
    />
  ),
  code: (p) => `<VirtualList aria-label="Строки"${p.attrs(['count', 'rowHeight', 'loading'])} renderRow={(index) => …} />`,
};

export default playground;
