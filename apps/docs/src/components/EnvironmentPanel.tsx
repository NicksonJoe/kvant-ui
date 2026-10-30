import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import type { ReactNode } from 'react';
import { ACCENTS, SegmentedControl, Tooltip, type Density, type Font, type ModePreference, type Shape } from '@/kvant';
import { ACCENT_NAMES, resolvedMode, useEnvironment } from '../lib/environment';

const fill = 'w-full [&>[data-slot=segment]]:flex-1';

function Row({ label, value, children }: { label: string; value?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-label-sm font-medium text-fg-2">{label}</span>
        {value ? <span className="text-caption text-fg-3">{value}</span> : null}
      </div>
      {children}
    </div>
  );
}

/** Theme, mode, font, shape, density and motion for the whole site (stored in localStorage, applied on <html>). */
export function EnvironmentPanel() {
  const [theme, setTheme] = useEnvironment();
  const mode = resolvedMode(theme);

  return (
    <div className="flex flex-col gap-4">
      <Row label="Тема" value={ACCENT_NAMES[theme.accent]}>
        <RadioGroup
          aria-label="Тема"
          value={theme.accent}
          onValueChange={(value) => {
            const accent = ACCENTS.find((item) => item === value);
            if (accent) setTheme({ accent });
          }}
          className="flex flex-wrap gap-1"
        >
          {ACCENTS.map((accent) => (
            <Tooltip key={accent} content={ACCENT_NAMES[accent]}>
              <Radio.Root
                value={accent}
                aria-label={ACCENT_NAMES[accent]}
                className="grid size-7 place-items-center rounded-full transition-shadow duration-(--duration-quick) hover:shadow-[0_0_0_1px_var(--color-border)] data-checked:shadow-[0_0_0_2px_var(--color-fg-1)]"
              >
                {/* scoped tokens: each dot shows its theme's accent in the current mode */}
                <span data-accent={accent} data-mode={mode} className="size-5 rounded-full bg-accent shadow-[inset_0_0_0_1px_oklch(0_0_0/0.08)]" />
              </Radio.Root>
            </Tooltip>
          ))}
        </RadioGroup>
      </Row>
      <Row label="Режим">
        <SegmentedControl<ModePreference>
          aria-label="Режим"
          className={fill}
          value={theme.mode}
          onValueChange={(next) => setTheme({ mode: next })}
          options={[
            { value: 'light', label: 'Светлый' },
            { value: 'dark', label: 'Тёмный' },
            { value: 'system', label: 'Авто' },
          ]}
        />
      </Row>
      <Row label="Шрифт">
        <SegmentedControl<Font>
          aria-label="Шрифт"
          className={fill}
          value={theme.font}
          onValueChange={(next) => setTheme({ font: next })}
          options={[
            { value: 'inter', label: 'Inter' },
            { value: 'geist', label: 'Geist' },
          ]}
        />
      </Row>
      <Row label="Форма">
        <SegmentedControl<Shape>
          aria-label="Форма"
          className={fill}
          value={theme.shape}
          onValueChange={(next) => setTheme({ shape: next })}
          options={[
            { value: 'capsule', label: 'Капсула' },
            { value: 'density', label: 'Скругление' },
          ]}
        />
      </Row>
      <Row label="Плотность">
        <SegmentedControl<Density>
          aria-label="Плотность"
          className={fill}
          value={theme.density}
          onValueChange={(next) => setTheme({ density: next })}
          options={[
            { value: 'regular', label: 'Обычная' },
            { value: 'compact', label: 'Компактная' },
          ]}
        />
      </Row>
      <Row label="Движение">
        <SegmentedControl<'full' | 'reduced'>
          aria-label="Движение"
          className={fill}
          value={theme.reduceMotion ? 'reduced' : 'full'}
          onValueChange={(next) => setTheme({ reduceMotion: next === 'reduced' })}
          options={[
            { value: 'full', label: 'Полное' },
            { value: 'reduced', label: 'Сниженное' },
          ]}
        />
      </Row>
    </div>
  );
}
