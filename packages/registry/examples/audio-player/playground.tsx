import { AudioPlayer, AUDIO_PLAYER_SIDES, AUDIO_PLAYER_VARIANTS } from '@/kvant';
import type { Playground } from '@/kvant/meta';
import episode from './episode.mp3';
import voice from './voice.mp3';

const playground: Playground = {
  initial: { title: 'Выпуск 14. Склад без бумаги', subtitle: 'Подкаст Норды · 21 октября' },
  render: (p) => {
    const variant = p.pick('variant', AUDIO_PLAYER_VARIANTS);
    return (
      <AudioPlayer
        variant={variant}
        src={variant === 'voice' ? voice : episode}
        title={p.text('title')}
        subtitle={p.text('subtitle')}
        side={p.pick('side', AUDIO_PLAYER_SIDES)}
        unplayed={p.bool('unplayed')}
        disabled={p.bool('disabled')}
        chapters={variant === 'track' ? [{ start: 0, title: 'Вступление' }, { start: 12, title: 'Приёмка' }, { start: 26, title: 'Возвраты' }, { start: 38, title: 'Итоги' }] : undefined}
        className={variant === 'voice' ? undefined : 'w-full max-w-[640px]'}
      />
    );
  },
  code: (p) => `<AudioPlayer src="/episode.mp3"${p.attrs(['variant', 'title', 'subtitle', 'side', 'unplayed', 'disabled'])} />`,
};

export default playground;
