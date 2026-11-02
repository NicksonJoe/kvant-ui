import { RelativeTime } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const now = new Date('2026-11-03T15:00:00');

const playground: Playground = {
  initial: { date: '2026-11-03T14:55:00' },
  render: (p) => <RelativeTime date={p.pick('date', ['2026-11-03T14:59:40', '2026-11-03T14:55:00', '2026-11-02T18:52:00', '2026-10-22T14:05:00'] as const)} now={now} />,
  code: (p) => `<RelativeTime${p.attrs(['date'])} />`,
};

export default playground;
