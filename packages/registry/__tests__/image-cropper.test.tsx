import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  clampImagePosition,
  containScale,
  coverScale,
  cropArea,
  fitCropFrame,
  ImageCropper,
  ImageCropperAspect,
  ImageCropperFlip,
  ImageCropperPreview,
  ImageCropperRotate,
  ImageCropperStage,
  ImageCropperZoom,
  imageTransform,
  resizeCropFrame,
  rotateCropCenter,
  rubberBand,
  zoomAround,
  type ImageCrop,
} from '..';

describe('crop geometry', () => {
  it('fits the largest frame of the ratio into the stage minus the inset, centred', () => {
    // the cover dialog of the mockup: stage 760 × 420 minus 56 leaves 648 × 308, the height decides
    const frame = fitCropFrame({ width: 760, height: 420 }, 4 / 3, 56);
    expect(frame.height).toBe(308);
    expect(frame.width).toBeCloseTo(410.667, 2);
    expect(frame.x).toBeCloseTo(174.667, 2);
    expect(frame.y).toBe(56);
  });

  it('a wide ratio is limited by the stage width', () => {
    const frame = fitCropFrame({ width: 400, height: 400 }, 16 / 9, 20);
    expect(frame.width).toBe(360);
    expect(frame.height).toBeCloseTo(202.5);
    expect(frame.x).toBe(20);
    expect(frame.y).toBeCloseTo((400 - 202.5) / 2);
  });

  it('contain fits the whole image into the stage, cover fills the frame', () => {
    expect(containScale({ width: 2400, height: 1800 }, { width: 760, height: 420 })).toBeCloseTo(420 / 1800);
    expect(coverScale({ width: 2400, height: 1800 }, { width: 400, height: 400 })).toBeCloseTo(400 / 1800);
    expect(coverScale({ width: 1800, height: 2400 }, { width: 400, height: 300 })).toBeCloseTo(400 / 1800);
  });

  it('the image never opens emptiness inside the frame', () => {
    const frame = { x: 100, y: 50, width: 200, height: 100 };
    const image = { width: 400, height: 300 };
    expect(clampImagePosition({ x: 150, y: 80 }, image, frame)).toEqual({ x: 100, y: 50 });
    expect(clampImagePosition({ x: -500, y: -500 }, image, frame)).toEqual({ x: -100, y: -150 });
    expect(clampImagePosition({ x: 20, y: -10 }, image, frame)).toEqual({ x: 20, y: -10 });
  });

  it('rubber band lets the image overshoot by a third of the pull', () => {
    expect(rubberBand(50, 0, 100)).toBe(50);
    expect(rubberBand(130, 0, 100)).toBeCloseTo(110);
    expect(rubberBand(-30, 0, 100)).toBeCloseTo(-10);
  });

  it('zoom keeps the point under the cursor in place', () => {
    const next = zoomAround({ x: 0, y: 0 }, 1, 2, { x: 100, y: 50 });
    expect(next).toEqual({ x: -100, y: -50 });
    // the image point under the focus is the same before and after
    expect((100 - 0) / 1).toBeCloseTo((100 - next.x) / 2);
  });

  it('crop area is the frame in natural pixels, rounded and kept inside the image', () => {
    const area = cropArea({ x: 170, y: 56, width: 400, height: 300 }, { x: 100, y: 0 }, 1 / 3, { width: 1680, height: 1260 });
    expect(area).toEqual({ x: 210, y: 168, width: 1200, height: 900 });
    const edge = cropArea({ x: 0, y: 0, width: 100.4, height: 100.4 }, { x: 0.2, y: 0.2 }, 0.1, { width: 1000, height: 1000 });
    expect(edge.x).toBe(0);
    expect(edge.width).toBe(1000);
  });

  describe('resizeCropFrame', () => {
    const frame = { x: 100, y: 100, width: 200, height: 150 };
    const bounds = { x: 0, y: 0, width: 600, height: 400 };

    it('a free corner moves both its edges; the opposite corner stays', () => {
      const { frame: next, limited } = resizeCropFrame(frame, 'se', 30, 20, { aspect: null, bounds, min: 48 });
      expect(next).toEqual({ x: 100, y: 100, width: 230, height: 170 });
      expect(limited).toBe(false);
      expect(resizeCropFrame(frame, 'nw', -10, -20, { aspect: null, bounds, min: 48 }).frame).toEqual({ x: 90, y: 80, width: 210, height: 170 });
    });

    it('a side moves one edge only', () => {
      expect(resizeCropFrame(frame, 'e', 15, 99, { aspect: null, bounds, min: 48 }).frame).toEqual({ x: 100, y: 100, width: 215, height: 150 });
      expect(resizeCropFrame(frame, 'n', 99, 10, { aspect: null, bounds, min: 48 }).frame).toEqual({ x: 100, y: 110, width: 200, height: 140 });
    });

    it('stops at the bounds and at the minimum, which reports limited', () => {
      expect(resizeCropFrame(frame, 'se', 900, 900, { aspect: null, bounds, min: 48 }).frame).toEqual({ x: 100, y: 100, width: 500, height: 300 });
      const small = resizeCropFrame(frame, 'w', 400, 0, { aspect: null, bounds, min: 48 });
      expect(small.frame).toEqual({ x: 252, y: 100, width: 48, height: 150 });
      expect(small.limited).toBe(true);
    });

    it('with a ratio a corner keeps the proportion and sides do nothing', () => {
      const ratio = { x: 100, y: 100, width: 200, height: 150 };
      const next = resizeCropFrame(ratio, 'se', 40, 0, { aspect: 4 / 3, bounds, min: 48 }).frame;
      expect(next.width).toBeCloseTo(240);
      expect(next.height).toBeCloseTo(180);
      expect(next.x).toBe(100);
      const up = resizeCropFrame(ratio, 'nw', -40, 0, { aspect: 4 / 3, bounds, min: 48 }).frame;
      expect(up.x + up.width).toBeCloseTo(300);
      expect(up.y + up.height).toBeCloseTo(250);
      expect(up.width / up.height).toBeCloseTo(4 / 3);
      expect(resizeCropFrame(ratio, 'e', 40, 0, { aspect: 4 / 3, bounds, min: 48 }).frame).toEqual(ratio);
      // the bounds stop the ratio corner in whichever direction runs out first
      const big = resizeCropFrame(ratio, 'se', 999, 999, { aspect: 4 / 3, bounds, min: 48 }).frame;
      expect(big.height).toBeCloseTo(300);
      expect(big.width).toBeCloseTo(400);
    });

    it('the ratio minimum keeps both sides at least min', () => {
      const tiny = resizeCropFrame({ x: 0, y: 0, width: 200, height: 112.5 }, 'se', -999, -999, { aspect: 16 / 9, bounds, min: 48 });
      expect(tiny.frame.height).toBeCloseTo(48);
      expect(tiny.frame.width).toBeCloseTo((48 * 16) / 9);
      expect(tiny.limited).toBe(true);
    });
  });

  it('rotating 90° clockwise moves the crop centre with the picture; a flip mirrors it', () => {
    // a point near the top-left of a 400 × 300 image ends near the top-right of the 300 × 400 one
    expect(rotateCropCenter({ x: 100, y: 50 }, { width: 400, height: 300 }, 90, false)).toEqual({ x: 250, y: 100 });
    expect(rotateCropCenter({ x: 100, y: 50 }, { width: 400, height: 300 }, -90, false)).toEqual({ x: 50, y: 300 });
    expect(rotateCropCenter({ x: 100, y: 50 }, { width: 400, height: 300 }, 0, true)).toEqual({ x: 300, y: 50 });
  });

  it('the CSS transform puts the rotated image box at the position', () => {
    expect(imageTransform({ width: 400, height: 300 }, { x: 10, y: 20 }, 0.5, 0, false)).toBe(
      'translate(-90px, -55px) scale(0.5) rotate(0deg)',
    );
    // rotated 90: the box is 150 × 200, its centre at (85, 120)
    expect(imageTransform({ width: 400, height: 300 }, { x: 10, y: 20 }, 0.5, 90, true)).toBe(
      'translate(-115px, -30px) scale(0.5) scaleX(-1) rotate(90deg)',
    );
  });
});

