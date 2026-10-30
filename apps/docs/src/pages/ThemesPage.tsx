import { Check } from 'lucide-react';
import { ACCENTS, Badge, Button, Checkbox, Progress, Switch, type Accent } from '@/kvant';
import { CodeBlock } from '../components/CodeBlock';
import { ForcedState } from '../components/ForcedState';
import { ACCENT_NAMES, resolvedMode, useEnvironment } from '../lib/environment';

const MODES = ['light', 'dark'] as const;
type Mode = (typeof MODES)[number];
const MODE_NAMES: Record<Mode, string> = { light: 'светлая', dark: 'тёмная' };

function ThemeCard({ accent, mode, active, onApply }: { accent: Accent; mode: Mode; active: boolean; onApply: () => void }) {
  return (
    <div className="relative">
      {/* scoped theme: both attributes on the same element */}
      <div
        data-accent={accent}
        data-mode={mode}
        inert
        className="flex flex-col gap-4 rounded-2xl bg-background p-5 font-sans text-fg-1 shadow-[0_0_0_1px_var(--color-hairline)]"
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-label-lg font-semibold">{ACCENT_NAMES[accent]}</span>
          <span className="text-caption text-fg-3">{MODE_NAMES[mode]}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Сохранить</Button>
          <Button size="sm" variant="secondary">
            Отмена
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Switch defaultChecked aria-label="Уведомления" />
          <Checkbox defaultChecked aria-label="Напомнить" />
          <Badge tone="accent">Новый</Badge>
          <Button size="sm" variant="link">
            Ссылка
          </Button>
        </div>
        <Progress value={62} size="sm" aria-label="Прогресс" />
        <div className="flex items-center gap-3">
          <ForcedState state="focus">
            <Button size="xs" variant="secondary">
              Фокус
            </Button>
          </ForcedState>
          <span className="text-caption text-fg-3">кольцо фокуса</span>
        </div>
      </div>
      {active ? (
        <Badge tone="accent" variant="solid" icon={<Check />} className="pointer-events-none absolute top-4 right-4">
          Сейчас
        </Badge>
      ) : null}
      <button
        type="button"
        aria-pressed={active}
        aria-label={`Применить тему «${ACCENT_NAMES[accent]}», ${MODE_NAMES[mode]}`}
        onClick={onApply}
        className="absolute inset-0 rounded-2xl transition-shadow duration-(--duration-quick) ease-hover hover:shadow-[0_0_0_1px_var(--color-border)] aria-pressed:shadow-[0_0_0_2px_var(--color-accent)]"
      />
    </div>
  );
}

export function ThemesPage() {
  const [theme, setTheme] = useEnvironment();
  const mode = resolvedMode(theme);

  return (
    <main id="content" className="flex flex-col gap-10 px-4 pt-8 pb-16 sm:px-8 lg:px-12 lg:pt-10">
      <header className="flex flex-col gap-4">
        <h1 className="text-display-sm font-semibold text-fg-1">Темы</h1>
        <p className="max-w-[72ch] text-body-lg text-fg-2">
          Восемь тем в светлом и тёмном режиме. Тема меняет акцент и лёгкий оттенок нейтральных цветов; контраст текста на кнопке — не
          ниже 4,5:1 в каждой. Нажмите на карточку, чтобы применить тему ко всему сайту.
        </p>
        <p className="text-body-sm text-fg-3">
          Сейчас: «{ACCENT_NAMES[theme.accent]}», {MODE_NAMES[mode]}
          {theme.mode === 'system' ? ' (как в системе)' : ''}.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ACCENTS.flatMap((accent) =>
          MODES.map((cardMode) => (
            <ThemeCard
              key={`${accent}-${cardMode}`}
              accent={accent}
              mode={cardMode}
              active={theme.accent === accent && mode === cardMode}
              onApply={() => setTheme({ accent, mode: cardMode })}
            />
          )),
        )}
      </div>
      <section aria-labelledby="themes-code" className="flex flex-col gap-4">
        <h2 id="themes-code" className="text-heading-lg font-semibold text-fg-1">
          В коде
        </h2>
        <CodeBlock
          lang="tsx"
          className="max-w-3xl"
          code={`import { useTheme } from '@/kvant';\n\nconst [theme, setTheme] = useTheme();\nsetTheme({ accent: 'jade', mode: 'dark' }); // data-accent и data-mode на <html>, сохраняется в localStorage`}
        />
      </section>
    </main>
  );
}
