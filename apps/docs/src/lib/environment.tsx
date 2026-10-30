import { createContext, use, type ReactNode } from 'react';
import { useTheme, type Accent, type ThemePreferences } from '@/kvant';

type Environment = ReturnType<typeof useTheme>;

const EnvironmentContext = createContext<Environment | null>(null);

/** One environment for the whole site: theme, mode, font, shape, density and motion live on <html>. */
export function EnvironmentProvider({ children }: { children: ReactNode }) {
  return <EnvironmentContext value={useTheme()}>{children}</EnvironmentContext>;
}

export function useEnvironment(): Environment {
  const environment = use(EnvironmentContext);
  if (!environment) throw new Error('useEnvironment must be used inside <EnvironmentProvider>');
  return environment;
}

export const ACCENT_NAMES: Record<Accent, string> = {
  graphite: 'Графит',
  cobalt: 'Кобальт',
  iris: 'Ирис',
  aqua: 'Аква',
  jade: 'Нефрит',
  amber: 'Янтарь',
  ember: 'Медь',
  orchid: 'Орхидея',
};

/** `system` resolved to the mode the OS asks for right now. */
export function resolvedMode(theme: ThemePreferences): 'light' | 'dark' {
  if (theme.mode !== 'system') return theme.mode;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
