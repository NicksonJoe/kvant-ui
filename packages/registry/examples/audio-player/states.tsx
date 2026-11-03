import { AudioPlayer } from '@/kvant';
import episode from './episode.mp3';

const cover = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#EDE7FB"/><circle cx="12" cy="44" r="24" fill="#8E6BE0" fill-opacity=".18"/><circle cx="32" cy="16" r="6" fill="#8E6BE0"/></svg>',
)}`;

export default function AudioStates() {
  return (
    <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
      <AudioPlayer variant="compact" src={episode} title="Выпуск 15" subtitle="Маркетплейсы и остатки" badge="Новый" cover={<img src={cover} alt="" />} />
      <AudioPlayer variant="compact" src="/missing/vypusk-16.mp3" title="Выпуск 16" subtitle="Себестоимость" cover={<img src={cover} alt="" />} />
      <AudioPlayer variant="compact" src={episode} title="Выпуск 12" error="Выпуск снят с публикации" cover={<img src={cover} alt="" />} />
      <AudioPlayer variant="compact" src="" title="Выпуск 11" subtitle="Файла нет" disabled cover={<img src={cover} alt="" />} />
      <AudioPlayer variant="mini" src={episode} title="Выпуск 14. Склад без бумаги" cover={<img src={cover} alt="" />} onExpand={() => {}} onClose={() => {}} className="col-span-full" />
    </div>
  );
}
