import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_STORAGE_KEY, ThemeProvider, themeScript, useTheme } from '..';

const root = document.documentElement;
const ATTRIBUTES = ['data-accent', 'data-mode', 'data-font', 'data-shape', 'data-density', 'data-reduce-motion', 'data-theme-transition'];

function ModeButton() {
  const [theme, setTheme] = useTheme();
  return (
    <button type="button" onClick={() => setTheme({ mode: theme.mode === 'dark' ? 'light' : 'dark' })}>
      Режим: {theme.mode}
    </button>
  );
}

function ModeLabel() {
  const [theme] = useTheme();
  return <p>Сейчас {theme.mode}</p>;
}

beforeEach(() => {
  localStorage.clear();
  for (const name of ATTRIBUTES) root.removeAttribute(name);
  root.lang = 'ru';
});
afterEach(() => vi.useRealTimers());

describe('ThemeProvider', () => {
  it('gives every useTheme below it one shared state', () => {
    render(
      <ThemeProvider>
        <ModeButton />
        <ModeLabel />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Сейчас dark')).not.toBeNull();
    expect(root.getAttribute('data-mode')).toBe('dark');
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}')).toMatchObject({ mode: 'dark' });
  });

  it('puts the theme on <html> on mount', () => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ accent: 'jade', shape: 'density', density: 'compact' }));
    render(<ThemeProvider>Кабинет</ThemeProvider>);
    expect(root.getAttribute('data-accent')).toBe('jade');
    expect(root.getAttribute('data-shape')).toBe('density');
    expect(root.getAttribute('data-density')).toBe('compact');
  });

  it('sets the interface language on <html lang>, ru by default, and restores the old one on unmount', () => {
    root.lang = 'x-old';
    const { rerender, unmount } = render(<ThemeProvider>Кабинет</ThemeProvider>);
    expect(root.lang).toBe('ru');
    rerender(<ThemeProvider lang="en">Cabinet</ThemeProvider>);
    expect(root.lang).toBe('en');
    unmount();
    expect(root.lang).toBe('x-old');
  });

  it('cross-fades colours only while a switch settles, not on the first paint', () => {
    vi.useFakeTimers();
    render(
      <ThemeProvider>
        <ModeButton />
      </ThemeProvider>,
    );
    expect(root.hasAttribute('data-theme-transition')).toBe(false);
    fireEvent.click(screen.getByRole('button'));
    expect(root.hasAttribute('data-theme-transition')).toBe(true);
    act(() => vi.advanceTimersByTime(300));
    expect(root.hasAttribute('data-theme-transition')).toBe(false);
  });

  it('leaves useTheme without a provider working on its own state', () => {
    render(<ModeButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button').textContent).toBe('Режим: dark');
    expect(root.getAttribute('data-mode')).toBe('dark');
  });
});

describe('themeScript', () => {
  const run = () => new Function(themeScript)();

  it('puts the saved theme on <html> before React starts', () => {
    localStorage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify({ accent: 'ember', mode: 'dark', font: 'geist', shape: 'density', density: 'compact', reduceMotion: true }),
    );
    run();
    expect(root.getAttribute('data-accent')).toBe('ember');
    expect(root.getAttribute('data-mode')).toBe('dark');
    expect(root.getAttribute('data-font')).toBe('geist');
    expect(root.getAttribute('data-shape')).toBe('density');
    expect(root.getAttribute('data-density')).toBe('compact');
    expect(root.hasAttribute('data-reduce-motion')).toBe(true);
  });

  it('resolves system mode with the OS setting', () => {
    const matchMedia = vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode: 'system' }));
    run();
    expect(root.getAttribute('data-mode')).toBe('dark');
    matchMedia.mockRestore();
  });

  it('skips unknown values and survives broken storage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ accent: 'neon', density: 'huge', reduceMotion: 'yes' }));
    run();
    expect(root.hasAttribute('data-accent')).toBe(false);
    expect(root.hasAttribute('data-density')).toBe(false);
    expect(root.hasAttribute('data-reduce-motion')).toBe(false);

    localStorage.setItem(THEME_STORAGE_KEY, '{broken');
    expect(run).not.toThrow();
  });
});
