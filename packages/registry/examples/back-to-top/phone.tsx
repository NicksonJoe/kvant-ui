import { Plus } from 'lucide-react';
import { useRef } from 'react';
import { BackToTop, Fab } from '@/kvant';

const clients = [
  'Студия «Линия»',
  'Агентство «Север»',
  'Бюро «Форма»',
  'ИП Смирнова',
  'Кофейня «Зерно»',
  'Типография «Оттиск»',
  'Школа «Слово»',
  'Мастерская «Дерево»',
  'Клиника «Мята»',
  'Салон «Лён»',
  'Пекарня «Хлеб и соль»',
  'Студия йоги «Прана»',
  'Фотостудия «Кадр»',
  'Цветочная «Пион»',
  'Ателье «Нить»',
  'Автосервис «Ключ»',
  'Студия звука «Тон»',
  'Бюро переводов «Слог»',
  'Кейтеринг «Стол»',
  'Агентство «Маяк»',
  'Магазин «Полка»',
  'Детский центр «Кубик»',
  'Клининг «Блеск»',
  'Архитекторы «Ось»',
  'Ветклиника «Лапа»',
  'Студия дизайна «Шрифт»',
  'Барбершоп «Бритва»',
  'Логистика «Вектор»',
  'Юристы «Право»',
  'Ресторан «Печь»',
  'Мебель «Угол»',
  'Отель «Причал»',
];

export default function BackToTopPhone() {
  const root = useRef<HTMLDivElement>(null);
  return (
    <div className="relative h-[640px] w-[375px] max-w-full overflow-hidden rounded-4xl bg-background shadow-[0_0_0_1px_var(--color-hairline)]">
      <div ref={root} className="h-full overflow-y-auto px-5 pt-14 pb-24">
        <h1 className="pb-3 text-heading-lg font-semibold text-fg-1">Клиенты</h1>
        <ul className="flex flex-col gap-3">
          {clients.map((name) => (
            <li key={name} className="flex h-16 items-center rounded-lg bg-surface-1 px-4 text-label-lg font-medium text-fg-1 shadow-[0_0_0_1px_var(--color-hairline)]">
              {name}
            </li>
          ))}
        </ul>
      </div>
      {/* Below 640 `fab` puts it here by itself; the docs frame is wider, so the phone corner is set by style. */}
      <BackToTop root={root} fab style={{ right: 24, bottom: 84 }} className="[&_[data-slot=back-to-top-button]]:size-10" />
      <Fab icon={<Plus />} label="Новый клиент" className="absolute right-4 bottom-4" />
    </div>
  );
}
