import { Cascader, type CascaderOption } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const services: readonly CascaderOption[] = [
  {
    value: 'design',
    label: 'Дизайн',
    children: [
      { value: 'branding', label: 'Брендинг', children: [{ value: 'logo', label: 'Логотип' }, { value: 'identity', label: 'Фирменный стиль' }] },
      { value: 'ui', label: 'Интерфейсы', children: [{ value: 'site', label: 'Сайт' }, { value: 'app', label: 'Приложение' }] },
    ],
  },
  { value: 'dev', label: 'Разработка', children: [{ value: 'frontend', label: 'Фронтенд' }, { value: 'backend', label: 'Бэкенд' }] },
];

const playground: Playground = {
  render: (p) => (
    <Cascader
      aria-label="Услуга"
      options={services}
      placeholder={p.text('placeholder')}
      size={p.pick('size', ['sm', 'md', 'lg'] as const)}
      disabled={p.bool('disabled')}
      className="w-80 max-w-full"
    />
  ),
  code: (p) => `<Cascader
  aria-label="Услуга"${p.attrs(['placeholder', 'size', 'disabled'])}
  options={[
    {
      value: 'design',
      label: 'Дизайн',
      children: [
        { value: 'branding', label: 'Брендинг', children: [{ value: 'logo', label: 'Логотип' }, { value: 'identity', label: 'Фирменный стиль' }] },
        { value: 'ui', label: 'Интерфейсы', children: [{ value: 'site', label: 'Сайт' }, { value: 'app', label: 'Приложение' }] },
      ],
    },
    { value: 'dev', label: 'Разработка', children: [{ value: 'frontend', label: 'Фронтенд' }, { value: 'backend', label: 'Бэкенд' }] },
  ]}
/>`,
};

export default playground;
