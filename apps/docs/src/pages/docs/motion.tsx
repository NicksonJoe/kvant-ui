import { Play } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button, SegmentedControl, cn } from '@/kvant';
import { CopyButton } from '../../components/CopyButton';
import { EasingCurve } from '../../components/EasingCurve';
import { springConstants, springLinear, splitTransition } from '../../lib/easing';
import { useEnvironment } from '../../lib/environment';
import { REDUCED_MOTION, ROOT_VALUES, TOKENS, useTokenValues } from '../../lib/tokens';
import type { DocPageDef } from './types';
import { Prose } from './widgets';

const DURATIONS = [
  ['instant', '⌘K, подсветка пункта меню, наведение в плотных списках'],
  ['micro', 'Наведение, нажатие'],
  ['fast', 'Мелкие исчезновения, снятие флажка'],
  ['quick', 'Подсказка, меню, поповер; уход наведения'],
  ['base', 'Диалог, аккордеон, индикатор вкладок'],
  ['moderate', 'Закрытие шита, переход страницы'],
  ['slow', 'Открытие бокового шита'],
  ['slower', 'Нижний шит на телефоне'],
  ['deliberate', 'Только герой лендинга'],
] as const;

const EASINGS = [
  ['ease-out', 'Появления, отклики, нажатие — по умолчанию'],
  ['ease-standard', 'Движение по экрану, аккордеон, ширина панели'],
  ['ease-fluid', 'Шиты, ящики, уведомления, бегунок сегментов'],
  ['ease-hover', 'Цвет, фон, рамка'],
  ['ease-emphasized', 'Появление блоков лендинга'],
  ['ease-exit', 'Окончательные исчезновения не дольше 150 мс'],
  ['ease-in-out', 'Автономные циклы'],
  ['linear', 'Прогресс, спиннер, мерцание скелетона'],
] as const;

// Apple model: duration d in seconds and bounce; the CSS transition lasts d.
const SPRINGS = [
  { name: 'micro', duration: 0.2, bounce: 0, use: 'Отпускание кнопки' },
  { name: 'snappy', duration: 0.3, bounce: 0.1, use: 'Бегунок переключателя, индикатор вкладок и сегментов, точка радио' },
  { name: 'smooth', duration: 0.35, bounce: 0, use: 'Перестроение раскладки, перетаскивание' },
  { name: 'gentle', duration: 0.5, bounce: 0, use: 'Нижние шиты, общий элемент между экранами' },
  { name: 'release', duration: 0.45, bounce: 0.15, use: 'Отпускание после броска, точки привязки, карусель' },
  { name: 'bouncy', duration: 0.4, bounce: 0.3, use: 'Редкая радость: галочка успеха, появление бейджа' },
] as const;

const DISTANCES = [
  ['shift-xs', 'Микросдвиг'],
  ['shift-sm', 'Отступ подсказки и меню от триггера'],
  ['shift-md', 'Подъём диалога при появлении'],
  ['shift-lg', 'Появление уведомления, блоков лендинга'],
  ['shift-xl', 'Крупный сдвиг'],
  ['scale-press', 'Нажатие'],
  ['scale-press-wide', 'Нажатие xl-кнопки и широких кнопок'],
  ['scale-press-icon', 'Нажатие кнопки-иконки до 32 px'],
  ['scale-enter', 'Появление меню, поповера, диалога'],
  ['scale-tooltip', 'Появление подсказки'],
  ['scale-lift', 'Подъём при перетаскивании'],
] as const;

const ru = (value: number, digits = 0) => value.toLocaleString('ru', { minimumFractionDigits: digits, maximumFractionDigits: Math.max(digits, 1) });

function Track({ on, transition }: { on: boolean; transition: string }) {
  return (
    <span aria-hidden className="relative block h-7 w-full max-w-72 rounded-full bg-fill-2">
      <span
        className="absolute top-1 size-5 rounded-full bg-accent shadow-thumb"
        style={{ left: on ? 'calc(100% - 24px)' : '4px', transition: `left ${transition}` }}
      />
    </span>
  );
}

const rowClass = 'grid grid-cols-1 items-center gap-2 px-5 py-3 md:gap-4';
const card = 'flex flex-col divide-y divide-separator rounded-xl bg-surface-1 shadow-raised';

/** «Запустить» moves every track of the section at once; the tracks run on live tokens. */
function Demo({ children }: { children: (on: boolean) => ReactNode }) {
  const [on, setOn] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <Button variant="secondary" size="sm" leadingIcon={<Play />} className="self-start" onClick={() => setOn((value) => !value)}>
        Запустить
      </Button>
      <div className={card}>{children(on)}</div>
    </div>
  );
}

/** Token name over what it is for. */
function Name({ token, use, note }: { token: string; use: string; note?: string }) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <code className="font-mono text-caption text-fg-1">
        {token}
        {note ? <span className="font-sans text-fg-3"> · {note}</span> : null}
      </code>
      <span className="text-body-xs text-fg-2">{use}</span>
    </span>
  );
}

function Durations() {
  const read = useTokenValues();
  return (
    <Demo>
      {(on) =>
        DURATIONS.map(([token, use]) => (
          <div key={token} className={cn(rowClass, 'md:grid-cols-[minmax(0,1fr)_5rem_14rem]')}>
            <Name token={`duration-${token}`} use={use} />
            <code className="font-mono text-caption text-fg-3">{read(`--duration-${token}`)}</code>
            <Track on={on} transition={`var(--duration-${token}) var(--ease-out)`} />
          </div>
        ))
      }
    </Demo>
  );
}

