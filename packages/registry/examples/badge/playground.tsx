import { BADGE_TONES, BADGE_VARIANTS, Badge } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { children: 'Ждёт ответа' },
  render: (p) => (
    <Badge tone={p.pick('tone', BADGE_TONES)} variant={p.pick('variant', BADGE_VARIANTS)}>
      {p.text('children')}
    </Badge>
  ),
  code: (p) => `<Badge${p.attrs(['tone', 'variant'])}>${p.text('children')}</Badge>`,
};

export default playground;
