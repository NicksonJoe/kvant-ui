import { Link } from 'react-router';
import { ACCENTS } from '@/kvant';
import { CodeBlock } from '../../components/CodeBlock';
import { ACCENT_NAMES, resolvedMode, useEnvironment } from '../../lib/environment';
import type { DocPageDef } from './types';
import { Prose, SwatchGrid } from './widgets';

function ThemeDots() {
  const [theme, setTheme] = useEnvironment();
  const mode = resolvedMode(theme);
  return (
    <div className="flex flex-wrap gap-2">
      {ACCENTS.map((accent) => (
        <button
          key={accent}
          type="button"
          aria-pressed={theme.accent === accent}
          onClick={() => setTheme({ accent })}
          className="kv-pressable flex h-9 items-center gap-2 rounded-full bg-control pr-3.5 pl-2 text-label-sm font-medium text-fg-1 shadow-control hover:bg-control-hover aria-pressed:bg-accent-soft aria-pressed:text-accent-soft-fg aria-pressed:shadow-none"
        >
          <span aria-hidden data-accent={accent} data-mode={mode} className="size-5 rounded-full bg-accent" />
          {ACCENT_NAMES[accent]}
        </button>
      ))}
    </div>
  );
}

export const color: DocPageDef = {
  slug: 'color',
  title: 'Цвет и темы',
  lead: 'Цвета называются по роли, а не по оттенку: background, surface, fg, accent. Образцы ниже живые — они меняются вместе с темой и режимом в «Среде».',
  boards: ['WN-0', 'Q80-0', 'SFX-0', '9-0'],
  sections: [
    {
      id: 'surfaces',
      title: 'Поверхности',
      content: (
        <SwatchGrid
          tokens={[
            ['background', 'Фон страницы'],
            ['surface-1', 'Карточки, поля, кнопки'],
            ['surface-2', 'Дорожки, шапки таблиц, read-only'],
            ['surface-3', 'Нажатие второстепенной кнопки'],
            ['overlay', 'Меню, поповеры, диалоги'],
            ['glass', 'Стекло плавающих панелей'],
          ]}
        />
      ),
    },
    {
      id: 'text',
      title: 'Текст и линии',
      content: (
        <SwatchGrid
          tokens={[
            ['fg-1', 'Основной текст'],
            ['fg-2', 'Вторичный текст, подписи'],
            ['fg-3', 'Подсказки, плейсхолдеры'],
            ['fg-4', 'Декор, не для чтения'],
            ['input', 'Рамка поля, 3:1'],
            ['border', 'Рамка кнопки'],
            ['hairline', 'Кольцо карточки'],
            ['separator', 'Разделители'],
            ['fill-1', 'Наведение'],
            ['fill-2', 'Подсветка, бейдж'],
            ['ring', 'Кольцо фокуса'],
            ['scrim', 'Подложка диалога'],
          ]}
        />
      ),
    },
    {
      id: 'accent',
      title: 'Акцент',
      content: (
        <SwatchGrid
          tokens={[
            ['accent', 'Основная кнопка, выбор'],
            ['accent-hover', 'Наведение'],
            ['accent-pressed', 'Нажатие'],
            ['accent-fg', 'Текст на акценте'],
            ['accent-soft', 'Мягкая кнопка, выбранный тег'],
            ['accent-soft-fg', 'Текст на мягком, ссылки'],
          ]}
        />
      ),
    },
    {
      id: 'statuses',
      title: 'Статусы',
      content: (
        <SwatchGrid
          tokens={[
            ['success', 'Успех'],
            ['success-soft', 'Фон успеха'],
            ['warning', 'Предупреждение, тёмный текст'],
            ['warning-soft', 'Фон предупреждения'],
            ['danger', 'Ошибка, удаление'],
            ['danger-soft', 'Фон ошибки'],
            ['info', 'Информация'],
            ['info-soft', 'Фон информации'],
          ]}
        />
      ),
    },
    {
      id: 'charts',
      title: 'Графики',
      content: (
        <div className="flex flex-col gap-4">
          <Prose>
            <p>Восемь равных по светлоте оттенков для серий — их можно ставить рядом в любом порядке.</p>
          </Prose>
          <div className="flex max-w-3xl overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--color-hairline)]">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
              <div key={index} className="flex h-20 flex-1 items-end p-2" style={{ background: `var(--color-chart-${index})` }}>
                <span className="rounded-xs bg-surface-1/80 px-1 font-mono text-[11px] text-fg-1">{index}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'themes',
      title: 'Восемь тем',
      content: (
        <div className="flex flex-col gap-4">
          <Prose>
            <p>
              Тема меняет акцент и лёгкий оттенок нейтральных цветов. Кобальт — по умолчанию. Нажмите на тему, чтобы применить её ко всему
              сайту, или откройте <Link to="/themes" className="text-accent-soft-fg underline-offset-3 hover:underline">витрину тем</Link>.
            </p>
          </Prose>
          <ThemeDots />
          <CodeBlock
            lang="html"
            className="max-w-3xl"
            code={'<html data-accent="cobalt" data-mode="dark">\n\n<!-- тема для части страницы: оба атрибута на одном элементе -->\n<section data-accent="jade" data-mode="light">…</section>'}
          />
        </div>
      ),
    },
  ],
};
