import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioPlayer, AudioPlaylist } from '..';
import {
  bufferedEnd,
  chapterAt,
  cycleRate,
  formatMediaTime,
  formatRate,
  formatRemaining,
  mediaErrorReason,
  seekByKey,
  stepRate,
  waveformPeaks,
} from '../lib/media';

/* ---------- jsdom has no playback: a media element that answers like a browser ---------- */

interface FakeMedia {
  el: HTMLMediaElement;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  load: ReturnType<typeof vi.fn>;
  /** Metadata arrived: duration known, ready to play. */
  meta(duration: number): void;
  /** The browser moved the playhead and fired timeupdate. */
  tick(time: number): void;
  end(): void;
  fail(code: number): void;
  wait(): void;
}

function ranges(list: readonly (readonly [number, number])[]): TimeRanges {
  return {
    length: list.length,
    start: (index: number) => list[index]?.[0] ?? 0,
    end: (index: number) => list[index]?.[1] ?? 0,
  };
}

function fake(el: HTMLMediaElement): FakeMedia {
  let paused = true;
  let time = 0;
  let duration = Number.NaN;
  let ended = false;
  let error: MediaError | null = null;
  let buffered = ranges([]);
  let rate = 1;
  const fire = (type: string) => act(() => void el.dispatchEvent(new Event(type)));
  Object.defineProperties(el, {
    paused: { get: () => paused, configurable: true },
    ended: { get: () => ended, configurable: true },
    duration: { get: () => duration, configurable: true },
    error: { get: () => error, configurable: true },
    buffered: { get: () => buffered, configurable: true },
    readyState: { get: () => (Number.isNaN(duration) ? 0 : 4), configurable: true },
    playbackRate: {
      get: () => rate,
      set: (value: number) => {
        rate = value;
        el.dispatchEvent(new Event('ratechange'));
      },
      configurable: true,
    },
    currentTime: {
      get: () => time,
      set: (value: number) => {
        time = value;
        ended = false;
        el.dispatchEvent(new Event('timeupdate'));
      },
      configurable: true,
    },
  });
  const play = vi.fn(() => {
    paused = false;
    ended = false;
    el.dispatchEvent(new Event('play'));
    el.dispatchEvent(new Event('playing'));
    return Promise.resolve();
  });
  const pause = vi.fn(() => {
    paused = true;
    el.dispatchEvent(new Event('pause'));
  });
  const load = vi.fn(() => {
    error = null;
    el.dispatchEvent(new Event('emptied'));
  });
  Object.assign(el, { play, pause, load });
  return {
    el,
    play,
    pause,
    load,
    meta(value) {
      duration = value;
      buffered = ranges([[0, value / 4]]);
      fire('loadedmetadata');
      fire('durationchange');
      fire('canplay');
    },
    tick(value) {
      time = value;
      fire('timeupdate');
    },
    end() {
      time = duration;
      paused = true;
      ended = true;
      fire('pause');
      fire('ended');
    },
    fail(code) {
      error = { code, message: '', MEDIA_ERR_ABORTED: 1, MEDIA_ERR_NETWORK: 2, MEDIA_ERR_DECODE: 3, MEDIA_ERR_SRC_NOT_SUPPORTED: 4 };
      fire('error');
    },
    wait() {
      fire('waiting');
    },
  };
}

const medias = (root: ParentNode = document) => [...root.querySelectorAll('audio')].map(fake);
function media(root: ParentNode = document): FakeMedia {
  const [first] = medias(root);
  if (!first) throw new Error('no <audio>');
  return first;
}

const rect = (width: number): DOMRect => ({ x: 0, y: 0, left: 0, top: 0, width, height: 24, right: width, bottom: 24, toJSON: () => ({}) });

beforeEach(() => {
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
});

afterEach(() => {
  vi.useRealTimers();
});

const chapters = [
  { start: 0, title: 'Вступление' },
  { start: 600, title: 'Приёмка' },
  { start: 1260, title: 'Возвраты' },
  { start: 2100, title: 'Итоги' },
] as const;

