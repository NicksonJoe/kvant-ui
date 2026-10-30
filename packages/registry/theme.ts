import { useEffect, useState } from 'react';

export const ACCENTS = ['graphite', 'cobalt', 'iris', 'aqua', 'jade', 'amber', 'ember', 'orchid'] as const;
export type Accent = (typeof ACCENTS)[number];

export const MODES = ['light', 'dark', 'system'] as const;
export type ModePreference = (typeof MODES)[number];

export const FONTS = ['inter', 'geist'] as const;
export type Font = (typeof FONTS)[number];

export const SHAPES = ['capsule', 'density'] as const;
export type Shape = (typeof SHAPES)[number];

/** `compact` drops every control one step (36 → 32) and table rows 48 → 40. */
export const DENSITIES = ['regular', 'compact'] as const;
export type Density = (typeof DENSITIES)[number];

export interface ThemePreferences {
  accent: Accent;
  mode: ModePreference;
  font: Font;
  shape: Shape;
  density: Density;
  reduceMotion: boolean;
}

/** Same key the pre-paint script in index.html reads. */
export const THEME_STORAGE_KEY = 'kvant-theme';

export const DEFAULT_THEME: ThemePreferences = {
  accent: 'cobalt',
  mode: 'light',
  font: 'inter',
  shape: 'capsule',
  density: 'regular',
  reduceMotion: false,
};

function pick<T extends string>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.find((item) => item === value) ?? fallback;
}

export function readThemePreferences(): ThemePreferences {
  let saved: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}');
    if (parsed !== null && typeof parsed === 'object') saved = parsed as Record<string, unknown>;
  } catch {
    // storage blocked or corrupted: fall back to defaults
  }
  return {
    accent: pick(ACCENTS, saved.accent, DEFAULT_THEME.accent),
    mode: pick(MODES, saved.mode, DEFAULT_THEME.mode),
    font: pick(FONTS, saved.font, DEFAULT_THEME.font),
    shape: pick(SHAPES, saved.shape, DEFAULT_THEME.shape),
    density: pick(DENSITIES, saved.density, DEFAULT_THEME.density),
    reduceMotion: saved.reduceMotion === true,
  };
}

const darkQuery = '(prefers-color-scheme: dark)';

export function applyTheme(theme: ThemePreferences, root: HTMLElement = document.documentElement): void {
  const mode = theme.mode === 'system' ? (window.matchMedia(darkQuery).matches ? 'dark' : 'light') : theme.mode;
  root.setAttribute('data-accent', theme.accent);
  root.setAttribute('data-mode', mode);
  root.setAttribute('data-font', theme.font);
  root.setAttribute('data-shape', theme.shape);
  root.setAttribute('data-density', theme.density);
  root.toggleAttribute('data-reduce-motion', theme.reduceMotion);
}

/** Theme preferences synced to <html> and localStorage; `system` mode follows the OS live. */
export function useTheme(): [ThemePreferences, (patch: Partial<ThemePreferences>) => void] {
  const [theme, setTheme] = useState(readThemePreferences);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    } catch {
      // private mode: theme still applies for this session
    }
    if (theme.mode !== 'system') return;
    const query = window.matchMedia(darkQuery);
    const sync = () => applyTheme(theme);
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, [theme]);

  return [theme, (patch) => setTheme((current) => ({ ...current, ...patch }))];
}