// jsdom has no layout and loads no images: the stage reports 760 × 420, a picture reports its natural size on «load».
const STAGE = { width: 760, height: 420 };
const NATURAL = { width: 2400, height: 1800 };
class ReportingResizeObserver implements ResizeObserver {
  private readonly callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element): void {
    queueMicrotask(() => this.callback([{ target } as ResizeObserverEntry], this));
  }
  unobserve(): void {}
  disconnect(): void {}
}
const ResizeObserverStub = globalThis.ResizeObserver;
const createObjectURL = URL.createObjectURL;
const revokeObjectURL = URL.revokeObjectURL;
beforeAll(() => {
  globalThis.ResizeObserver = ReportingResizeObserver;
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return this.dataset.slot === 'image-cropper-stage' ? STAGE.width : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.dataset.slot === 'image-cropper-stage' ? STAGE.height : 0;
    },
  });
  Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', { configurable: true, get: () => NATURAL.width });
  Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', { configurable: true, get: () => NATURAL.height });
  URL.createObjectURL = () => 'blob:photo';
  URL.revokeObjectURL = () => {};
});
afterAll(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
  Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
  Reflect.deleteProperty(HTMLImageElement.prototype, 'naturalWidth');
  Reflect.deleteProperty(HTMLImageElement.prototype, 'naturalHeight');
  globalThis.ResizeObserver = ResizeObserverStub;
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
});