/* ---------- pure helpers ---------- */

describe('media helpers', () => {
  it('formats time as m:ss and h:mm:ss, never NaN', () => {
    expect(formatMediaTime(0)).toBe('0:00');
    expect(formatMediaTime(65.9)).toBe('1:05');
    expect(formatMediaTime(1085)).toBe('18:05');
    expect(formatMediaTime(3725)).toBe('1:02:05');
    expect(formatMediaTime(Number.NaN)).toBe('0:00');
    expect(formatMediaTime(Number.POSITIVE_INFINITY)).toBe('0:00');
    expect(formatMediaTime(-3)).toBe('0:00');
  });

  it('says what is left in whole minutes and hours', () => {
    expect(formatRemaining(1705)).toBe('осталось 28 мин');
    expect(formatRemaining(3900)).toBe('осталось 1 ч 5 мин');
    expect(formatRemaining(7200)).toBe('осталось 2 ч');
    expect(formatRemaining(20)).toBe('осталось меньше минуты');
  });

  it('prints rates the Russian way', () => {
    expect(formatRate(1.25)).toBe('1,25×');
    expect(formatRate(2)).toBe('2×');
  });

  it('finds the end of the buffered range that holds the playhead', () => {
    const buffered = ranges([
      [0, 30],
      [60, 90],
    ]);
    expect(bufferedEnd(buffered, 10)).toBe(30);
    expect(bufferedEnd(buffered, 70)).toBe(90);
    expect(bufferedEnd(buffered, 45)).toBe(45);
    expect(bufferedEnd(ranges([]), 5)).toBe(5);
  });

  it('finds the chapter under a time', () => {
    expect(chapterAt(chapters, 0)).toBe(0);
    expect(chapterAt(chapters, 1300)).toBe(2);
    expect(chapterAt(chapters, 2789)).toBe(3);
    expect(chapterAt([], 10)).toBe(-1);
  });

  it('maps slider keys to a new time: ←/→ 5 s, Shift 15 s, Home/End, PageUp/PageDown by chapter', () => {
    const at = (key: string, time: number, shiftKey = false) => seekByKey({ key, shiftKey }, { time, duration: 2790, chapters });
    expect(at('ArrowRight', 100)).toBe(105);
    expect(at('ArrowUp', 100)).toBe(105);
    expect(at('ArrowLeft', 100)).toBe(95);
    expect(at('ArrowRight', 100, true)).toBe(115);
    expect(at('ArrowLeft', 3)).toBe(0);
    expect(at('ArrowRight', 2788)).toBe(2790);
    expect(at('Home', 900)).toBe(0);
    expect(at('End', 900)).toBe(2790);
    expect(at('PageUp', 900)).toBe(1260);
    expect(at('PageDown', 900)).toBe(600);
    // at the very start of a chapter PageDown goes to the previous one
    expect(at('PageDown', 600.5)).toBe(0);
    expect(at('PageUp', 2500)).toBe(2790);
    expect(at('Enter', 900)).toBeNull();
    // without chapters PageUp/PageDown move by a tenth
    expect(seekByKey({ key: 'PageUp', shiftKey: false }, { time: 100, duration: 1000, chapters: [] })).toBe(200);
  });

  it('cycles and steps the playback rate', () => {
    expect(cycleRate(1, [1, 1.5, 2])).toBe(1.5);
    expect(cycleRate(2, [1, 1.5, 2])).toBe(1);
    expect(cycleRate(1.25, [1, 1.5, 2])).toBe(1.5);
    expect(stepRate(1, [0.75, 1, 1.25, 1.5, 2], 1)).toBe(1.25);
    expect(stepRate(1, [0.75, 1, 1.25, 1.5, 2], -1)).toBe(0.75);
    expect(stepRate(2, [0.75, 1, 1.25, 1.5, 2], 1)).toBe(2);
    expect(stepRate(0.75, [0.75, 1, 1.25, 1.5, 2], -1)).toBe(0.75);
  });

  it('turns samples into normalised bar peaks', () => {
    const samples = new Float32Array(400);
    for (let index = 0; index < 400; index++) samples[index] = index < 100 ? 0.1 : index < 200 ? -0.8 : index < 300 ? 0.4 : 0;
    const peaks = waveformPeaks(samples, 4);
    expect(peaks).toHaveLength(4);
    expect(peaks[1]).toBe(1);
    expect(peaks[0]).toBeCloseTo(0.125, 3);
    expect(peaks[2]).toBeCloseTo(0.5, 3);
    expect(peaks[3]).toBe(0);
    expect(waveformPeaks(new Float32Array(50), 5)).toEqual([0, 0, 0, 0, 0]);
  });

  it('names the reason of a media error', () => {
    expect(mediaErrorReason(2)).toBe('network');
    expect(mediaErrorReason(4)).toBe('format');
    expect(mediaErrorReason(3)).toBe('decode');
    expect(mediaErrorReason(1)).toBe('aborted');
    expect(mediaErrorReason(undefined)).toBe('network');
  });
});

