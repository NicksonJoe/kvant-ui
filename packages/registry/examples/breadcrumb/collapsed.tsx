import { House, Users } from 'lucide-react';
import { Breadcrumb } from '@/kvant';

export default function BreadcrumbCollapsed() {
  return (
    <Breadcrumb
      items={[
        { label: 'Главная', href: '#home', icon: <House /> },
        { label: 'Клиенты', href: '#clients', icon: <Users /> },
        { label: 'Литера', href: '#clients/litera' },
        { label: 'Проекты', href: '#clients/litera/projects' },
        { label: 'Ребрендинг 2026', href: '#clients/litera/projects/rebrand' },
        { label: 'Макеты логотипа' },
      ]}
    />
  );
}
