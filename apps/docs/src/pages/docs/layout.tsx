import { Copy, Pencil, Trash2 } from 'lucide-react';
import { BUTTON_SIZES, Button, Input, SegmentedControl } from '@/kvant';
import type { DocPageDef } from './types';
import { DemoSurface, Mono, Prose, SpecList } from './widgets';

const spacing = [
  ['0-5', 2],
  ['1', 4],
  ['1-5', 6],
  ['2', 8],
  ['3', 12],
  ['4', 16],
  ['5', 20],
  ['6', 24],
  ['8', 32],
  ['10', 40],
  ['12', 48],
  ['16', 64],
  ['20', 80],
  ['24', 96],
] as const;

const radii = [
  ['xs', '6'],
  ['sm', '8'],
  ['md', '12'],
  ['lg', '16'],
  ['xl', '20'],
  ['2xl', '24'],
  ['3xl', '28'],
  ['4xl', '36'],
  ['full', 'h/2'],
] as const;

function ShapeSample({ shape, title }: { shape: 'capsule' | 'density'; title: string }) {
  return (
    <div data-shape={shape} className="flex flex-col gap-4 rounded-2xl bg-background p-5 shadow-[0_0_0_1px_var(--color-hairline)]">
      <span className="text-label-sm font-medium text-fg-2">{title}</span>
      <div className="flex flex-wrap gap-2">
        <Button size="sm">Сохранить</Button>
        <Button size="sm" variant="secondary">
          Отмена
        </Button>
      </div>
      <Input size="sm" aria-label="Поиск" placeholder="Поиск" />
      <SegmentedControl
        aria-label="Период"
        defaultValue="week"
        options={[
          { value: 'day', label: 'День' },
          { value: 'week', label: 'Неделя' },
          { value: 'month', label: 'Месяц' },
        ]}
      />
    </div>
  );
}

