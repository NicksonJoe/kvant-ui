import { Link } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { children: 'Подробнее', href: '#' },
  render: (p) => (
    <span className="text-label-md">
      <Link
        href={p.text('href')}
        variant={p.pick('variant', ['standalone', 'inline'] as const)}
        external={p.bool('external')}
        disabled={p.bool('disabled')}
      >
        {p.text('children')}
      </Link>
    </span>
  ),
  code: (p) => `<Link${p.attrs(['href', 'variant', 'external', 'disabled'])}>${p.text('children')}</Link>`,
};

export default playground;
