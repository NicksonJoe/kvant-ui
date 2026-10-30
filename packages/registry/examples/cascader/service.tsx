import { useState } from 'react';
import { Cascader, type CascaderOption } from '@/kvant';

const leaves = (...labels: string[]) => labels.map((label) => ({ value: label.toLowerCase(), label }));

const services: readonly CascaderOption[] = [
  {
    value: 'design',
    label: 'Дизайн',
    children: [
      { value: 'branding', label: 'Брендинг', children: leaves('Логотип', 'Фирменный стиль', 'Брендбук', 'Нейминг') },
      { value: 'ui', label: 'Интерфейсы', children: leaves('Сайт', 'Приложение', 'Дизайн-система') },
      { value: 'print', label: 'Полиграфия', children: leaves('Каталог', 'Визитки', 'Наружная реклама') },
      { value: 'package', label: 'Упаковка', children: leaves('Этикетка', 'Коробка') },
    ],
  },
  { value: 'dev', label: 'Разработка', children: leaves('Лендинг', 'Интернет-магазин', 'Мобильное приложение') },
  { value: 'marketing', label: 'Маркетинг', children: leaves('Контекстная реклама', 'Соцсети', 'Рассылки') },
  { value: 'video', label: 'Видеопродакшн', children: leaves('Рекламный ролик', 'Анимация', 'Съёмка мероприятия') },
];

export default function CascaderService() {
  const [path, setPath] = useState<readonly string[]>(['design', 'branding', 'фирменный стиль']);
  return (
    <div className="flex w-104 max-w-full flex-col gap-1.5">
      <span className="text-label-sm font-medium text-fg-2">Услуга</span>
      <Cascader aria-label="Услуга" options={services} value={path} onValueChange={setPath} />
    </div>
  );
}
