import { VideoPlayer } from '@/kvant';
import small from './clip-180.mp4';
import clip from './clip.mp4';

// Poster drawn inline: teal dusk, an orange sun and two hills, as on the Paper board.
const poster = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="#1E4A52"/><stop offset="1" stop-color="#0F2B31"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><circle cx="460" cy="104" r="40" fill="#E39A57"/><circle cx="160" cy="492" r="280" fill="#173D44"/><circle cx="570" cy="558" r="310" fill="#0B2328"/></svg>',
)}`;

const captions = `data:text/vtt;charset=utf-8,${encodeURIComponent(
  'WEBVTT\n\n00:00.500 --> 00:04.500\nРаньше мы теряли по две\nпоставки в неделю\n\n00:05.000 --> 00:09.500\nКладовщик сверял накладные вручную\n\n00:10.000 --> 00:14.500\nТеперь приёмка идёт по сканеру\n\n00:15.000 --> 00:19.500\nи остатки сходятся каждый вечер\n',
)}`;

const chapters = [
  { start: 0, title: 'Знакомство' },
  { start: 5, title: 'Склад до перехода' },
  { start: 10, title: 'Внедрение' },
  { start: 15, title: 'Итоги' },
];

export default function VideoFilm() {
  return (
    <VideoPlayer
      src={clip}
      poster={poster}
      title="Как «Полюс» перевёл склад на Норду"
      subtitle="Кейс клиента · интервью с основателем"
      chapters={chapters}
      tracks={[{ src: captions, srclang: 'ru', label: 'Русские' }]}
      qualities={[
        { label: '270p', src: clip },
        { label: '180p', src: small },
      ]}
      className="max-w-[640px]"
    />
  );
}
