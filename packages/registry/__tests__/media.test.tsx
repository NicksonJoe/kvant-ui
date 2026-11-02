import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Gallery, Image, Lightbox } from '..';

const photos = [
  { src: '/office.jpg', alt: 'Офис студии', name: 'office.jpg' },
  { src: '/team.jpg', alt: 'Команда на встрече', name: 'team.jpg' },
  { src: '/desk.jpg', alt: 'Рабочее место', name: 'desk.jpg' },
];

describe('Image', () => {
  it('holds the ratio with a shimmer while loading and shows the picture once it loads', () => {
    render(<Image src="/office.jpg" alt="Офис студии" ratio="16:9" caption="Переговорная на втором этаже" />);
    const frame = document.querySelector('[data-slot=image-frame]');
    expect(frame?.getAttribute('data-state')).toBe('loading');
    expect(frame?.className).toContain('aspect-video');
    expect(screen.getByText('Переговорная на втором этаже').tagName).toBe('FIGCAPTION');

    fireEvent.load(screen.getByRole('img', { name: 'Офис студии' }));
    expect(frame?.getAttribute('data-state')).toBe('loaded');
  });

  it('shows the error state and loads again on «Повторить»', async () => {
    const user = userEvent.setup();
    render(<Image src="/broken.jpg" alt="Офис студии" ratio="4:3" />);
    fireEvent.error(screen.getByRole('img', { name: 'Офис студии' }));

    expect(screen.getByText('Не удалось загрузить')).toBeDefined();
    expect(screen.queryByRole('img', { name: 'Офис студии' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(document.querySelector('[data-slot=image-frame]')?.getAttribute('data-state')).toBe('loading');
    expect(screen.getByRole('img', { name: 'Офис студии' })).toBeDefined();
  });
});

describe('Gallery', () => {
  it('shows up to max tiles, folds the rest into «+N» and opens the tapped photo', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const many = Array.from({ length: 8 }, (_, index) => ({ src: `/p${index}.jpg`, alt: `Фото ${index + 1}` }));
    render(<Gallery items={many} max={5} onOpen={onOpen} />);

    expect(screen.getAllByRole('button')).toHaveLength(5);
    expect(screen.getByText('+4')).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Открыть: Фото 2' }));
    expect(onOpen).toHaveBeenLastCalledWith(1);
    await user.click(screen.getByRole('button', { name: 'Ещё 4 фото' }));
    expect(onOpen).toHaveBeenLastCalledWith(4);
  });
});

describe('Lightbox', () => {
  it('pages with arrows, keys and thumbnails and hides the arrow at the edge', async () => {
    const user = userEvent.setup();
    render(<Lightbox items={photos} defaultOpen defaultIndex={1} />);
    const dialog = await screen.findByRole('dialog');

    expect(screen.getByText('2 из 3')).toBeDefined();
    expect(screen.getByRole('dialog', { name: 'team.jpg' })).toBe(dialog);

    await user.click(screen.getByRole('button', { name: 'Следующее фото' }));
    expect(screen.getByText('3 из 3')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Следующее фото' })).toBeNull();

    fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
    expect(screen.getByText('2 из 3')).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Фото 1: Офис студии' }));
    expect(screen.getByText('1 из 3')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Предыдущее фото' })).toBeNull();
  });

  it('zooms in steps and resets the zoom on paging', async () => {
    const user = userEvent.setup();
    render(<Lightbox items={photos} defaultOpen />);
    await screen.findByRole('dialog');

    expect(screen.getByText('100 %')).toBeDefined();
    expect((screen.getByRole('button', { name: 'Уменьшить' }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Увеличить' }));
    expect(screen.getByText('150 %')).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Следующее фото' }));
    expect(screen.getByText('100 %')).toBeDefined();
  });

  it('closes on Escape and on the × button', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Lightbox items={photos} defaultOpen onOpenChange={onOpenChange} />);
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
