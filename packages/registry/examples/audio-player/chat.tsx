import { AudioPlayer } from '@/kvant';
import voice from './voice.mp3';

export default function AudioChat() {
  return (
    <div className="flex w-full max-w-[640px] flex-col gap-3 rounded-xl bg-surface-1 p-5 shadow-raised">
      <AudioPlayer variant="voice" src={voice} unplayed timestamp="14:02" className="self-start" />
      <AudioPlayer variant="voice" side="outgoing" src={voice} timestamp="14:05" className="self-end" />
      <AudioPlayer
        variant="voice"
        src={voice}
        timestamp="14:09"
        transcript="Поставку перенесли на четверг, водитель будет с девяти до двенадцати. Пропуск оформлю сама."
        className="self-start"
      />
      <AudioPlayer variant="voice" src={voice} timestamp="14:11" transcribing className="self-start" />
    </div>
  );
}