/* ---------- track ---------- */

describe('AudioPlayer track', () => {
  const track = () =>
    render(<AudioPlayer src="/episode.mp3" title="Выпуск 14. Склад без бумаги" subtitle="Подкаст Норды · 21 октября" chapters={chapters} />);

  it('shows the title, the duration before the start and the transport', () => {
    track();
    const audio = media();
    audio.meta(2790);
    expect(screen.getByText('Выпуск 14. Склад без бумаги')).toBeDefined();
    expect(document.querySelector('[data-slot=audio-player]')?.getAttribute('data-variant')).toBe('track');
    expect(document.querySelector('[data-slot=audio-player-time]')?.textContent).toBe('0:00');
    // not started: the duration instead of the remaining time
    expect(document.querySelector('[data-slot=audio-player-remaining]')?.textContent).toBe('46:30');
    expect(screen.getByRole('button', { name: 'Назад на 15 секунд' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Вперёд на 30 секунд' })).toBeDefined();
  });

  it('plays and pauses from the main button; the time and remaining follow the playhead', () => {
    track();
    const audio = media();
    audio.meta(2790);
    fireEvent.click(screen.getByRole('button', { name: 'Слушать' }));
    expect(audio.play).toHaveBeenCalledTimes(1);
    audio.tick(1085);
    expect(document.querySelector('[data-slot=audio-player-time]')?.textContent).toBe('18:05');
    expect(document.querySelector('[data-slot=audio-player-remaining]')?.textContent).toBe('−28:25');
    fireEvent.click(screen.getByRole('button', { name: 'Пауза' }));
    expect(audio.pause).toHaveBeenCalledTimes(1);
  });

  it('skips back 15 s and forward 30 s', () => {
    track();
    const audio = media();
    audio.meta(2790);
    audio.tick(100);
    fireEvent.click(screen.getByRole('button', { name: 'Назад на 15 секунд' }));
    expect(audio.el.currentTime).toBe(85);
    fireEvent.click(screen.getByRole('button', { name: 'Вперёд на 30 секунд' }));
    expect(audio.el.currentTime).toBe(115);
  });

  it('the progress is a slider: value text with the chapter, keys seek', () => {
    track();
    const audio = media();
    audio.meta(2790);
    audio.tick(1385);
    const slider = screen.getByRole('slider', { name: 'Позиция' });
    expect(slider.getAttribute('aria-valuetext')).toBe('23:05 из 46:30, глава Возвраты');
    expect(slider.getAttribute('aria-valuemax')).toBe('2790');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(audio.el.currentTime).toBe(1390);
    fireEvent.keyDown(slider, { key: 'ArrowLeft', shiftKey: true });
    expect(audio.el.currentTime).toBe(1375);
    fireEvent.keyDown(slider, { key: 'PageUp' });
    expect(audio.el.currentTime).toBe(2100);
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(audio.el.currentTime).toBe(0);
  });

  it('draws one segment per chapter, the buffer and the played part', () => {
    track();
    const audio = media();
    audio.meta(2790);
    audio.tick(1385);
    expect(document.querySelectorAll('[data-slot=audio-player-chapter]')).toHaveLength(4);
    const buffer = document.querySelector<HTMLElement>('[data-slot=audio-player-chapter] [data-slot=audio-player-buffer]');
    expect(buffer?.style.width).toBe('100%');
  });

  it('seeks to the pointer: click and drag by mouse or finger', () => {
    track();
    const audio = media();
    audio.meta(2790);
    const slider = screen.getByRole('slider', { name: 'Позиция' });
    slider.getBoundingClientRect = () => rect(600);
    fireEvent.pointerDown(slider, { clientX: 300, pointerId: 1, button: 0 });
    expect(audio.el.currentTime).toBe(1395);
    fireEvent.pointerMove(slider, { clientX: 450, pointerId: 1 });
    expect(audio.el.currentTime).toBe(2092.5);
    fireEvent.pointerUp(slider, { clientX: 450, pointerId: 1 });
    fireEvent.pointerMove(slider, { clientX: 60, pointerId: 1 });
    // hover after release only previews
    expect(audio.el.currentTime).toBe(2092.5);
    expect(document.querySelector('[data-slot=audio-player-hint]')?.textContent).toBe('4:39 · Вступление');
  });

  it('keyboard on the player: Space/K pause, < and > change the speed', () => {
    track();
    const audio = media();
    audio.meta(2790);
    const root = document.querySelector<HTMLElement>('[data-slot=audio-player]');
    if (!root) throw new Error('no root');
    fireEvent.keyDown(root, { key: 'k' });
    expect(audio.play).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(root, { key: ' ' });
    expect(audio.pause).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(root, { key: '>' });
    expect(audio.el.playbackRate).toBe(1.25);
    expect(screen.getByRole('button', { name: 'Скорость воспроизведения' }).textContent).toBe('1,25×');
    fireEvent.keyDown(root, { key: '<' });
    fireEvent.keyDown(root, { key: '<' });
    expect(audio.el.playbackRate).toBe(0.75);
  });

  it('mutes and sets the volume', () => {
    track();
    const audio = media();
    audio.meta(2790);
    fireEvent.click(screen.getByRole('button', { name: 'Выключить звук' }));
    expect(audio.el.muted).toBe(true);
    act(() => void audio.el.dispatchEvent(new Event('volumechange')));
    expect(screen.getByRole('button', { name: 'Включить звук' })).toBeDefined();
    const volume = screen.getByRole('slider', { name: 'Громкость', hidden: true });
    expect(volume.getAttribute('aria-valuenow')).toBe('0');
  });

  it('shows the reason of an error and retries', () => {
    track();
    const audio = media();
    audio.fail(2);
    expect(document.querySelector('[data-slot=audio-player]')?.getAttribute('data-state')).toBe('error');
    expect(screen.getByText('Не удалось загрузить · нет сети')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(audio.load).toHaveBeenCalledTimes(1);
  });

  it('asks the server why: a 404 reads as a missing file, not a format', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(null, { status: 404 }))));
    track();
    const audio = media();
    Object.defineProperty(audio.el, 'currentSrc', { value: 'https://cdn.example/episode.mp3' });
    audio.fail(4);
    expect(await screen.findByText('Не удалось загрузить · файл не найден')).toBeDefined();
    vi.unstubAllGlobals();
  });

  it('says which format failed', () => {
    track();
    media().fail(4);
    expect(screen.getByText('Не удалось загрузить · формат не поддерживается')).toBeDefined();
  });

  it('shows loading only when buffering lasts longer than 300 ms', () => {
    vi.useFakeTimers();
    track();
    const audio = media();
    audio.meta(2790);
    fireEvent.click(screen.getByRole('button', { name: 'Слушать' }));
    audio.wait();
    const root = document.querySelector('[data-slot=audio-player]');
    expect(root?.getAttribute('aria-busy')).toBeNull();
    act(() => void vi.advanceTimersByTime(300));
    expect(root?.getAttribute('aria-busy')).toBe('true');
    expect(root?.getAttribute('data-state')).toBe('loading');
    act(() => void audio.el.dispatchEvent(new Event('playing')));
    expect(root?.getAttribute('aria-busy')).toBeNull();
  });

  it('offers to listen again at the end', () => {
    track();
    const audio = media();
    audio.meta(2790);
    fireEvent.click(screen.getByRole('button', { name: 'Слушать' }));
    audio.end();
    expect(document.querySelector('[data-slot=audio-player]')?.getAttribute('data-state')).toBe('ended');
    fireEvent.click(screen.getByRole('button', { name: 'Слушать снова' }));
    expect(audio.el.currentTime).toBe(0);
    expect(audio.play).toHaveBeenCalledTimes(2);
  });

  it('disabled: nothing to play, the button is off', () => {
    render(<AudioPlayer src="/gone.mp3" title="Выпуск 12" disabled />);
    const button = screen.getByRole('button', { name: 'Слушать' });
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(document.querySelector('[data-slot=audio-player]')?.hasAttribute('data-disabled')).toBe(true);
  });

  it('plays one player at a time on the page', () => {
    render(
      <>
        <AudioPlayer src="/a.mp3" title="Первый" />
        <AudioPlayer src="/b.mp3" title="Второй" />
      </>,
    );
    const [first, second] = medias();
    if (!first || !second) throw new Error('two players');
    first.meta(100);
    second.meta(100);
    const [playFirst, playSecond] = screen.getAllByRole('button', { name: 'Слушать' });
    if (!playFirst || !playSecond) throw new Error('two buttons');
    fireEvent.click(playFirst);
    fireEvent.click(playSecond);
    expect(first.pause).toHaveBeenCalledTimes(1);
    expect(second.pause).not.toHaveBeenCalled();
  });
});

