import { AudioPlaylist } from '@/kvant';
import episode from './episode.mp3';
import voice from './voice.mp3';

const items = [
  { id: '13', src: voice, title: 'Выпуск 13. Касса в смартфоне', duration: 14, played: true },
  { id: '14', src: episode, title: 'Выпуск 14. Склад без бумаги', subtitle: '21 октября', duration: 48 },
  { id: '15', src: voice, title: 'Выпуск 15. Маркетплейсы и остатки', subtitle: '28 октября', duration: 14 },
  { id: '16', src: episode, title: 'Выпуск 16. Как мы считаем себестоимость', subtitle: '4 ноября', duration: 48 },
  { id: '12', src: episode, title: 'Выпуск 12. Снят с публикации', subtitle: 'Недоступен', disabled: true },
];

export default function AudioPlaylistExample() {
  return <AudioPlaylist aria-label="Выпуски подкаста" items={items} className="w-full max-w-[640px]" />;
}
