import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Lightbox, ToastProvider, type GalleryItem } from '..';

const photos: GalleryItem[] = [
  { src: '/office.jpg', alt: 'Офис студии', name: 'office.jpg' },
  { src: '/team.jpg', alt: 'Команда на встрече', name: 'team.jpg' },
  { src: '/review.jpg', alt: 'Отзыв клиента', name: 'review.mp4', video: '/review.mp4', duration: 38 },
];

const chrome = () => screen.getByRole('dialog').getAttribute('data-chrome');
const loadStage = () => fireEvent.load(document.querySelector('[data-slot=lightbox-stage] img') as HTMLImageElement);

/* ---------- WAAPI: jsdom has no Element.animate, so the calls are recorded ---------- */

type Keyframes = Record<string, string | number>[];
interface Call {
  element: Element;
  keyframes: Keyframes;
  options: KeyframeAnimationOptions;
}

function recordAnimations(): Call[] {
  const calls: Call[] = [];
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    value(this: HTMLElement, keyframes: Keyframes, options: KeyframeAnimationOptions) {
      calls.push({ element: this, keyframes, options });
      return { finished: Promise.resolve(), cancel() {}, onfinish: null };
    },
  });
  return calls;
}

const rect = (x: number, y: number, width: number, height: number): DOMRect =>
  ({ x, y, width, height, left: x, top: y, right: x + width, bottom: y + height, toJSON: () => ({}) }) as DOMRect;

describe('Lightbox · share', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'share');
    Reflect.deleteProperty(navigator, 'canShare');
  });

  const blobFetch = () => vi.fn<(src: string, init?: RequestInit) => Promise<Response>>(() => Promise.resolve(new Response(new Blob(['jpg'], { type: 'image/jpeg' }))));

  it('reads the shown file ahead and shares it in the same tick as the click', async () => {
    const share = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    const fetch = blobFetch();
    vi.stubGlobal('fetch', fetch);
    render(<Lightbox items={photos} defaultOpen defaultIndex={1} />);
    await screen.findByRole('dialog');
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/team.jpg', expect.objectContaining({ signal: expect.any(AbortSignal) })));
    await act(async () => {});

    // no await between the click and share(): Safari keeps the gesture only that long
    fireEvent.click(screen.getByRole('button', { name: 'Поделиться' }));
    expect(share).toHaveBeenCalledTimes(1);
    const data = share.mock.calls[0] as unknown as [ShareData];
    expect(data[0].title).toBe('team.jpg');
    expect(data[0].files?.[0]?.name).toBe('team.jpg');
  });

  it('shares the link at once while the file is not read yet', async () => {
    const share = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));
    render(<Lightbox items={photos} defaultOpen />);
    await screen.findByRole('dialog');

    fireEvent.click(screen.getByRole('button', { name: 'Поделиться' }));
    expect(share).toHaveBeenCalledWith({ title: 'office.jpg', url: new URL('/office.jpg', location.href).href });
  });

  it('shares the link when files cannot be shared, and reads nothing ahead', async () => {
    const share = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    const fetch = blobFetch();
    vi.stubGlobal('fetch', fetch);
    render(<Lightbox items={photos} defaultOpen />);
    await screen.findByRole('dialog');

    fireEvent.click(screen.getByRole('button', { name: 'Поделиться' }));
    expect(share).toHaveBeenCalledWith({ title: 'office.jpg', url: new URL('/office.jpg', location.href).href });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('aborts the read on paging and on close, and never reads a file twice', async () => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn(() => Promise.resolve()) });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    const signals: AbortSignal[] = [];
    const fetch = vi.fn((src: string, init?: RequestInit) => {
      if (init?.signal) signals.push(init.signal);
      return src === '/office.jpg' ? Promise.resolve(new Response(new Blob(['jpg']))) : new Promise<Response>(() => {});
    });
    vi.stubGlobal('fetch', fetch);
    const { rerender } = render(<Lightbox items={photos} open />);
    const dialog = await screen.findByRole('dialog');
    await act(async () => {});

    fireEvent.keyDown(dialog, { key: 'ArrowRight' });
    expect(fetch).toHaveBeenLastCalledWith('/team.jpg', expect.anything());
    fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
    expect(signals[1]?.aborted).toBe(true);
    // office.jpg is read already
    expect(fetch).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(dialog, { key: 'ArrowRight' });
    rerender(<Lightbox items={photos} open={false} />);
    expect(signals[2]?.aborted).toBe(true);
    rerender(<Lightbox items={photos} open index={0} />);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('without the system sheet copies the link and says so in a toast', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Lightbox items={photos} defaultOpen defaultIndex={2} />
      </ToastProvider>,
    );
    await screen.findByRole('dialog');

    await user.click(screen.getByRole('button', { name: 'Поделиться' }));
    expect(await screen.findByText('Ссылка скопирована')).toBeDefined();
    // a video shares the file, not its poster
    expect(await navigator.clipboard.readText()).toBe(new URL('/review.mp4', location.href).href);
  });

  it('stays quiet when the user closes the share sheet', async () => {
    const user = userEvent.setup();
    const share = vi.fn(() => Promise.reject(new DOMException('cancelled', 'AbortError')));
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    render(
      <ToastProvider>
        <Lightbox items={photos} defaultOpen />
      </ToastProvider>,
    );
    await screen.findByRole('dialog');

    await user.click(screen.getByRole('button', { name: 'Поделиться' }));
    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(screen.queryByText('Ссылка скопирована')).toBeNull();
    expect(screen.queryByText('Не удалось поделиться')).toBeNull();
  });
});

