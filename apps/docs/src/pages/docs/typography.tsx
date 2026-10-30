import type { DocPageDef } from './types';
import { Mono, SpecList } from './widgets';

const scale = [
  ['display-2xl', '72 / 76', 'Орбита'],
  ['display-xl', '60 / 64', 'Студия «Север»'],
  ['display-lg', '48 / 52', 'Сделки под контролем'],
  ['display-md', '40 / 44', 'Выручка за октябрь'],
  ['display-sm', '32 / 36', 'Новая сделка'],
  ['heading-xl', '28 / 36', 'Айдентика для пекарни'],
  ['heading-lg', '24 / 32', 'Клиенты студии'],
  ['heading-md', '20 / 28', 'Условия договора'],
  ['heading-sm', '18 / 24', 'Задачи на неделю'],
  ['heading-xs', '16 / 24', 'Уведомления'],
  ['body-lg', '18 / 28', 'Напомним о созвоне в пятницу, 30 октября, в 11:00.'],
  ['body-md', '16 / 24', 'Напомним о созвоне в пятницу, 30 октября, в 11:00.'],
  ['body-sm', '14 / 20', 'Напомним о созвоне в пятницу, 30 октября, в 11:00.'],
  ['body-xs', '13 / 18', 'Напомним о созвоне в пятницу, 30 октября, в 11:00.'],
  ['caption', '12 / 16', 'Изменено 29.10.2026 в 14:30'],
] as const;

export const typography: DocPageDef = {
  slug: 'typography',
  title: 'Типографика',
  lead: 'Inter по умолчанию, Geist — альтернатива, моноширинный — JetBrains Mono. Оптический размер включается сам, цифры в данных — табличные.',
  boards: ['A-0', '1A7-0', 'PA6-0'],
  sections: [
    {
      id: 'fonts',
      title: 'Шрифты',
      content: (
        <div className="grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ['inter', 'Inter 4.1', 'По умолчанию. Ближе всех к SF Pro и лучше всех по кириллице.'],
            ['geist', 'Geist 1.8', 'Альтернатива с более геометричными формами.'],
          ].map(([font, name, text]) => (
            <div key={font} data-font={font} className="flex flex-col gap-2 rounded-xl bg-surface-1 p-5 font-sans shadow-raised">
              <span className="text-display-sm font-semibold">Аа Ёё 123</span>
              <span className="text-label-md font-medium">{name}</span>
              <span className="text-body-xs text-fg-3">{text}</span>
            </div>
          ))}
          <div className="flex flex-col gap-2 rounded-xl bg-surface-1 p-5 shadow-raised">
            <span className="font-mono text-display-sm font-medium">{'{ }'} 0O</span>
            <span className="text-label-md font-medium">JetBrains Mono</span>
            <span className="text-body-xs text-fg-3">Только для кода, данных и спецификаций — не для украшения.</span>
          </div>
        </div>
      ),
    },
    {
      id: 'scale',
      title: 'Шкала',
      content: (
        <div className="flex flex-col divide-y divide-separator rounded-xl bg-surface-1 shadow-raised">
          {scale.map(([token, size, sample]) => (
            <div key={token} className="flex flex-col gap-1 px-5 py-4 md:flex-row md:items-baseline md:gap-6">
              <span className="flex w-44 shrink-0 items-baseline gap-2">
                <code className="font-mono text-caption text-fg-1">{token}</code>
                <Mono>{size}</Mono>
              </span>
              <span className="min-w-0 truncate font-semibold" style={{ fontSize: `var(--text-${token})`, lineHeight: `var(--leading-${token})` }}>
                {sample}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'russian',
      title: 'Русский набор',
      content: (
        <SpecList
          items={[
            ['Кавычки', '«ёлочки» снаружи, „лапки“ внутри: «Пекарня „Хлебница“»'],
            ['Деньги', '1 284 900 ₽ — разряды и знак рубля через неразрывный пробел'],
            ['Проценты', '12,4 % — десятичная запятая, пробел перед знаком'],
            ['Даты и время', '29.10.2026 или 29 октября; время в 24 часа: 14:30'],
            ['Тире', 'Длинное тире с неразрывным пробелом перед ним и обычным после'],
            ['Длина строк', 'Русский текст на 35 % длиннее английского: не фиксируйте ширину подписей'],
          ]}
        />
      ),
    },
  ],
};
