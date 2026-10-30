import { Breadcrumb } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const path = [
  { label: 'Главная', href: '#home' },
  { label: 'Клиенты', href: '#clients' },
  { label: '«Студия Север»', href: '#clients/sever' },
  { label: 'Ребрендинг 2026', href: '#clients/sever/rebrand' },
  { label: 'Макеты логотипа' },
];

const playground: Playground = {
  render: (p) => <Breadcrumb items={path} max={p.pick('max', [3, 4, 5] as const)} />,
  code: (p) => `<Breadcrumb${p.attrs(['max'])}
  items={[
    { label: 'Главная', href: '/' },
    { label: 'Клиенты', href: '/clients' },
    { label: '«Студия Север»', href: '/clients/sever' },
    { label: 'Ребрендинг 2026', href: '/clients/sever/rebrand' },
    { label: 'Макеты логотипа' },
  ]}
/>`,
};

export default playground;