describe('Lightbox · chrome auto-hide', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const open = async () => {
    render(<Lightbox items={photos} defaultOpen actions={<button type="button" data-popup-open="" aria-label="Ещё" hidden />} />);
    await act(async () => {});
  };

  it('hides the bars after 3 s without movement and brings them back on a move, a tap or a key', async () => {
    render(<Lightbox items={photos} defaultOpen />);
    await act(async () => {});
    const dialog = screen.getByRole('dialog');
    expect(chrome()).toBe('visible');

    act(() => vi.advanceTimersByTime(2900));
    expect(chrome()).toBe('visible');
    act(() => vi.advanceTimersByTime(100));
    expect(chrome()).toBe('hidden');
    expect(document.querySelector('[data-slot=lightbox-top-bar]')?.className).toContain('opacity-0');

    fireEvent.pointerMove(dialog);
    expect(chrome()).toBe('visible');
    act(() => vi.advanceTimersByTime(3000));
    expect(chrome()).toBe('hidden');

    fireEvent.keyDown(dialog, { key: 'Shift' });
    expect(chrome()).toBe('visible');
    act(() => vi.advanceTimersByTime(3000));

    // a tap on the empty stage while hidden only shows the bars
    fireEvent.click(document.querySelector('[data-slot=lightbox-stage]') as HTMLElement);
    expect(chrome()).toBe('visible');
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('keeps the bars while the keyboard is on them', async () => {
    render(<Lightbox items={photos} defaultOpen />);
    await act(async () => {});
    const next = screen.getByRole('button', { name: 'Следующее фото' });
    fireEvent.keyDown(next, { key: 'Tab' });
    next.focus();
    act(() => vi.advanceTimersByTime(6000));
    expect(chrome()).toBe('visible');

    // the mouse takes over: the timer runs again
    fireEvent.pointerDown(screen.getByRole('dialog'), { pointerType: 'mouse' });
    act(() => vi.advanceTimersByTime(3000));
    expect(chrome()).toBe('hidden');
  });

  it('keeps the bars while a menu of the bar is open', async () => {
    await open();
    act(() => vi.advanceTimersByTime(6000));
    expect(chrome()).toBe('visible');
  });
});

describe('Lightbox · opening motion', () => {
  let calls: Call[];
  beforeEach(() => {
    calls = recordAnimations();
  });
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'animate');
    document.documentElement.removeAttribute('data-reduce-motion');
    vi.restoreAllMocks();
  });

  const stageRect = () =>
    vi.spyOn(HTMLImageElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLImageElement) {
      return this.closest('[data-slot=lightbox-stage]') ? rect(200, 100, 400, 200) : rect(0, 0, 0, 0);
    });

  it('grows the picture out of its thumbnail and shrinks it back on close', async () => {
    stageRect();
    const tile = document.createElement('button');
    tile.getBoundingClientRect = () => rect(0, 0, 100, 100);
    document.body.append(tile);
    const origin = vi.fn(() => tile);

    const { rerender } = render(<Lightbox items={photos} open={false} origin={origin} />);
    rerender(<Lightbox items={photos} open origin={origin} />);
    await screen.findByRole('dialog');
    await act(async () => {});
    loadStage();

    expect(origin).toHaveBeenCalledWith(0);
    const grow = calls.find((call) => call.element.tagName === 'IMG');
    // cover-fit into the 100 × 100 tile: scale 0.5, centres 350 / 150 apart, the sides clipped by 100
    expect(grow?.keyframes[0]).toMatchObject({ translate: '-350px -150px', scale: '0.5', clipPath: 'inset(0px 100px round 0px)' });
    expect(grow?.keyframes[1]).toMatchObject({ translate: '0px 0px', scale: '1' });
    expect(grow?.options.duration).toBe(500);

    calls.length = 0;
    rerender(<Lightbox items={photos} open={false} origin={origin} />);
    const shrink = calls.find((call) => call.element.tagName === 'IMG');
    expect(shrink?.keyframes.at(-1)).toMatchObject({ translate: '-350px -150px', scale: '0.5' });
    // the window waits for the picture to land
    expect(calls.some((call) => call.element.getAttribute('data-slot') === 'lightbox')).toBe(true);
    tile.remove();
  });

  it('without a thumbnail fades and scales the picture in', async () => {
    stageRect();
    render(<Lightbox items={photos} defaultOpen />);
    await screen.findByRole('dialog');
    await act(async () => {});
    loadStage();
    const grow = calls.find((call) => call.element.tagName === 'IMG');
    expect(grow?.keyframes[0]).toMatchObject({ opacity: 0, scale: '0.96' });
    expect(grow?.keyframes[1]).toMatchObject({ opacity: 1, scale: '1' });
  });

  it('under reduced motion only fades, even from a thumbnail', async () => {
    document.documentElement.setAttribute('data-reduce-motion', '');
    stageRect();
    const tile = document.createElement('button');
    tile.getBoundingClientRect = () => rect(0, 0, 100, 100);
    const { rerender } = render(<Lightbox items={photos} open={false} origin={() => tile} />);
    rerender(<Lightbox items={photos} open origin={() => tile} />);
    await screen.findByRole('dialog');
    await act(async () => {});
    loadStage();
    const grow = calls.find((call) => call.element.tagName === 'IMG');
    expect(grow?.keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]);
  });
});

