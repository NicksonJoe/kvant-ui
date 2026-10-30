import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { SegmentedControl, Switch, cn, type SegmentedOption } from '@/kvant';
import { useEnvironment } from '../lib/environment';
import { usePreview, type Viewport } from '../lib/preview';

export const MODES = ['light', 'dark'] as const;
export type Mode = (typeof MODES)[number];
export const MODE_NAMES: Record<Mode, string> = { light: 'Светлый', dark: 'Тёмный' };

/** The current theme in the given mode for one part of the page (both attributes on one element). */
export function ThemeScope({ mode, className, children }: { mode: Mode; className?: string; children: ReactNode }) {
  const [theme] = useEnvironment();
  return (
    <div data-accent={theme.accent} data-mode={mode} className={cn('text-fg-1', className)}>
      {children}
    </div>
  );
}

/** A fixed viewport width zoomed out to fit; media queries still follow the window, as in the Playground. */
export function ViewportFrame({ width, children }: { width: number; children: ReactNode }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);

  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry?.contentRect.width ?? 0));
    observer.observe(area);
    return () => observer.disconnect();
  }, []);

  const zoom = available > 0 ? Math.min(1, available / width) : 1;
  return (
    <div ref={areaRef} className="flex w-full min-w-0 flex-col items-center gap-2">
      <span className="font-mono text-caption text-fg-3 tabular-nums">
        {`${width} px${zoom < 1 ? ` · ${Math.round(zoom * 100)} %` : ''}`}
      </span>
      <div className="flex min-h-40 items-center justify-center rounded-xl bg-background p-6 shadow-raised" style={{ width, zoom }}>
        {children}
      </div>
    </div>
  );
}

const VIEWPORT_OPTIONS: readonly SegmentedOption<Viewport>[] = [
  { value: 'auto', label: 'Авто' },
  { value: '402', label: '402' },
  { value: '768', label: '768' },
  { value: '1440', label: '1440' },
];

/** Light and dark side by side for every live stage and state matrix. */
export function CompareSwitch() {
  const [settings, setSettings] = usePreview();
  return (
    <Switch checked={settings.compare} onCheckedChange={(compare) => setSettings({ compare })} className="text-label-sm text-fg-2">
      Светлый и тёмный
    </Switch>
  );
}

/** Viewport width and light/dark comparison for every live stage on the page. */
export function PreviewToolbar({ className }: { className?: string }) {
  const [settings, setSettings] = usePreview();
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2', className)}>
      <SegmentedControl aria-label="Ширина экрана, px" value={settings.viewport} onValueChange={(viewport) => setSettings({ viewport })} options={VIEWPORT_OPTIONS} />
      <CompareSwitch />
    </div>
  );
}

/** Live stage on the dot grid: the chosen viewport width, and light and dark side by side when compared. */
export function Stage({ children, className }: { children: ReactNode; className?: string }) {
  const [{ viewport, compare }] = usePreview();
  const content = viewport === 'auto' ? children : <ViewportFrame width={Number(viewport)}>{children}</ViewportFrame>;
  const stage = 'docs-stage flex min-w-0 items-center justify-center overflow-x-auto';
  if (!compare) return <div className={cn(stage, className)}>{content}</div>;
  return (
    <div className="grid min-w-0 flex-1 md:grid-cols-2">
      {MODES.map((mode) => (
        <ThemeScope key={mode} mode={mode} className={cn(stage, 'relative', className)}>
          <span className="absolute top-3 left-4 text-caption text-fg-3">{MODE_NAMES[mode]}</span>
          {content}
        </ThemeScope>
      ))}
    </div>
  );
}
