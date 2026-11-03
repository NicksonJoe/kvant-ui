import { VideoPlayer } from '@/kvant';
import type { Playground } from '@/kvant/meta';
import clip from './clip.mp4';

const poster = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="#1E4A52"/><stop offset="1" stop-color="#0F2B31"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><circle cx="460" cy="104" r="40" fill="#E39A57"/><circle cx="160" cy="492" r="280" fill="#173D44"/><circle cx="570" cy="558" r="310" fill="#0B2328"/></svg>',
)}`;

const playground: Playground = {
  initial: { title: 'Как «Полюс» перевёл склад на Норду', subtitle: 'Кейс клиента · интервью с основателем' },
  render: (p) => (
    <VideoPlayer
      src={clip}
      poster={poster}
      title={p.text('title')}
      subtitle={p.text('subtitle')}
      live={p.bool('live')}
      thumbnails={p.bool('thumbnails')}
      disabled={p.bool('disabled')}
      className="max-w-[640px]"
    />
  ),
  code: (p) => `<VideoPlayer src="/clip.mp4" poster="/poster.jpg"${p.attrs(['title', 'subtitle', 'live', 'thumbnails', 'disabled'])} />`,
};

export default playground;