describe('Lightbox · video', () => {
  it('names the arrows after the item they go to', async () => {
    render(<Lightbox items={photos} defaultOpen defaultIndex={1} />);
    await screen.findByRole('dialog');
    expect(screen.getByRole('button', { name: 'Предыдущее фото' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Следующее видео' })).toBeDefined();
  });

  it('plays a video item in the player, without zoom, and downloads the file', async () => {
    render(<Lightbox items={photos} defaultOpen defaultIndex={2} />);
    const dialog = await screen.findByRole('dialog', { name: 'review.mp4' });

    const player = dialog.querySelector('[data-slot=video-player]');
    expect(player).not.toBeNull();
    expect(player?.querySelector('video')?.getAttribute('poster')).toBe('/review.jpg');
    expect(dialog.querySelector('[data-slot=lightbox-stage] > img')).toBeNull();
    expect((screen.getByRole('button', { name: 'Увеличить' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('link', { name: 'Скачать' }).getAttribute('href')).toBe('/review.mp4');
    expect(screen.getByRole('button', { name: 'Видео 3: Отзыв клиента' })).toBeDefined();

    // arrows inside the player seek, they do not page
    fireEvent.keyDown(player as HTMLElement, { key: 'ArrowLeft' });
    expect(screen.getByText('3 из 3')).toBeDefined();
    fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
    expect(screen.getByText('2 из 3')).toBeDefined();
  });

  it('a swipe that starts on the player does not drag the viewer', async () => {
    const onOpenChange = vi.fn();
    render(<Lightbox items={photos} defaultOpen defaultIndex={2} onOpenChange={onOpenChange} />);
    const dialog = await screen.findByRole('dialog');
    const player = dialog.querySelector('[data-slot=video-player]') as HTMLElement;
    fireEvent.pointerDown(player, { pointerType: 'touch', clientY: 100 });
    fireEvent.pointerMove(player, { pointerType: 'touch', clientY: 900 });
    fireEvent.pointerUp(player, { pointerType: 'touch', clientY: 900 });
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