describe('AudioPlayer next to a muted autoplay', () => {
  it('a muted player neither stops nor is stopped by others', () => {
    render(
      <>
        <AudioPlayer src="/a.mp3" title="Первый" />
        <AudioPlayer src="/b.mp3" title="Второй" />
      </>,
    );
    const [first, second] = medias();
    if (!first || !second) throw new Error('two players');
    second.el.muted = true;
    const [playFirst, playSecond] = screen.getAllByRole('button', { name: 'Слушать' });
    if (!playFirst || !playSecond) throw new Error('two buttons');
    fireEvent.click(playFirst);
    fireEvent.click(playSecond);
    expect(first.pause).not.toHaveBeenCalled();
  });
});

/* ---------- compact ---------- */

describe('AudioPlayer compact', () => {
  it('not started: badge and the duration after the subtitle', () => {
    render(<AudioPlayer variant="compact" src="/15.mp3" title="Выпуск 15" subtitle="Маркетплейсы и остатки" badge="Новый" duration={3064} />);
    expect(screen.getByText('Новый')).toBeDefined();
    expect(document.querySelector('[data-slot=audio-player-subtitle]')?.textContent).toBe('Маркетплейсы и остатки · 51:04');
  });

  it('loading says so, error says why', () => {
    vi.useFakeTimers();
    render(<AudioPlayer variant="compact" src="/15.mp3" title="Выпуск 15" subtitle="Маркетплейсы и остатки" />);
    const audio = media();
    fireEvent.click(screen.getByRole('button', { name: 'Слушать' }));
    audio.wait();
    act(() => void vi.advanceTimersByTime(300));
    expect(document.querySelector('[data-slot=audio-player-subtitle]')?.textContent).toBe('Загружаем выпуск…');
    expect(screen.getByRole('button', { name: 'Загрузка' })).toBeDefined();
    audio.fail(2);
    expect(document.querySelector('[data-slot=audio-player-subtitle]')?.textContent).toBe('Не удалось загрузить · нет сети');
  });

  it('a forced error text replaces the reason', () => {
    render(<AudioPlayer variant="compact" src="/15.mp3" title="Выпуск 15" error="Выпуск снят с публикации" />);
    expect(screen.getByText('Выпуск снят с публикации')).toBeDefined();
  });
});

