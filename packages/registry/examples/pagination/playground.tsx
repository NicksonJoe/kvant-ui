import { Pagination } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { page: 5, pageCount: 25 },
  render: (p) => (
    <Pagination
      page={p.num('page')}
      pageCount={p.num('pageCount')}
      onPageChange={() => {}}
      variant={p.pick('variant', ['full', 'compact', 'mobile'] as const)}
      labels={p.bool('labels')}
      className={p.text('variant') === 'mobile' ? 'w-full max-w-sm' : undefined}
    />
  ),
  code: (p) => `<Pagination${p.attrs(['page', 'pageCount', 'variant', 'labels'])} onPageChange={setPage} />`,
};

export default playground;
