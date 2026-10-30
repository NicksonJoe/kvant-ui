import { ArrowRight, FlaskConical, LayoutGrid, Palette } from 'lucide-react';
import { Link } from 'react-router';
import { Badge, Card } from '@/kvant';
import { components, isReady } from '@/kvant/meta';
import { CodeBlock } from '../../components/CodeBlock';
import { pluralWord } from '../../lib/registry';
import type { DocPageDef } from './types';
import { Prose, SpecList } from './widgets';

const ready = components.filter(isReady).length;
const planned = components.length - ready;

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card padding="compact" className="gap-1">
      <span className="text-display-sm font-semibold tabular-nums">{value}</span>
      <span className="text-body-sm text-fg-2">{label}</span>
    </Card>
  );
}

const shortcuts = [
  { to: '/components', icon: <LayoutGrid />, title: 'Компоненты', text: 'Карта библиотеки: готовые и те, что в работе.' },
  { to: '/playground', icon: <FlaskConical />, title: 'Playground', text: 'Настройте любой готовый компонент и заберите код.' },
  { to: '/themes', icon: <Palette />, title: 'Темы', text: 'Восемь тем в светлом и тёмном режиме.' },
];

export const introduction: DocPageDef = {
  slug: '',
  title: 'Введение',
  lead: 'Kvant — собственная библиотека интерфейсов: токены, компоненты на React и документация с живыми примерами. Исходник компонента копируется в проект и дальше принадлежит проекту.',
  sections: [
    {
      id: 'contents',
      title: 'Что внутри',
      content: (
        <div className="flex flex-col gap-6">
          <div className="grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat
              value={String(ready)}
              label={pluralWord(ready, { one: 'компонент готов к работе', few: 'компонента готовы к работе', many: 'компонентов готовы к работе' })}
            />
            <Stat
              value={String(planned)}
              label={pluralWord(planned, { one: 'компонент ждёт кода', few: 'компонента ждут кода', many: 'компонентов ждут кода' })}
            />
            <Stat value="8 × 2" label="темы в светлом и тёмном режиме" />
          </div>
          <div className="grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
            {shortcuts.map((item) => (
              <Card key={item.to} variant="interactive" padding="compact" className="relative gap-2">
                <span aria-hidden className="grid size-9 place-items-center rounded-full bg-accent-soft text-accent-soft-fg [&_svg]:size-[18px] [&_svg]:stroke-[1.75]">
                  {item.icon}
                </span>
                <Link to={item.to} className="flex items-center gap-1 text-label-md font-medium after:absolute after:inset-0 after:rounded-xl">
                  {item.title}
                  <ArrowRight aria-hidden className="size-4 text-fg-3" />
                </Link>
                <p className="text-body-xs text-fg-3">{item.text}</p>
              </Card>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'mood',
      title: 'Настроение',
      content: (
        <Prose>
          <p>
            «Орбитальный модуль»: светлые композитные панели, графит и один сигнальный цвет. Футуристичность — в точности деталей, а не в
            эффектах: волосяные линии вместо теней, табличные цифры, стекло только на плавающих слоях, короткое физичное движение.
          </p>
          <p>Ориентир по качеству — Apple HIG, Linear и Vercel. Шрифт — Inter, альтернатива — Geist; акцентного шрифта нет.</p>
        </Prose>
      ),
    },
    {
      id: 'how',
      title: 'Как устроено',
      content: (
        <SpecList
          items={[
            ['Токены', 'CSS-переменные: поверхности, текст, акцент, статусы, отступы, радиусы, движение. Тема — два атрибута на <html>.'],
            ['Компоненты', 'React 19, TypeScript и Tailwind v4. Поведение, фокус и ARIA — от Base UI, внешний вид — целиком Kvant.'],
            ['Метаданные', 'У каждого компонента описаны свойства, слоты, состояния, клавиатура и движение. Из них строятся эта документация и Playground.'],
            ['Paper', 'Файл «Kvant — дизайн-система» — источник всех значений. Ссылка на доску есть у каждого компонента.'],
          ]}
        />
      ),
    },
    {
      id: 'start',
      title: 'С чего начать',
      content: (
        <ol className="flex max-w-3xl list-decimal flex-col gap-2 pl-5 text-body-md text-fg-2 marker:text-fg-3">
          <li>
            <Link to="/docs/installation" className="text-accent-soft-fg underline-offset-3 hover:underline">
              Установите
            </Link>{' '}
            токены, стили и нужные компоненты.
          </li>
          <li>
            Прочитайте{' '}
            <Link to="/docs/principles" className="text-accent-soft-fg underline-offset-3 hover:underline">
              принципы
            </Link>{' '}
            — они короче, чем кажется.
          </li>
          <li>
            Выберите компонент в{' '}
            <Link to="/components" className="text-accent-soft-fg underline-offset-3 hover:underline">
              каталоге
            </Link>{' '}
            или соберите вид в Playground.
          </li>
        </ol>
      ),
    },
  ],
};

const cssSetup = `@import 'tailwindcss';
@import '@fontsource-variable/inter/opsz.css';
@import '@fontsource-variable/geist';
@import '@fontsource-variable/jetbrains-mono';
@import './kvant/styles/tokens.css';
@import './kvant/styles/tailwind.css';
@import './kvant/styles/components.css';`;

const prepaint = `<html lang="ru" data-accent="cobalt" data-mode="light">
  <head>
    <script>
      // Saved theme before the first paint: no light flash in dark mode.
      (function () {
        try {
          var t = JSON.parse(localStorage.getItem('kvant-theme') || '{}');
          var d = document.documentElement;
          var mode = t.mode === 'system'
            ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : t.mode;
          if (t.accent) d.setAttribute('data-accent', t.accent);
          if (mode) d.setAttribute('data-mode', mode);
          if (t.font) d.setAttribute('data-font', t.font);
          if (t.shape) d.setAttribute('data-shape', t.shape);
          if (t.density) d.setAttribute('data-density', t.density);
          if (t.reduceMotion) d.setAttribute('data-reduce-motion', '');
        } catch (e) {}
      })();
    </script>
  </head>
</html>`;

export const installation: DocPageDef = {
  slug: 'installation',
  title: 'Установка',
  lead: 'Kvant ставится в проект на React 19 и Tailwind v4. Компонент — это файл, который копируется к вам и дальше меняется как ваш собственный код.',
  sections: [
    {
      id: 'cli',
      title: 'Командой',
      content: (
        <div className="flex max-w-3xl flex-col gap-3">
          <div className="flex items-center gap-2">
            <Badge tone="warning" variant="dot">
              CLI в работе
            </Badge>
            <span className="text-body-sm text-fg-3">Команды появятся вместе с реестром; пока — вручную, шаги ниже.</span>
          </div>
          <CodeBlock lang="bash" code={'npx kvant-ui init\nnpx kvant-ui add button'} />
        </div>
      ),
    },
    {
      id: 'dependencies',
      title: 'Зависимости',
      content: (
        <CodeBlock
          lang="bash"
          className="max-w-3xl"
          code={
            'pnpm add react react-dom @base-ui/react lucide-react\npnpm add @fontsource-variable/inter @fontsource-variable/geist @fontsource-variable/jetbrains-mono\npnpm add -D tailwindcss @tailwindcss/vite'
          }
        />
      ),
    },
    {
      id: 'styles',
      title: 'Стили',
      content: (
        <div className="flex max-w-3xl flex-col gap-3">
          <Prose>
            <p>
              Скопируйте папку <code>styles</code> из реестра и подключите её после Tailwind. <code>tokens.css</code> работает и без Tailwind;{' '}
              <code>tailwind.css</code> превращает токены в утилиты вроде <code>bg-surface-1</code> и <code>text-fg-2</code>.
            </p>
          </Prose>
          <CodeBlock lang="css" title="src/index.css" code={cssSetup} />
        </div>
      ),
    },
    {
      id: 'theme',
      title: 'Тема до первой отрисовки',
      content: (
        <div className="flex max-w-3xl flex-col gap-3">
          <Prose>
            <p>
              Тема — атрибуты <code>data-accent</code> и <code>data-mode</code> на <code>{'<html>'}</code>. Маленький скрипт в{' '}
              <code>{'<head>'}</code> ставит сохранённую тему до первой отрисовки, а хук <code>useTheme</code> меняет её на лету.
            </p>
          </Prose>
          <CodeBlock lang="html" title="index.html" code={prepaint} />
        </div>
      ),
    },
    {
      id: 'components',
      title: 'Компоненты',
      content: (
        <div className="flex max-w-3xl flex-col gap-3">
          <Prose>
            <p>
              Скопируйте <code>lib/cn.ts</code>, <code>lib/recipes.ts</code> и файл компонента из вкладки «Код» на его странице, затем
              экспортируйте его из <code>kvant/index.ts</code>. В приложении импорт один и тот же:
            </p>
          </Prose>
          <CodeBlock code={"import { Button } from '@/kvant';\n\n<Button>Сохранить</Button>"} />
        </div>
      ),
    },
  ],
};

export const principles: DocPageDef = {
  slug: 'principles',
  title: 'Принципы',
  lead: 'Восемь правил, по которым принимаются решения в Kvant. Когда сомневаетесь, как сделать, — начните отсюда.',
  sections: [
    {
      id: 'rules',
      title: 'Правила',
      content: (
        <div className="grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
          {[
            ['Детали вместо эффектов', 'Волосяные линии, табличные цифры, точные отступы. Никаких свечений, градиентного текста и цветных полос слева.'],
            ['Капсулы', 'Радиус любого контрола — половина его высоты. Вариант «скругление» 8–12 px включается одним токеном темы.'],
            ['Одна основная кнопка', 'На экране одно главное действие. Остальные — второстепенные, мягкие или прозрачные.'],
            ['Стекло только на плавающем', 'Навбар, таб-бар, тосты, меню и ⌘K. Никогда на карточках и строках, никогда стекло на стекле.'],
            ['Доступность по умолчанию', 'Контраст текста от 4,5:1, кольцо фокуса 2 px, клавиатура по WAI-ARIA, зона касания от 44 px.'],
            ['Короткое движение', 'В интерфейсе до 300 мс, отскок только у переключателей и вкладок. Сниженное движение уважается всегда.'],
            ['Русская типографика', '«Ёлочки», неразрывные пробелы, «1 284 900 ₽», «12,4 %», даты «29.10.2026». Строки на 35 % длиннее английских.'],
            ['Код принадлежит проекту', 'Компонент копируется и правится как свой. className — для раскладки, а не чтобы перебить рецепт.'],
          ].map(([title, text]) => (
            <Card key={title} variant="outline" padding="compact" className="gap-1.5">
              <h3 className="text-heading-xs font-semibold">{title}</h3>
              <p className="text-body-sm text-fg-2">{text}</p>
            </Card>
          ))}
        </div>
      ),
    },
    {
      id: 'decisions',
      title: 'Принятые решения',
      content: (
        <SpecList
          items={[
            ['Платформа', 'Веб-ядро на React 19, Tailwind v4 и Base UI. Темы для Flutter и Filament генерируются из тех же токенов.'],
            ['Тема по умолчанию', 'Кобальт: акцент oklch(0.565 0.19 258) на фоне #F8F9FB, белый текст на кнопке — 4,6:1.'],
            ['Поля ввода', 'Рамка с контрастом от 3:1 (WCAG 1.4.11); заливка — опция.'],
            ['Тёмная тема', 'Глубокие акцентные кнопки с белым текстом, почти чёрный фон, подъём светлотой и верхним бликом.'],
            ['Иконки', 'Lucide, штрих 1,75 до 16 px и 1,5 от 20 px, цвет наследуется от текста, без эмодзи.'],
          ]}
        />
      ),
    },
  ],
};
