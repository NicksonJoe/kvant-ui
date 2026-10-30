import { createContext, use, useState, type ReactNode } from 'react';

export const VIEWPORTS = ['auto', '402', '768', '1440'] as const;
export type Viewport = (typeof VIEWPORTS)[number];

export interface PreviewSettings {
  /** Width the live stages emulate; `auto` takes the stage width. */
  viewport: Viewport;
  /** Light and dark side by side instead of the current mode. */
  compare: boolean;
}

type PreviewState = [PreviewSettings, (patch: Partial<PreviewSettings>) => void];

const PreviewContext = createContext<PreviewState | null>(null);

/** How live stages show components; site-wide, so it survives moving between component pages and /check. */
export function PreviewProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PreviewSettings>({ viewport: 'auto', compare: false });
  return <PreviewContext value={[settings, (patch) => setSettings((current) => ({ ...current, ...patch }))]}>{children}</PreviewContext>;
}

export function usePreview(): PreviewState {
  const state = use(PreviewContext);
  if (!state) throw new Error('usePreview must be used inside <PreviewProvider>');
  return state;
}
