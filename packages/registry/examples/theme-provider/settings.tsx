import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { ACCENTS, FocusGroup, SegmentedControl, cn, useTheme, type Density, type ModePreference, type Shape } from '@/kvant';

const modes: { value: ModePreference; label: string }[] = [
  { value: 'light', label: 'Светлый' },
  { value: 'dark', label: 'Тёмный' },
  { value: 'system', label: 'Как в системе' },
];
const densities: { value: Density; label: string }[] = [
  { value: 'regular', label: 'Обычная' },
  { value: 'compact', label: 'Плотная' },
];
const shapes: { value: Shape; label: string }[] = [
  { value: 'capsule', label: 'Капсулы' },
  { value: 'density', label: 'Скругление' },
];

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-label-sm font-medium text-fg-2">{label}</span>
      {children}
    </div>
  );
}

// Below ThemeProvider every useTheme shares one state: the header and this card stay in step.
export default function ThemeProviderSettings() {
  const [theme, setTheme] = useTheme();
  const dark = theme.mode === 'dark' || (theme.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="flex w-full max-w-180 flex-col gap-5 rounded-2xl bg-surface-1 p-5 shadow-raised">
      <Row label="Тема">
        <FocusGroup aria-label="Тема" className="flex flex-wrap gap-1.5">
          {ACCENTS.map((accent) => {
            const selected = theme.accent === accent;
            return (
              <button
                key={accent}
                type="button"
                aria-pressed={selected}
                onClick={() => setTheme({ accent })}
                className={cn(
                  'flex h-7 items-center gap-1.5 rounded-full pl-2.5 font-mono text-caption font-medium transition-colors duration-(--duration-micro) ease-hover',
                  selected ? 'bg-accent-soft pr-2.5 text-accent-soft-fg' : 'bg-surface-1 pr-3 text-fg-1 shadow-control hover:bg-control-hover',
                )}
              >
                <span data-accent={accent} data-mode={dark ? 'dark' : 'light'} className="size-2 rounded-full bg-accent" />
                {accent}
                {selected ? <Check aria-hidden className="size-3.5 stroke-2" /> : null}
              </button>
            );
          })}
        </FocusGroup>
      </Row>
      <Row label="Режим">
        <SegmentedControl aria-label="Режим" options={modes} value={theme.mode} onValueChange={(mode) => setTheme({ mode })} className="self-start" />
      </Row>
      <div className="flex flex-wrap gap-5">
        <Row label="Плотность">
          <SegmentedControl aria-label="Плотность" options={densities} value={theme.density} onValueChange={(density) => setTheme({ density })} />
        </Row>
        <Row label="Форма контролов">
          <SegmentedControl aria-label="Форма контролов" options={shapes} value={theme.shape} onValueChange={(shape) => setTheme({ shape })} />
        </Row>
      </div>
    </div>
  );
}
