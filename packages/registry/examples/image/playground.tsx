import { Image } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const landscape = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#a9c8f5"/><circle cx="1120" cy="300" r="140" fill="#fbf3dc"/><path d="M0 620 360 360l300 260 260-190 680 300v250H0z" fill="#5f8fd9"/><rect y="760" width="1600" height="140" fill="#2f5fae"/></svg>',
)}`;

const playground: Playground = {
  initial: { alt: 'Горы над морем на закате', caption: 'Съёмка для «Полюса», октябрь' },
  render: (p) => (
    <Image
      src={landscape}
      alt={p.text('alt')}
      ratio={p.pick('ratio', ['1:1', '4:3', '16:9', '21:9'] as const)}
      radius={p.pick('radius', ['sm', 'md', 'lg', 'xl', 'full'] as const)}
      caption={p.text('caption') || undefined}
      className="w-full max-w-md"
    />
  ),
  code: (p) => `<Image src="/photos/poljus.jpg"${p.attrs(['alt', 'ratio', 'radius', 'caption'])} />`,
};

export default playground;
