import { Download, Ellipsis } from 'lucide-react';
import { AudioPlayer, IconButton } from '@/kvant';
import episode from './episode.mp3';

// Cover drawn inline: lavender tile, a soft hill and a dot, as on the Paper board.
const cover = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><rect width="56" height="56" fill="#EDE7FB"/><circle cx="14" cy="52" r="28" fill="#8E6BE0" fill-opacity=".18"/><circle cx="37" cy="19" r="7" fill="#8E6BE0"/></svg>',
)}`;

const chapters = [
  { start: 0, title: 'Вступление' },
  { start: 12, title: 'Приёмка' },
  { start: 26, title: 'Возвраты' },
  { start: 38, title: 'Итоги' },
];

export default function AudioPodcast() {
  return (
    <AudioPlayer
      src={episode}
      title="Выпуск 14. Склад без бумаги"
      subtitle="Подкаст Норды · 21 октября"
      cover={<img src={cover} alt="" />}
      chapters={chapters}
      sticky
      actions={
        <>
          <IconButton aria-label="Скачать выпуск" size="sm" icon={<Download />} nativeButton={false} render={<a href={episode} download="vypusk-14.mp3" />} />
          <IconButton aria-label="Ещё" size="sm" icon={<Ellipsis />} />
        </>
      }
      className="w-full max-w-[640px]"
    />
  );
}
