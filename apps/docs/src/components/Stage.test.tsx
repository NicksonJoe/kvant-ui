import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EnvironmentProvider } from '../lib/environment';
import { PreviewProvider } from '../lib/preview';
import { PreviewToolbar, Stage } from './Stage';

function renderStage() {
  return render(
    <EnvironmentProvider>
      <PreviewProvider>
        <PreviewToolbar />
        <Stage>
          <button type="button">Сохранить</button>
        </Stage>
      </PreviewProvider>
    </EnvironmentProvider>,
  );
}

describe('Stage', () => {
  it('shows the specimen once, at the stage width, by default', () => {
    renderStage();
    expect(screen.getAllByRole('button', { name: 'Сохранить' })).toHaveLength(1);
    expect(screen.queryByText(/\d+ px/)).toBeNull();
  });

  it('emulates a viewport width and puts light and dark side by side', () => {
    renderStage();
    fireEvent.click(screen.getByRole('radio', { name: '402' }));
    expect(screen.getByText('402 px')).toBeTruthy();

    fireEvent.click(screen.getByRole('switch', { name: 'Светлый и тёмный' }));
    const copies = screen.getAllByRole('button', { name: 'Сохранить' });
    expect(copies.map((copy) => copy.closest('[data-mode]')?.getAttribute('data-mode'))).toEqual(['light', 'dark']);
  });
});
