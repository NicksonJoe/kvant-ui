import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoPlayer } from '..';

/* ---------- jsdom has no playback: a <video> that answers like a browser ---------- */

interface FakeVideo {
  el: HTMLVideoElement;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  load: ReturnType<typeof vi.fn>;
  meta(duration: number): void;
  tick(time: number): void;
  end(): void;
  fail(code: number): void;
  wait(): void;
}

function fake(el: HTMLVideoElement): FakeVideo {
  let paused = true;
  let time = 0;
  let duration = Number.NaN;
  let ended = false;
  let rate = 1;
  let volume = 1;
  let muted = el.muted;
  let error: MediaError | null = null;
  const fire = (type: string) => act(() => void el.dispatchEvent(new Event(type)));
  Object.defineProperties(el, {
    paused: { get: () => paused, configurable: true },
    ended: { get: () => ended, configurable: true },
    duration: { get: () => duration, configurable: true },
    error: { get: () => error, configurable: true },
    buffered: { get: () => ({ length: 1, start: () => 0, end: () => Math.min(duration, time + 30) }), configurable: true },
    seekable: { get: () => ({ length: 1, start: () => 0, end: () => duration }), configurable: true },
    readyState: { get: () => (Number.isNaN(duration) ? 0 : 4), configurable: true },
    playbackRate: {
      get: () => rate,
      set: (value: number) => {
        rate = value;
        el.dispatchEvent(new Event('ratechange'));
      },
      configurable: true,
    },
    volume: {
      get: () => volume,
      set: (value: number) => {
        volume = value;
        el.dispatchEvent(new Event('volumechange'));
      },
      configurable: true,
    },
    muted: {
      get: () => muted,
      set: (value: boolean) => {
        muted = value;
        el.dispatchEvent(new Event('volumechange'));
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

function video(): FakeVideo {
  const el = document.querySelector('video');
  if (!el) throw new Error('no <video>');
  return fake(el);
}

const root = () => {
  const el = document.querySelector<HTMLElement>('[data-slot=video-player]');
  if (!el) throw new Error('no root');
  return el;
};

const rect = (width: number): DOMRect => ({ x: 0, y: 0, left: 0, top: 0, width, height: 24, right: width, bottom: 24, toJSON: () => ({}) });

const chapters = [
  { start: 0, title: 'Знакомство' },
  { start: 300, title: 'Склад до перехода' },
  { start: 480, title: 'Внедрение' },
] as const;

beforeEach(() => {
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** Started and playing at 4:12 of 12:48. */
function playing(props: Partial<Parameters<typeof VideoPlayer>[0]> = {}) {
  render(<VideoPlayer src="/clip.mp4" title="Как «Полюс» перевёл склад на Норду" chapters={chapters} {...props} />);
  const media = video();
  media.meta(768);
  fireEvent.click(screen.getByRole('button', { name: 'Смотреть' }));
  media.tick(252);
  return media;
}

describe('VideoPlayer poster', () => {
  it('before the start: the poster, one big button, the title and the length', () => {
    render(<VideoPlayer src="/clip.mp4" poster="/poster.jpg" title="Как «Полюс» перевёл склад на Норду" subtitle="Кейс клиента" duration={768} />);
    expect(root().getAttribute('data-state')).toBe('idle');
    expect(document.querySelector('video')?.getAttribute('poster')).toBe('/poster.jpg');
    expect(screen.getByText('Как «Полюс» перевёл склад на Норду')).toBeDefined();
    expect(document.querySelector('[data-slot=video-player-duration]')?.textContent).toBe('12:48');
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('the big button starts playback and the chrome takes over', () => {
    const media = playing();
    expect(media.play).toHaveBeenCalledTimes(1);
    expect(root().getAttribute('data-state')).toBe('playing');
    expect(document.querySelector('[data-slot=video-player-time]')?.textContent).toBe('4:12');
    expect(document.querySelector('[data-slot=video-player-total]')?.textContent).toBe('/ 12:48');
    expect(screen.getByRole('button', { name: 'Пауза' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Назад на 10 секунд' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Вперёд на 10 секунд' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Во весь экран' })).toBeDefined();
  });

  it('without a source the start button is off', () => {
    render(<VideoPlayer src="" title="Нет файла" disabled />);
    expect(screen.getByRole('button', { name: 'Смотреть' }).hasAttribute('disabled')).toBe(true);
  });
});

describe('VideoPlayer keys', () => {
  it('Space/K pause, ←/→ 5 s, J/L 10 s', () => {
    const media = playing();
    fireEvent.keyDown(root(), { key: 'k', code: 'KeyK' });
    expect(media.pause).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(root(), { key: ' ', code: 'Space' });
    expect(media.play).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(root(), { key: 'ArrowRight' });
    expect(media.el.currentTime).toBe(257);
    fireEvent.keyDown(root(), { key: 'ArrowLeft' });
    expect(media.el.currentTime).toBe(252);
    fireEvent.keyDown(root(), { key: 'l', code: 'KeyL' });
    expect(media.el.currentTime).toBe(262);
    fireEvent.keyDown(root(), { key: 'j', code: 'KeyJ' });
    expect(media.el.currentTime).toBe(252);
  });

  it('↑/↓ change the volume by 5 % and show it in the centre for 600 ms; M mutes', () => {
    vi.useFakeTimers();
    const media = playing();
    media.el.volume = 0.65;
    fireEvent.keyDown(root(), { key: 'ArrowDown' });
    expect(media.el.volume).toBeCloseTo(0.6, 5);
    expect(document.querySelector('[data-slot=video-player-hud]')?.textContent).toBe('60 %');
    act(() => void vi.advanceTimersByTime(600));
    expect(document.querySelector('[data-slot=video-player-hud]')).toBeNull();
    fireEvent.keyDown(root(), { key: 'm', code: 'KeyM' });
    expect(media.el.muted).toBe(true);
    expect(document.querySelector('[data-slot=video-player-hud]')?.textContent).toBe('Без звука');
  });

  it('F asks for the full screen on the player itself', () => {
    playing();
    const request = vi.fn(() => Promise.resolve());
    root().requestFullscreen = request;
    fireEvent.keyDown(root(), { key: 'f', code: 'KeyF' });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('< and > change the speed, ? lists the keys and Esc closes the list', () => {
    const media = playing();
    fireEvent.keyDown(root(), { key: '>' });
    expect(media.el.playbackRate).toBe(1.25);
    expect(screen.getByRole('button', { name: 'Скорость воспроизведения' }).textContent).toBe('1,25×');
    fireEvent.keyDown(root(), { key: '?' });
    expect(screen.getByRole('dialog', { name: 'Клавиши' })).toBeDefined();
    fireEvent.keyDown(root(), { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Клавиши' })).toBeNull();
  });

  it('C toggles the captions when there are tracks', () => {
    playing({ tracks: [{ src: '/ru.vtt', srclang: 'ru', label: 'Русские' }] });
    const button = screen.getByRole('button', { name: 'Субтитры' });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    fireEvent.keyDown(root(), { key: 'c', code: 'KeyC' });
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('track')?.getAttribute('srclang')).toBe('ru');
  });
});

describe('VideoPlayer progress', () => {
  it('is a slider with the time, the chapter and keys', () => {
    const media = playing();
    const slider = screen.getByRole('slider', { name: 'Позиция' });
    expect(slider.getAttribute('aria-valuetext')).toBe('4:12 из 12:48, глава Знакомство');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(media.el.currentTime).toBe(257);
    // the slider took the key: the player does not seek a second time
    expect(media.el.currentTime).not.toBe(262);
  });

  it('hover previews the time and the chapter; press and drag seek', () => {
    const media = playing();
    const slider = screen.getByRole('slider', { name: 'Позиция' });
    slider.getBoundingClientRect = () => rect(768);
    fireEvent.pointerMove(slider, { clientX: 353, pointerId: 1 });
    expect(document.querySelector('[data-slot=video-player-preview]')?.textContent).toBe('5:53 · Склад до перехода');
    expect(media.el.currentTime).toBe(252);
    fireEvent.pointerDown(slider, { clientX: 384, pointerId: 1, button: 0, pointerType: 'touch' });
    expect(media.el.currentTime).toBe(384);
    fireEvent.pointerMove(slider, { clientX: 500, pointerId: 1, pointerType: 'touch' });
    expect(media.el.currentTime).toBe(500);
    fireEvent.pointerUp(slider, { clientX: 500, pointerId: 1, pointerType: 'touch' });
  });
});

describe('VideoPlayer chrome', () => {
  it('hides after 3 s without movement while playing, comes back on movement', () => {
    vi.useFakeTimers();
    playing();
    expect(root().getAttribute('data-chrome')).toBe('visible');
    act(() => void vi.advanceTimersByTime(3000));
    expect(root().getAttribute('data-chrome')).toBe('hidden');
    expect(document.querySelector('[data-slot=video-player-line]')).not.toBeNull();
    fireEvent.pointerMove(root());
    expect(root().getAttribute('data-chrome')).toBe('visible');
  });

  it('stays on pause and while the keyboard is inside', () => {
    vi.useFakeTimers();
    const media = playing();
    fireEvent.click(screen.getByRole('button', { name: 'Пауза' }));
    expect(media.pause).toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(5000));
    expect(root().getAttribute('data-chrome')).toBe('visible');
    fireEvent.keyDown(root(), { key: 'Tab' });
    const play = screen.getByRole('button', { name: 'Смотреть' });
    act(() => play.focus());
    fireEvent.click(play);
    act(() => void vi.advanceTimersByTime(5000));
    expect(root().getAttribute('data-chrome')).toBe('visible');
  });

  it('shows the spinner only when buffering lasts 300 ms', () => {
    vi.useFakeTimers();
    const media = playing();
    media.wait();
    expect(document.querySelector('[data-slot=video-player-spinner]')).toBeNull();
    act(() => void vi.advanceTimersByTime(300));
    expect(document.querySelector('[data-slot=video-player-spinner]')).not.toBeNull();
    expect(root().getAttribute('aria-busy')).toBe('true');
  });

  it('speed opens from the 1× button as a menu above the bar', () => {
    const media = playing();
    fireEvent.click(screen.getByRole('button', { name: 'Скорость воспроизведения' }));
    expect(screen.getByText('Обычная')).toBeDefined();
    fireEvent.click(screen.getByRole('menuitemradio', { name: '1,5×' }));
    expect(media.el.playbackRate).toBe(1.5);
  });

  it('quality switches the source and keeps the second', () => {
    const media = playing({
      qualities: [
        { label: '720p', src: '/clip-720.mp4' },
        { label: '360p', src: '/clip-360.mp4' },
      ],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Качество' }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: '360p' }));
    expect(media.el.getAttribute('src')).toBe('/clip-360.mp4');
    act(() => void media.el.dispatchEvent(new Event('loadedmetadata')));
    expect(media.el.currentTime).toBe(252);
  });

  it('volume slider and mute button', () => {
    const media = playing();
    fireEvent.click(screen.getByRole('button', { name: 'Выключить звук' }));
    expect(media.el.muted).toBe(true);
    expect(screen.getByRole('slider', { name: 'Громкость', hidden: true }).getAttribute('aria-valuenow')).toBe('0');
  });
});

describe('VideoPlayer states', () => {
  it('network error: the reason and retry', () => {
    render(<VideoPlayer src="/clip.mp4" />);
    const media = video();
    media.fail(2);
    expect(root().getAttribute('data-state')).toBe('error');
    expect(screen.getByText('Видео не загрузилось')).toBeDefined();
    expect(screen.getByText('Проверьте соединение')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(media.load).toHaveBeenCalledTimes(1);
  });

  it('format error: offer the file instead', () => {
    render(<VideoPlayer src="/clip.mkv" />);
    video().fail(4);
    expect(screen.getByText('Браузер не может воспроизвести этот файл')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Скачать' }).getAttribute('href')).toBe('/clip.mkv');
  });

  it('a forced error names its own reason', () => {
    render(<VideoPlayer src="/clip.mp4" error="Видео недоступно в вашем регионе" />);
    expect(screen.getByText('Видео недоступно в вашем регионе')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Повторить' })).toBeNull();
  });

  it('the end: again, and the next one in 5 s unless the viewer acts', () => {
    vi.useFakeTimers();
    const onNext = vi.fn();
    const media = playing({ onNext });
    media.end();
    expect(root().getAttribute('data-state')).toBe('ended');
    expect(screen.getByText('Далее · 5')).toBeDefined();
    act(() => void vi.advanceTimersByTime(2000));
    expect(screen.getByText('Далее · 3')).toBeDefined();
    act(() => void vi.advanceTimersByTime(3000));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('any action cancels the countdown; «Ещё раз» starts over', () => {
    vi.useFakeTimers();
    const onNext = vi.fn();
    const media = playing({ onNext });
    media.end();
    fireEvent.keyDown(root(), { key: 'Shift' });
    act(() => void vi.advanceTimersByTime(6000));
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByText('Далее')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Ещё раз' }));
    expect(media.el.currentTime).toBe(0);
    expect(media.play).toHaveBeenCalledTimes(2);
  });

  it('autoplay starts muted and offers the sound', () => {
    render(<VideoPlayer src="/clip.mp4" autoPlay />);
    const media = video();
    expect(media.el.muted).toBe(true);
    expect(media.el.autoplay).toBe(true);
    media.meta(20);
    act(() => void media.el.dispatchEvent(new Event('play')));
    fireEvent.click(screen.getByText('Включить звук'));
    expect(media.el.muted).toBe(false);
  });

  it('reduced motion: no autoplay', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query, addEventListener: () => {}, removeEventListener: () => {} }));
    render(<VideoPlayer src="/clip.mp4" autoPlay />);
    expect(video().el.autoplay).toBe(false);
  });

  it('picture-in-picture leaves a placeholder with a way back', () => {
    Object.defineProperty(document, 'pictureInPictureEnabled', { value: true, configurable: true });
    const exit = vi.fn(() => Promise.resolve());
    Object.defineProperty(document, 'exitPictureInPicture', { value: exit, configurable: true });
    const media = playing();
    const request = vi.fn(() => Promise.resolve({} as PictureInPictureWindow));
    media.el.requestPictureInPicture = request;
    fireEvent.click(screen.getByRole('button', { name: 'Картинка в картинке' }));
    expect(request).toHaveBeenCalledTimes(1);
    act(() => void media.el.dispatchEvent(new Event('enterpictureinpicture')));
    expect(screen.getByText('Видео играет в отдельном окне')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Вернуть сюда' }));
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('live: the badge, viewers and no length', () => {
    render(<VideoPlayer src="/live.m3u8" live viewers="1 284 зрителя" />);
    expect(screen.getByText('Эфир')).toBeDefined();
    expect(screen.getByText('1 284 зрителя')).toBeDefined();
  });

  it('a phone-width player: big centre buttons and ⋯ for speed', () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        callback: ResizeObserverCallback;
        constructor(callback: ResizeObserverCallback) {
          this.callback = callback;
        }
        observe(target: Element): void {
          this.callback([{ contentRect: { width: 375 }, target } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver);
        }
        unobserve(): void {}
        disconnect(): void {}
      },
    );
    playing();
    expect(root().hasAttribute('data-narrow')).toBe(true);
    expect(screen.getByRole('button', { name: 'Ещё' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Скорость воспроизведения' })).toBeNull();
  });
});