export const spacingPage: DocPageDef = {
  slug: 'spacing',
  title: 'Отступы и размеры',
  lead: 'Сетка 4 px: тесно внутри групп, широко между разделами. Высоты контролов — пять ступеней, общие для кнопок, полей и сегментов.',
  boards: ['RP-0', 'R3B-0', '5HU-0'],
  sections: [
    {
      id: 'scale',
      title: 'Шкала отступов',
      content: (
        <div className="flex max-w-3xl flex-col gap-2">
          {spacing.map(([token, px]) => (
            <div key={token} className="flex items-center gap-4">
              <code className="w-24 shrink-0 font-mono text-caption text-fg-1">spacing-{token}</code>
              <Mono>{px} px</Mono>
              <span aria-hidden className="h-3 rounded-full bg-accent" style={{ width: px * 3 }} />
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'controls',
      title: 'Высоты контролов',
      content: (
        <div className="flex flex-col gap-4">
          <Prose>
            <p>
              <code>xs 24 · sm 32 · md 36 · lg 44 · xl 52</code>. md — для указателя, lg — для касания, xl — главная кнопка мобильного экрана.
              Компактная плотность в «Среде» опускает всё на шаг: 36 становится 32, строки таблиц — 40 вместо 48.
            </p>
          </Prose>
          <DemoSurface className="flex flex-wrap items-end gap-3">
            {BUTTON_SIZES.map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <Button size={size} variant="secondary">
                  {size}
                </Button>
                <Mono>control-{size}</Mono>
              </div>
            ))}
          </DemoSurface>
        </div>
      ),
    },
    {
      id: 'touch',
      title: 'Зона касания',
      content: (
        <Prose>
          <p>
            На сенсорных экранах цель нажатия — не меньше 44 × 44 px. Маленькие кнопки-иконки (24 и 32 px) получают невидимое расширение
            зоны, а поля в мобильных формах — размер lg с текстом 16 px, чтобы iOS не увеличивала страницу.
          </p>
        </Prose>
      ),
    },
    {
      id: 'breakpoints',
      title: 'Брейкпоинты и контейнеры',
      content: (
        <SpecList
          items={[
            ['sm 640', 'Телефон в альбомной ориентации'],
            ['md 768', 'Планшет: двухколоночные формы'],
            ['lg 1024', 'Боковая панель становится постоянной'],
            ['xl 1280', 'Оглавление «На странице» справа'],
            ['2xl 1536', 'Широкие дашборды'],
            ['Контейнеры', 'prose 680 · md 960 · lg 1200 · xl 1440; ширина текста — до 72 знаков'],
          ]}
        />
      ),
    },
  ],
};

export const shape: DocPageDef = {
  slug: 'shape',
  title: 'Форма',
  lead: 'Капсулы везде: радиус любого контрола — половина его высоты. Поверхности скругляются по своей шкале, вложенные углы концентричны.',
  boards: ['B-0'],
  sections: [
    {
      id: 'radii',
      title: 'Радиусы',
      content: (
        <div className="flex flex-wrap gap-4">
          {radii.map(([token, px]) => (
            <div key={token} className="flex flex-col items-center gap-2">
              <span
                aria-hidden
                className="h-16 w-20 bg-surface-1 shadow-raised"
                style={{ borderRadius: `var(--radius-${token})` }}
              />
              <code className="font-mono text-caption text-fg-1">{token}</code>
              <Mono>{px}</Mono>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'capsule',
      title: 'Капсула и скругление',
      content: (
        <div className="flex flex-col gap-4">
          <Prose>
            <p>
              Форма — токен темы <code>data-shape</code>. «Капсула» — выбор по умолчанию; «скругление» даёт контролам 8–12 px для плотных
              рабочих экранов. Карточки, меню и диалоги от формы не зависят.
            </p>
          </Prose>
          <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
            <ShapeSample shape="capsule" title="Капсула" />
            <ShapeSample shape="density" title="Скругление" />
          </div>
        </div>
      ),
    },
    {
      id: 'concentric',
      title: 'Концентричность',
      content: (
        <div className="flex flex-col gap-4">
          <Prose>
            <p>
              Внутренний радиус = внешний − отступ. Меню r16 с отступом 4 px получает пункты r12 — углы остаются параллельными.
            </p>
          </Prose>
          <div className="flex w-60 flex-col rounded-lg bg-overlay p-1 shadow-overlay">
            {[
              [<Pencil key="i" />, 'Изменить'],
              [<Copy key="i" />, 'Дублировать'],
              [<Trash2 key="i" />, 'Удалить'],
            ].map(([icon, label], index) => (
              <span
                key={index}
                className={`flex h-8 items-center gap-2.5 rounded-md px-2.5 text-body-sm text-fg-1 [&_svg]:size-4 [&_svg]:stroke-[1.75] [&_svg]:text-fg-2 ${index === 0 ? 'bg-fill-2' : ''}`}
              >
                {icon}
                {label}
              </span>
            ))}
          </div>
        </div>
      ),
    },
  ],
};

export const layers: DocPageDef = {
  slug: 'layers',
  title: 'Слои и стекло',
  lead: 'Высота объявляется один раз: карточка — волосяное кольцо и микротень, плавающее — тень оверлея. Стекло — только у плавающего хрома.',
  boards: ['RHI-0'],
  sections: [
    {
      id: 'elevation',
      title: 'Высота',
      content: (
        <DemoSurface className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['raised', 'Карточки, таблицы'],
            ['control', 'Второстепенная кнопка, теги'],
            ['overlay', 'Меню, поповеры, тосты'],
            ['modal', 'Диалоги, шиты, ⌘K'],
          ].map(([token, text]) => (
            <div key={token} className="flex h-28 flex-col justify-end gap-0.5 rounded-xl bg-surface-1 p-4" style={{ boxShadow: `var(--shadow-${token})` }}>
              <code className="font-mono text-caption text-fg-1">shadow-{token}</code>
              <span className="text-caption text-fg-3">{text}</span>
            </div>
          ))}
        </DemoSurface>
      ),
    },
    {
      id: 'glass',
      title: 'Стекло',
      content: (
        <div className="flex flex-col gap-4">
          <Prose>
            <p>
              Стекло — фон <code>glass</code>, размытие 20 px и насыщенность 180 %. Только навбары, таб-бары, плавающие панели, тосты, меню и
              командная палитра. Никогда на карточках и строках, никогда стекло на стекле.
            </p>
          </Prose>
          <div className="relative h-56 max-w-3xl overflow-hidden rounded-2xl bg-surface-1 shadow-raised">
            <div className="flex flex-col gap-3 p-5">
              {['Айдентика для пекарни', 'Сайт для яхт-клуба', 'Упаковка чайной линейки', 'Навигация для ТЦ'].map((title, index) => (
                <div key={title} className="flex items-center gap-3">
                  <span aria-hidden className="size-8 rounded-full" style={{ background: `var(--color-chart-${index + 1})` }} />
                  <span className="text-body-sm font-medium">{title}</span>
                </div>
              ))}
            </div>
            <div className="absolute inset-x-4 bottom-4 flex h-12 items-center justify-between rounded-full bg-glass px-5 shadow-glass backdrop-blur-[20px] backdrop-saturate-[1.8]">
              <span className="text-label-sm font-medium">Выбрано 2 сделки</span>
              <Button size="xs">В архив</Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'stack',
      title: 'Порядок слоёв',
      content: (
        <SpecList
          items={[
            ['Содержимое', 'Страница, карточки, таблицы'],
            ['z-40', 'Липкие панели: шапка сайта, панель массовых действий'],
            ['z-50', 'Оверлеи: меню, поповеры, диалоги, шиты, ⌘K'],
            ['z-60', 'Уведомления — поверх всего'],
          ]}
        />
      ),
    },
  ],
};

