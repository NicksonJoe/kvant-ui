import { useState } from 'react';
import { VideoPlayer } from '@/kvant';
import clip from './clip.mp4';

export default function VideoStates() {
  const [round, setRound] = useState(1);
  return (
    <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
      <VideoPlayer src={clip} autoPlay loop title="Без звука" />
      <VideoPlayer key={round} src={clip} title={`Серия ${round}`} onNext={() => setRound(round + 1)} />
      <VideoPlayer src="/missing/vebinar.mp4" title="Нет файла" />
      <VideoPlayer src={clip} error="Видео недоступно в вашем регионе" />
      <VideoPlayer src={clip} live viewers="1 284 зрителя" autoPlay loop />
      <VideoPlayer src="" title="Видео ещё обрабатывается" disabled />
    </div>
  );
}
