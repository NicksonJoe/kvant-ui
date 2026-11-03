import { cn } from '@/kvant';

const groups: { title: string; styles: { sample: string; className: string; spec: string }[] }[] = [
  {
    title: 'Дисплей · только лендинг',
    styles: [
      { sample: 'Норда', className: 'text-display-2xl font-semibold', spec: '72/76 · 600 · 0em · --text-display-2xl' },
      { sample: 'Без хаоса', className: 'text-display-xl font-semibold', spec: '60/64 · 600 · 0em · --text-display-xl' },
      { sample: 'Запись за минуту', className: 'text-display-lg font-semibold', spec: '48/52 · 600 · 0em · --text-display-lg' },
      { sample: 'Клиенты возвращаются', className: 'text-display-md font-semibold', spec: '40/44 · 600 · 0em · --text-display-md' },
      { sample: 'Расписание студии', className: 'text-display-sm font-semibold', spec: '32/36 · 600 · 0em · --text-display-sm' },
    ],
  },
  {
    title: 'Заголовки',
    styles: [
      { sample: 'Записи на сегодня', className: 'text-heading-xl font-semibold', spec: '28/36 · 600 · −0.002em · --text-heading-xl' },
      { sample: 'Выручка за октябрь', className: 'text-heading-lg font-semibold', spec: '24/32 · 600 · −0.002em · --text-heading-lg' },
      { sample: 'Новая запись', className: 'text-heading-md font-semibold', spec: '20/28 · 600 · −0.007em · --text-heading-md' },
      { sample: 'Ближайшие визиты', className: 'text-heading-sm font-semibold', spec: '18/24 · 600 · −0.008em · --text-heading-sm' },
      { sample: 'Анна Соколова', className: 'text-heading-xs font-semibold', spec: '16/24 · 600 · −0.009em · --text-heading-xs' },
    ],
  },
  {
    title: 'Текст',
    styles: [
      { sample: 'Норда напомнит клиенту о визите за день и сама перенесёт запись, если он попросит.', className: 'text-body-lg', spec: '18/28 · 400 · −0.006em · --text-body-lg' },
      { sample: 'Клиент получит напоминание за 24 часа до визита. Отменить его можно в карточке записи.', className: 'text-body-md', spec: '16/24 · 400 · −0.007em · --text-body-md' },
      {
        sample: 'Мастер увидит запись в своём расписании, а клиент — подтверждение по СМС и напоминание за день до визита.',
        className: 'text-body-sm',
        spec: '14/20 · 400 · −0.007em · --text-body-sm',
      },
      {
        sample: 'Последний визит 12 октября, абонемент действует до 31 декабря. Осталось 4 занятия из 8, следующее — во вторник в 19:30.',
        className: 'text-body-xs',
        spec: '13/18 · 400 · −0.004em · --text-body-xs',
      },
    ],
  },
  {
    title: 'Метки и подписи',
    styles: [
      { sample: 'Записать клиента', className: 'text-label-lg font-medium', spec: '16/20 · 500 · −0.008em · --text-label-lg' },
      { sample: 'Сохранить изменения', className: 'text-label-md font-medium', spec: '14/20 · 500 · −0.007em · --text-label-md' },
      { sample: 'Все мастера', className: 'text-label-sm font-medium', spec: '13/16 · 500 · −0.004em · --text-label-sm' },
      { sample: 'Обновлено сегодня в 14:05', className: 'text-caption', spec: '12/16 · 400 · 0em · --text-caption' },
      { sample: 'ожидают оплаты', className: 'text-overline font-semibold uppercase tracking-overline', spec: '11/16 · 600 · 0.06em · caps · --text-overline' },
    ],
  },
  {
    title: 'Данные и код',
    styles: [
      { sample: '1 284 900 ₽', className: 'text-display-sm font-semibold tabular-nums', spec: '32/36 · 600 · 0em · tnum · --text-display-sm' },
      { sample: '--font-sans: "Inter", system-ui;', className: 'font-mono text-body-sm tracking-[0em]', spec: '14/20 · 400 · 0em · --font-mono' },
    ],
  },
];

export default function TypographyScale() {
  return (
    <div className="flex w-full flex-col gap-6">
      {groups.map((group) => (
        <section key={group.title} className="flex flex-col">
          <h3 className="pb-2 text-caption text-fg-3">{group.title}</h3>
          {group.styles.map((style) => (
            <div key={style.spec} className="flex flex-col gap-1 border-b border-separator py-4">
              <span className={cn('max-w-[60ch] text-fg-1', style.className)}>{style.sample}</span>
              <span className="font-mono text-overline font-medium text-fg-3">{style.spec}</span>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
