import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getComponent, isReady, type ReadyComponentMeta } from '@/kvant/meta';
import { Anatomy } from './Anatomy';

function ready(id: string): ReadyComponentMeta {
  const meta = getComponent(id);
  if (!meta || !isReady(meta)) throw new Error(`${id} is not ready`);
  return meta;
}

describe('Anatomy', () => {
  it('outlines a part on the specimen while its row is hovered or focused, and pins it on click', () => {
    render(<Anatomy meta={ready('button')} />);
    const label = document.querySelector('[data-slot="button-label"]');
    const row = screen.getByRole('button', { name: /Подпись/ });

    fireEvent.focus(row);
    expect(label?.hasAttribute('data-anatomy-active')).toBe(true);
    fireEvent.blur(row);
    expect(label?.hasAttribute('data-anatomy-active')).toBe(false);

    fireEvent.click(row);
    expect(row.getAttribute('aria-pressed')).toBe('true');
    expect(label?.hasAttribute('data-anatomy-active')).toBe(true);
  });

  it('falls back to the data-slot parts and says which ones the specimen lacks', () => {
    const button = ready('button');
    render(<Anatomy meta={{ ...button, anatomyMap: undefined }} />);
    expect(screen.getByRole('button', { name: /button-label/ }).textContent).not.toMatch(/нет на образце/);
    expect(screen.getByRole('button', { name: /close-button/ }).textContent).toMatch(/нет на образце/);
  });
});