/* ---------- voice ---------- */

describe('AudioPlayer voice', () => {
  const peaks = Array.from({ length: 30 }, (_, index) => ((index * 7) % 10) / 10);

  it('draws the given waveform as the slider; new until played', () => {
    render(<AudioPlayer variant="voice" src="/v.mp3" waveform={peaks} duration={42} unplayed timestamp="14:02" />);
    const slider = screen.getByRole('slider', { name: 'Позиция' });
    expect(slider.querySelectorAll('[data-slot=audio-player-bar]').length).toBeGreaterThanOrEqual(20);
    const root = document.querySelector('[data-slot=audio-player]');
    expect(root?.hasAttribute('data-unplayed')).toBe(true);
    expect(document.querySelector('[data-slot=audio-player-dot]')).not.toBeNull();
    const audio = media();
    audio.meta(42);
    fireEvent.click(screen.getByRole('button', { name: 'Слушать голосовое' }));
    expect(root?.hasAttribute('data-unplayed')).toBe(false);
  });

  it('bars behind the playhead take the played colour', () => {
    render(<AudioPlayer variant="voice" src="/v.mp3" waveform={peaks} duration={42} />);
    const audio = media();
    audio.meta(42);
    audio.tick(21);
    const bars = [...document.querySelectorAll('[data-slot=audio-player-bar]')];
    const played = bars.filter((bar) => bar.hasAttribute('data-played')).length;
    expect(played).toBeGreaterThan(0);
    expect(played).toBeLessThan(bars.length);
    expect(document.querySelector('[data-slot=audio-player-time]')?.textContent).toBe('0:21 / 0:42');
  });

  it('speed cycles 1 → 1,5 → 2 → 1', () => {
    render(<AudioPlayer variant="voice" src="/v.mp3" waveform={peaks} />);
    const audio = media();
    audio.meta(42);
    fireEvent.click(screen.getByRole('button', { name: 'Слушать голосовое' }));
    const speed = screen.getByRole('button', { name: 'Скорость воспроизведения' });
    fireEvent.click(speed);
    expect(audio.el.playbackRate).toBe(1.5);
    expect(speed.textContent).toBe('1,5×');
    fireEvent.click(speed);
    fireEvent.click(speed);
    expect(audio.el.playbackRate).toBe(1);
  });

  it('transcript folds; transcribing shows a status', () => {
    const { rerender } = render(<AudioPlayer variant="voice" src="/v.mp3" waveform={peaks} transcript="Поставку перенесли на четверг." />);
    expect(screen.getByText('Поставку перенесли на четверг.')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Скрыть расшифровку' }));
    expect(screen.queryByText('Поставку перенесли на четверг.')).toBeNull();
    expect(screen.getByRole('button', { name: 'Показать расшифровку' }).getAttribute('aria-expanded')).toBe('false');
    rerender(<AudioPlayer variant="voice" src="/v.mp3" waveform={peaks} transcribing />);
    expect(screen.getByText('Расшифровываем…')).toBeDefined();
  });

  it('the next voice message starts by itself', () => {
    render(
      <>
        <AudioPlayer variant="voice" src="/1.mp3" waveform={peaks} />
        <AudioPlayer variant="voice" src="/2.mp3" waveform={peaks} side="outgoing" />
      </>,
    );
    const [first, second] = medias();
    if (!first || !second) throw new Error('two voices');
    first.meta(10);
    second.meta(10);
    const [button] = screen.getAllByRole('button', { name: 'Слушать голосовое' });
    if (!button) throw new Error('no button');
    fireEvent.click(button);
    first.end();
    expect(second.play).toHaveBeenCalledTimes(1);
  });

  it('outgoing bubble is the accent one', () => {
    render(<AudioPlayer variant="voice" src="/v.mp3" waveform={peaks} side="outgoing" />);
    expect(document.querySelector('[data-slot=audio-player]')?.getAttribute('data-side')).toBe('outgoing');
  });
});

/* ---------- mini ---------- */

describe('AudioPlayer mini', () => {
  it('a glass bar with a 2 px line, expand and close', () => {
    const onExpand = vi.fn();
    const onClose = vi.fn();
    render(<AudioPlayer variant="mini" src="/e.mp3" title="Выпуск 14" onExpand={onExpand} onClose={onClose} />);
    const audio = media();
    audio.meta(2790);
    audio.tick(1085);
    expect(document.querySelector('[data-slot=audio-player-subtitle]')?.textContent).toBe('18:05 · осталось 28 мин');
    fireEvent.click(screen.getByRole('button', { name: 'Развернуть плеер' }));
    expect(onExpand).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть плеер' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(audio.pause).toHaveBeenCalled();
  });

  it('the track card turns into a mini player when it leaves the screen while playing', () => {
    let notify: (entries: IntersectionObserverEntry[]) => void = () => {};
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
          notify = callback;
        }
        observe(): void {}
        disconnect(): void {}
        unobserve(): void {}
      },
    );
    render(<AudioPlayer src="/e.mp3" title="Выпуск 14" sticky />);
    const audio = media();
    audio.meta(2790);
    fireEvent.click(screen.getByRole('button', { name: 'Слушать' }));
    act(() => notify([{ isIntersecting: false } as IntersectionObserverEntry]));
    expect(document.querySelector('[data-variant=mini]')).not.toBeNull();
    act(() => notify([{ isIntersecting: true } as IntersectionObserverEntry]));
    expect(document.querySelector('[data-variant=mini]')).toBeNull();
    vi.unstubAllGlobals();
  });
});

