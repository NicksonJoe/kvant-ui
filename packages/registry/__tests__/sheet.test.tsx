import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Sheet, SheetBody, SheetContent, SheetHeader, sheetReleaseTarget, sheetReleaseVelocity } from '..';

describe('sheetReleaseTarget', () => {
  // Medium and large detents of an 874 px phone screen.
  const heights = [437, 804];

  it('settles a slow drag on the nearest detent', () => {
    expect(sheetReleaseTarget(heights, 337, 0)).toBe(0);
    expect(sheetReleaseTarget(heights, 600, 0.1)).toBe(0);
    expect(sheetReleaseTarget(heights, 700, -0.1)).toBe(1);
    expect(sheetReleaseTarget(heights, 900, 0)).toBe(1);
  });

  it('closes when dragged more than 30 % below the lowest detent', () => {
    expect(sheetReleaseTarget(heights, 437 * 0.71, 0)).toBe(0);
    expect(sheetReleaseTarget(heights, 437 * 0.69, 0)).toBeNull();
  });

  it('follows a flick of 0.4 px/ms to the next detent, or closes below the lowest', () => {
    expect(sheetReleaseTarget(heights, 410, 0.52)).toBeNull();
    expect(sheetReleaseTarget(heights, 760, 0.4)).toBe(0);
    expect(sheetReleaseTarget(heights, 470, -0.45)).toBe(1);
    expect(sheetReleaseTarget(heights, 810, -2)).toBe(1);
  });
});

describe('sheetReleaseVelocity', () => {
  it('measures px/ms over the last 100 ms only', () => {
    expect(sheetReleaseVelocity([{ t: 0, y: 0 }, { t: 50, y: 20 }, { t: 100, y: 52 }], 100)).toBeCloseTo(0.52);
    expect(sheetReleaseVelocity([{ t: 0, y: 0 }, { t: 200, y: 10 }, { t: 250, y: 30 }], 250)).toBeCloseTo(0.4);
  });

  it('is zero when the finger has stopped', () => {
    expect(sheetReleaseVelocity([{ t: 0, y: 0 }, { t: 40, y: 30 }], 300)).toBe(0);
  });
});

describe('Bottom sheet', () => {
  afterEach(() => vi.restoreAllMocks());

  const renderSheet = () =>
    render(
      <Sheet defaultOpen>
        <SheetContent side="bottom">
          <SheetHeader title="Фильтры" />
          <SheetBody>Этап и сумма</SheetBody>
        </SheetContent>
      </Sheet>,
    );

  // jsdom: innerHeight 768 → medium detent 384 px.
  const drag = (sheet: HTMLElement, distances: readonly number[]) => {
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const header = sheet.querySelector('[data-slot="sheet-header"]');
    if (!header) throw new Error('no header');
    fireEvent.pointerDown(header, { clientY: 400, pointerId: 1 });
    for (const distance of distances) {
      now += 500;
      fireEvent.pointerMove(document.body, { clientY: 400 + distance, pointerId: 1 });
    }
    return {
      release: () => {
        now += 500;
        fireEvent.pointerUp(document.body, { clientY: 400 + (distances.at(-1) ?? 0), pointerId: 1 });
      },
    };
  };

  it('opens at the medium detent; the grabber switches the height', async () => {
    const user = userEvent.setup();
    renderSheet();
    const sheet = await screen.findByRole('dialog', { name: 'Фильтры' });
    expect(sheet.getAttribute('data-detent')).toBe('medium');

    await user.click(screen.getByRole('button', { name: 'Развернуть шит' }));
    expect(sheet.getAttribute('data-detent')).toBe('large');
    await user.click(screen.getByRole('button', { name: 'Свернуть шит' }));
    expect(sheet.getAttribute('data-detent')).toBe('medium');
  });

  it('follows the finger 1:1 and settles back after a short slow drag', async () => {
    renderSheet();
    const sheet = await screen.findByRole('dialog', { name: 'Фильтры' });
    const gesture = drag(sheet, [50]);
    expect(sheet.hasAttribute('data-dragging')).toBe(true);
    expect(sheet.style.getPropertyValue('--kv-sheet-drag-offset')).toBe('50px');

    gesture.release();
    expect(sheet.hasAttribute('data-dragging')).toBe(false);
    expect(sheet.style.getPropertyValue('--kv-sheet-drag-offset')).toBe('');
    expect(sheet.getAttribute('data-detent')).toBe('medium');
    expect(screen.getByRole('dialog')).toBe(sheet);
  });

  it('resists past the largest detent', async () => {
    renderSheet();
    const sheet = await screen.findByRole('dialog', { name: 'Фильтры' });
    // 100 px past the large detent (92 % = 706.56 px) moves the sheet by 30 px only.
    drag(sheet, [-(706.56 + 100 - 384)]);
    expect(parseFloat(sheet.style.getPropertyValue('--kv-sheet-drag-height'))).toBeCloseTo(736.56);
  });

  it('keeps the gesture when the caller passes its own ref', async () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Sheet defaultOpen>
        <SheetContent side="bottom" ref={ref} initialFocus={ref}>
          <SheetHeader title="Фильтры" />
          <SheetBody>Этап и сумма</SheetBody>
        </SheetContent>
      </Sheet>,
    );
    const sheet = await screen.findByRole('dialog', { name: 'Фильтры' });
    expect(ref.current).toBe(sheet);
    drag(sheet, [60, 160]).release();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('closes when dragged down past 30 % of the detent', async () => {
    renderSheet();
    const sheet = await screen.findByRole('dialog', { name: 'Фильтры' });
    drag(sheet, [60, 160]).release();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
