import { Timeline, TimelineDay, TimelineItem } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { time: '14:32', description: '184 000 ₽ · по счёту' },
  render: (p) => (
    <Timeline className="w-full max-w-md">
      <TimelineDay label="Сегодня">
        <TimelineItem time={p.text('time')} latest={p.bool('latest')} description={p.text('description') || undefined}>
          Оплачен счёт <b>№ 24-117</b>
        </TimelineItem>
        <TimelineItem time="10:47">
          <b>Дмитрий Ковалёв</b> оставил комментарий
        </TimelineItem>
      </TimelineDay>
    </Timeline>
  ),
  code: (p) => `<Timeline>
  <TimelineDay label="Сегодня">
    <TimelineItem${p.attrs(['time', 'latest', 'description'])}>
      Оплачен счёт <b>№ 24-117</b>
    </TimelineItem>
  </TimelineDay>
</Timeline>`,
};

export default playground;