/* ---------- playlist ---------- */

describe('AudioPlaylist', () => {
  const items = [
    { id: '13', src: '/13.mp3', title: 'Выпуск 13. Касса в смартфоне', duration: 2292, played: true },
    { id: '14', src: '/14.mp3', title: 'Выпуск 14. Склад без бумаги', subtitle: '21 октября', duration: 2790 },
    { id: '15', src: '/15.mp3', title: 'Выпуск 15. Маркетплейсы и остатки', subtitle: '28 октября', duration: 3064 },
    { id: '12', src: '/12.mp3', title: 'Выпуск 12', duration: 2000, disabled: true },
  ];

  it('numbers rows, marks the listened one and the unavailable one', () => {
    render(<AudioPlaylist items={items} aria-label="Выпуски" />);
    const rows = screen.getAllByRole('button');
    expect(rows).toHaveLength(4);
    expect(rows[0]?.textContent).toContain('Прослушано');
    expect(rows[1]?.querySelector('[data-slot=audio-playlist-index]')?.textContent).toBe('2');
    expect(rows[1]?.textContent).toContain('46:30');
    expect(rows[3]?.hasAttribute('disabled')).toBe(true);
    expect(rows[3]?.textContent).toContain('—');
  });

  it('a row plays on click or Enter, the current one shows what is left, the next starts at the end', () => {
    render(<AudioPlaylist items={items} aria-label="Выпуски" />);
    const audio = media();
    const row = screen.getByRole('button', { name: /Выпуск 14/ });
    fireEvent.click(row);
    expect(audio.el.getAttribute('src')).toBe('/14.mp3');
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(row.getAttribute('aria-current')).toBe('true');
    audio.meta(2790);
    audio.tick(1085);
    expect(row.textContent).toContain('осталось 28 мин');
    audio.end();
    expect(audio.el.getAttribute('src')).toBe('/15.mp3');
    expect(screen.getByRole('button', { name: /Выпуск 14/ }).textContent).toContain('Прослушано');
  });

  it('clicking the current row pauses it', () => {
    render(<AudioPlaylist items={items} aria-label="Выпуски" />);
    const audio = media();
    const row = screen.getByRole('button', { name: /Выпуск 15/ });
    fireEvent.click(row);
    fireEvent.click(row);
    expect(audio.pause).toHaveBeenCalledTimes(1);
  });
});