const stage = () => document.querySelector('[data-slot=image-cropper-stage]') as HTMLElement;
const picture = () => document.querySelector('[data-slot=image-cropper-image]') as HTMLImageElement;
const frame = () => screen.getByRole('group', { name: /^Рамка/ });
const flush = () => act(async () => {});
const load = async () => {
  await flush();
  fireEvent.load(picture());
  await flush();
};

function Cover({ onCropChange, aspect, busy = false, minResult }: { onCropChange?: (crop: ImageCrop | null) => void; aspect?: number | null; busy?: boolean; minResult?: { width: number; height: number } }) {
  return (
    <ImageCropper src="photo.jpg" defaultAspect={aspect === undefined ? 4 / 3 : aspect} onCropChange={onCropChange} busy={busy} minResult={minResult}>
      <ImageCropperStage />
      <ImageCropperAspect />
      <ImageCropperZoom />
      <ImageCropperRotate />
      <ImageCropperFlip />
    </ImageCropper>
  );
}

describe('ImageCropper', () => {
  it('without a picture the stage is a drop zone with formats and the limit', () => {
    render(
      <ImageCropper>
        <ImageCropperStage />
      </ImageCropper>,
    );
    const zone = screen.getByRole('button', { name: 'Перетащите фото или выберите файл' });
    expect(zone.getAttribute('data-slot')).toBe('image-cropper-dropzone');
    expect(zone.textContent).toContain('JPG, PNG, HEIC · до 20\u00a0МБ');
    expect(stage().getAttribute('data-state')).toBe('empty');
  });

  it('a file over the zone turns it accent and asks to let go', () => {
    render(
      <ImageCropper>
        <ImageCropperStage />
      </ImageCropper>,
    );
    const zone = screen.getByRole('button', { name: 'Перетащите фото или выберите файл' });
    fireEvent.dragEnter(zone, { dataTransfer: { items: [{ kind: 'file', type: 'image/png' }], files: [] } });
    expect(stage().getAttribute('data-state')).toBe('drag');
    expect(zone.textContent).toContain('Отпустите, чтобы открыть');
  });

  it('a file of the wrong type is refused by name and the zone stays', () => {
    render(
      <ImageCropper>
        <ImageCropperStage />
      </ImageCropper>,
    );
    const input = document.querySelector('input[type=file]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['%PDF'], 'Договор.pdf', { type: 'application/pdf' })] } });
    expect(stage().getAttribute('data-state')).toBe('error');
    expect(stage().textContent).toContain('Это PDF, а нужно фото');
    expect(stage().textContent).toContain('Выбрать другой файл');
  });

  it('a file over the size limit is refused with the limit', () => {
    render(
      <ImageCropper maxSize={10}>
        <ImageCropperStage />
      </ImageCropper>,
    );
    const input = document.querySelector('input[type=file]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'.repeat(20)], 'Фото.jpg', { type: 'image/jpeg' })] } });
    expect(stage().textContent).toContain('Фото больше 10\u00a0Б');
  });

  it('a picked photo is opened with a spinner until it decodes', async () => {
    render(
      <ImageCropper>
        <ImageCropperStage />
      </ImageCropper>,
    );
    const input = document.querySelector('input[type=file]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['jpg'], 'Фото.jpg', { type: 'image/jpeg' })] } });
    expect(stage().getAttribute('data-state')).toBe('opening');
    expect(stage().textContent).toContain('Открываем фото…');
    expect(stage().getAttribute('aria-busy')).toBe('true');
    await load();
    expect(stage().getAttribute('data-state')).toBe('ready');
  });

  it('a photo the browser cannot decode is an error', async () => {
    render(
      <ImageCropper src="broken.heic">
        <ImageCropperStage />
      </ImageCropper>,
    );
    await flush();
    fireEvent.error(picture());
    expect(stage().getAttribute('data-state')).toBe('error');
    expect(stage().textContent).toContain('Не удалось открыть фото');
  });

  it('opens with the frame fitted to the ratio and reports the crop in natural pixels', async () => {
    const onCropChange = vi.fn();
    render(<Cover onCropChange={onCropChange} />);
    await load();
    // contain: 2400 × 1800 → 560 × 420 at x 100; the 4:3 frame 410.7 × 308 at (174.7, 56)
    const crop = onCropChange.mock.lastCall?.[0] as ImageCrop;
    expect(crop.src).toBe('photo.jpg');
    expect(crop).toMatchObject({ x: 320, y: 240, width: 1760, height: 1320 });
    expect(crop.rotation).toBe(0);
    expect(crop.flip).toBe(false);
    expect(frame().getAttribute('aria-label')).toBe('Рамка, 1760 × 1320');
    expect(document.querySelector('[data-slot=image-cropper-size]')?.textContent).toBe('1760 × 1320');
  });

  it('arrows on the frame move the crop by 1 px of the stage, Shift by 10, and stop at the edge', async () => {
    const onCropChange = vi.fn();
    render(<Cover onCropChange={onCropChange} />);
    await load();
    const start = onCropChange.mock.lastCall?.[0] as ImageCrop;
    fireEvent.keyDown(frame(), { key: 'ArrowRight' });
    // 1 stage px = 1 / (420 / 1800) natural px
    expect((onCropChange.mock.lastCall?.[0] as ImageCrop).x).toBe(Math.round(start.x + 1800 / 420));
    fireEvent.keyDown(frame(), { key: 'ArrowDown', shiftKey: true });
    expect((onCropChange.mock.lastCall?.[0] as ImageCrop).y).toBe(Math.round(start.y + 18000 / 420));
    for (let i = 0; i < 40; i++) fireEvent.keyDown(frame(), { key: 'ArrowLeft', shiftKey: true });
    expect((onCropChange.mock.lastCall?.[0] as ImageCrop).x).toBe(0);
    expect(frame().getAttribute('data-limit')).toBe('');
  });

  it('handles are focusable with their name and size; with a ratio the sides are disabled', async () => {
    render(<Cover />);
    await load();
    const corner = screen.getByRole('group', { name: 'Правый нижний угол, 1760 × 1320' });
    expect(corner.tabIndex).toBe(0);
    const side = screen.getByRole('group', { name: /^Правая сторона/ });
    expect(side.getAttribute('aria-disabled')).toBe('true');
    expect(side.tabIndex).toBe(-1);
  });

  it('tab order: frame → corners → sides', async () => {
    render(<Cover aspect={null} />);
    await load();
    const order = [...stage().querySelectorAll<HTMLElement>('[tabindex="0"]')].map((node) => node.getAttribute('aria-label')?.split(',')[0]);
    expect(order).toEqual([
      'Рамка',
      'Левый верхний угол',
      'Правый верхний угол',
      'Правый нижний угол',
      'Левый нижний угол',
      'Верхняя сторона',
      'Правая сторона',
      'Нижняя сторона',
      'Левая сторона',
    ]);
  });

  it('arrows on a corner resize the crop and announce the size', async () => {
    const onCropChange = vi.fn();
    render(<Cover onCropChange={onCropChange} aspect={null} />);
    await load();
    const start = onCropChange.mock.lastCall?.[0] as ImageCrop;
    const corner = screen.getByRole('group', { name: /^Правый нижний угол/ });
    fireEvent.keyDown(corner, { key: 'ArrowLeft', shiftKey: true });
    const next = onCropChange.mock.lastCall?.[0] as ImageCrop;
    expect(next.width).toBe(Math.round(start.width - 18000 / 420));
    expect(next.x).toBe(start.x);
    expect(corner.getAttribute('aria-label')).toBe(`Правый нижний угол, ${next.width} × ${next.height}`);
    await act(async () => {
      fireEvent.keyUp(corner, { key: 'ArrowLeft' });
      await new Promise((resolve) => setTimeout(resolve, 150));
    });
    expect(document.querySelector('[data-slot=announce]')?.textContent).toBe(`${next.width} × ${next.height}`);
  });

  it('the ratio control refits the frame in the centre', async () => {
    const onCropChange = vi.fn();
    render(<Cover onCropChange={onCropChange} />);
    await load();
    fireEvent.click(screen.getByRole('radio', { name: '1:1' }));
    const crop = onCropChange.mock.lastCall?.[0] as ImageCrop;
    expect(crop.width).toBe(crop.height);
    expect(screen.getByRole('radio', { name: '1:1' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('group', { name: /^Правая сторона/ }).getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: 'Свободно' }));
    expect(screen.getByRole('group', { name: /^Правая сторона/ }).getAttribute('aria-disabled')).toBeNull();
  });

  it('zoom goes 100–400 % and shrinks the crop; the value is printed', async () => {
    const onCropChange = vi.fn();
    render(<Cover onCropChange={onCropChange} />);
    await load();
    const zoom = screen.getByRole('slider', { name: 'Масштаб', hidden: true });
    expect(zoom.getAttribute('min')).toBe('100');
    expect(zoom.getAttribute('max')).toBe('400');
    expect(zoom.getAttribute('aria-valuenow')).toBe('100');
    const before = onCropChange.mock.lastCall?.[0] as ImageCrop;
    fireEvent.keyDown(zoom, { key: 'PageUp' });
    const after = onCropChange.mock.lastCall?.[0] as ImageCrop;
    expect(zoom.getAttribute('aria-valuenow')).toBe('110');
    expect(document.querySelector('[data-slot=image-cropper-zoom-value]')?.textContent).toBe('110 %');
    expect(after.width).toBe(Math.round(before.width / 1.1));
  });

  it('rotate turns by 90° (R too) and swaps the sides of the picture; flip mirrors (H)', async () => {
    const onCropChange = vi.fn();
    render(<Cover onCropChange={onCropChange} />);
    await load();
    fireEvent.click(screen.getByRole('button', { name: 'Повернуть на 90°' }));
    let crop = onCropChange.mock.lastCall?.[0] as ImageCrop;
    expect(crop.rotation).toBe(270);
    // the turned picture is 1800 wide: the crop fits inside it
    expect(crop.x + crop.width).toBeLessThanOrEqual(1800);
    fireEvent.keyDown(frame(), { key: 'r' });
    crop = onCropChange.mock.lastCall?.[0] as ImageCrop;
    expect(crop.rotation).toBe(180);
    fireEvent.keyDown(frame(), { key: 'h' });
    expect((onCropChange.mock.lastCall?.[0] as ImageCrop).flip).toBe(true);
    expect(screen.getByRole('button', { name: 'Отразить' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('Enter on the frame applies', async () => {
    const onApply = vi.fn();
    render(
      <ImageCropper src="photo.jpg" onApply={onApply}>
        <ImageCropperStage />
      </ImageCropper>,
    );
    await load();
    fireEvent.keyDown(frame(), { key: 'Enter' });
    expect(onApply).toHaveBeenCalledTimes(1);
    expect((onApply.mock.lastCall?.[0] as ImageCrop).src).toBe('photo.jpg');
  });

  it('too few pixels turn the size badge into a warning', async () => {
    render(<Cover minResult={{ width: 2000, height: 1500 }} />);
    await load();
    const badge = document.querySelector('[data-slot=image-cropper-size]') as HTMLElement;
    expect(badge.getAttribute('data-low')).toBe('');
    expect(badge.textContent).toBe('1760 × 1320 — будет мыльно');
  });

  it('busy: the stage waits, frame and handles do not react', async () => {
    const onCropChange = vi.fn();
    render(<Cover onCropChange={onCropChange} busy />);
    await load();
    expect(stage().getAttribute('aria-busy')).toBe('true');
    expect(document.querySelector('[data-slot=image-cropper-busy]')).not.toBeNull();
    const calls = onCropChange.mock.calls.length;
    fireEvent.keyDown(frame(), { key: 'ArrowRight' });
    expect(onCropChange.mock.calls.length).toBe(calls);
    expect(screen.getByRole('slider', { name: 'Масштаб', hidden: true }).hasAttribute('disabled')).toBe(true);
  });

  it('circle: a round mask without handles or grid, and live previews of the crop', async () => {
    render(
      <ImageCropper src="photo.jpg" shape="circle">
        <ImageCropperStage />
        <ImageCropperPreview size={64} />
        <ImageCropperPreview size={24} />
      </ImageCropper>,
    );
    await load();
    expect(stage().getAttribute('data-shape')).toBe('circle');
    expect(screen.queryByRole('group', { name: /угол/ })).toBeNull();
    expect(document.querySelector('[data-slot=image-cropper-grid]')).toBeNull();
    const previews = document.querySelectorAll<HTMLElement>('[data-slot=image-cropper-preview]');
    expect(previews).toHaveLength(2);
    expect(previews[0]?.style.width).toBe('64px');
    expect(previews[0]?.querySelector('img')?.getAttribute('src')).toBe('photo.jpg');
    expect(previews[1]?.textContent).toBe('24');
  });

  it('dragging moves the picture under a still frame; past the edge it springs back on release', async () => {
    const onCropChange = vi.fn();
    render(<Cover onCropChange={onCropChange} />);
    await load();
    const s = stage();
    fireEvent.pointerDown(s, { clientX: 400, clientY: 200, pointerId: 1, pointerType: 'mouse', buttons: 1 });
    fireEvent.pointerMove(s, { clientX: 450, clientY: 200, pointerId: 1, pointerType: 'mouse', buttons: 1 });
    expect(stage().getAttribute('data-dragging')).toBe('');
    // the thirds grid is there only while dragging
    expect(document.querySelector('[data-slot=image-cropper-grid]')).not.toBeNull();
    fireEvent.pointerUp(s, { pointerId: 1, pointerType: 'mouse' });
    expect(document.querySelector('[data-slot=image-cropper-grid]')).toBeNull();
    expect((onCropChange.mock.lastCall?.[0] as ImageCrop).x).toBe(Math.round(320 - (50 * 1800) / 420));
    fireEvent.pointerDown(s, { clientX: 400, clientY: 200, pointerId: 1, pointerType: 'mouse', buttons: 1 });
    fireEvent.pointerMove(s, { clientX: 700, clientY: 200, pointerId: 1, pointerType: 'mouse', buttons: 1 });
    expect(frame().getAttribute('data-limit')).toBe('');
    fireEvent.pointerUp(s, { pointerId: 1, pointerType: 'mouse' });
    expect((onCropChange.mock.lastCall?.[0] as ImageCrop).x).toBe(0);
    expect(stage().getAttribute('data-settling')).toBe('');
  });

  it('the wheel zooms in and out', async () => {
    render(<Cover />);
    await load();
    const zoom = screen.getByRole('slider', { name: 'Масштаб', hidden: true });
    fireEvent.wheel(stage(), { deltaY: -100, clientX: 380, clientY: 210 });
    expect(Number(zoom.getAttribute('aria-valuenow'))).toBeGreaterThan(100);
    fireEvent.wheel(stage(), { deltaY: 1000, clientX: 380, clientY: 210 });
    expect(zoom.getAttribute('aria-valuenow')).toBe('100');
  });

  it('two fingers pinch to zoom', async () => {
    render(<Cover />);
    await load();
    const s = stage();
    fireEvent.pointerDown(s, { clientX: 300, clientY: 210, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerDown(s, { clientX: 460, clientY: 210, pointerId: 2, pointerType: 'touch' });
    fireEvent.pointerMove(s, { clientX: 540, clientY: 210, pointerId: 2, pointerType: 'touch' });
    fireEvent.pointerUp(s, { pointerId: 2, pointerType: 'touch' });
    fireEvent.pointerUp(s, { pointerId: 1, pointerType: 'touch' });
    expect(screen.getByRole('slider', { name: 'Масштаб', hidden: true }).getAttribute('aria-valuenow')).toBe('150');
  });

  it('the touch gesture does not scroll the page: the stage owns touch-action', async () => {
    render(<Cover />);
    await load();
    expect(stage().className).toContain('touch-none');
  });
});