function Easings() {
  const read = useTokenValues();
  return (
    <Demo>
      {(on) =>
        EASINGS.map(([token, use]) => {
          const value = token === 'linear' ? 'linear' : read(`--${token}`);
          return (
            <div key={token} className={cn(rowClass, 'md:grid-cols-[3.5rem_minmax(0,1fr)_16rem_10rem]')}>
              <EasingCurve easing={value} />
              <Name token={token} use={use} />
              <code className="font-mono text-caption text-fg-3">{value}</code>
              <Track on={on} transition={`var(--duration-deliberate) ${value}`} />
            </div>
          );
        })
      }
    </Demo>
  );
}

function Springs() {
  const read = useTokenValues();
  // reduced motion remaps the spring curves to ease-out; the springs without a token follow the same rule
  const reduced = read('--ease-spring-0') === read('--ease-out');
  return (
    <Demo>
      {(on) =>
        SPRINGS.map((spring) => {
          const token = `--spring-${spring.name}`;
          const tokenized = TOKENS.some((item) => item.name === token);
          const css = tokenized ? read(token) : `${spring.duration * 1000}ms ${reduced ? read('--ease-out') : springLinear(spring.bounce)}`;
          const { stiffness, damping } = springConstants(spring.duration, spring.bounce);
          return (
            <div key={spring.name} className={cn(rowClass, 'md:grid-cols-[3.5rem_minmax(0,1fr)_11rem_2rem_12rem]')}>
              <EasingCurve easing={splitTransition(css).easing} />
              <Name token={`spring-${spring.name}`} use={spring.use} note={tokenized ? undefined : 'нет CSS-токена'} />
              <span className="flex flex-col gap-0.5 font-mono text-caption">
                <span className="text-fg-2">
                  {ru(spring.duration, 2)} с · отскок {ru(spring.bounce)}
                </span>
                <span className="text-fg-3">
                  k {Math.round(stiffness)} · c {ru(damping)} · m 1
                </span>
              </span>
              <CopyButton value={tokenized ? `var(${token})` : css} label={`Скопировать CSS spring-${spring.name}`} />
              <Track on={on} transition={css} />
            </div>
          );
        })
      }
    </Demo>
  );
}

function Distances() {
  const read = useTokenValues();
  return (
    <div className={card}>
      {DISTANCES.map(([token, use]) => (
        <div key={token} className={cn(rowClass, 'md:grid-cols-[3.5rem_minmax(0,1fr)_5rem]')}>
          <span className="flex h-8 items-center">
            {token.startsWith('shift') ? (
              <span className="h-2 rounded-full bg-accent" style={{ width: `var(--${token})` }} />
            ) : (
              <span className="size-6 rounded-md bg-accent-soft shadow-[inset_0_0_0_1.5px_var(--color-accent)]" style={{ scale: `var(--${token})` }} />
            )}
          </span>
          <Name token={token} use={use} />
          <code className="font-mono text-caption text-fg-3">{read(`--${token}`)}</code>
        </div>
      ))}
    </div>
  );
}

function Reduced() {
  const [theme, setTheme] = useEnvironment();
  return (
    <div className="flex flex-col gap-5">
      <Prose>
        <p>
          Включается настройкой системы или переключателем ниже (он же — «Движение» в «Среде»). Сдвиги становятся нулевыми, масштаб —
          единицей, пружины — ease-out, всё длиннее base сокращается до 150 мс. Мерцание скелетона, параллакс и автопрокрутка выключаются,
          спиннер вращается вдвое медленнее. Цвет, прозрачность, фокус и прогресс остаются: это информация, а не украшение.
        </p>
      </Prose>
      <SegmentedControl<'full' | 'reduced'>
        aria-label="Движение на сайте"
        className="self-start"
        value={theme.reduceMotion ? 'reduced' : 'full'}
        onValueChange={(next) => setTheme({ reduceMotion: next === 'reduced' })}
        options={[
          { value: 'full', label: 'Полное' },
          { value: 'reduced', label: 'Сниженное' },
        ]}
      />
      <div className={card}>
        <div className="hidden grid-cols-[12rem_1fr_1fr] gap-4 px-5 py-2.5 text-caption font-medium text-fg-3 md:grid">
          <span>токен</span>
          <span>обычно</span>
          <span>при сниженном</span>
        </div>
        {Object.entries(REDUCED_MOTION).map(([name, value]) => (
          <div key={name} className={cn(rowClass, 'font-mono text-caption md:grid-cols-[12rem_1fr_1fr]')}>
            <code className="text-fg-1">{name}</code>
            <code title={ROOT_VALUES[name]} className="truncate text-fg-3">
              {ROOT_VALUES[name] ?? '—'}
            </code>
            <code className="text-fg-2">{value}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

export const motion: DocPageDef = {
  slug: 'motion',
  title: 'Движение',
  lead: 'Сначала CSS. Девять длительностей, восемь кривых и шесть пружин в модели Apple. Значения и дорожки живые: включите сниженное движение — токены переназначатся, а не исчезнут.',
  boards: ['P8-0', 'R7F-0'],
  sections: [
    { id: 'durations', title: 'Длительности', content: <Durations /> },
    { id: 'easings', title: 'Кривые', content: <Easings /> },
    {
      id: 'springs',
      title: 'Пружины',
      content: (
        <div className="flex flex-col gap-4">
          <Prose>
            <p>
              Пружина задаётся длительностью и отскоком, как в SwiftUI, и пересчитывается в CSS <code>linear()</code>: отклик пружины до
              успокоения укладывается в длительность. Отскок 0,1 — только у переключателя, сегментов и вкладок; на оверлеях, тексте и
              графиках отскока нет.
            </p>
          </Prose>
          <Springs />
        </div>
      ),
    },
    { id: 'distances', title: 'Смещения и масштабы', content: <Distances /> },
    { id: 'reduced', title: 'Сниженное движение', content: <Reduced /> },
  ],
};
