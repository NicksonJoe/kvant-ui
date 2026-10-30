import { Bell, PanelLeft, Search } from 'lucide-react';
import { Avatar, Breadcrumb, IconButton, Input, Topbar } from '@/kvant';

export default function BreadcrumbTopbar() {
  return (
    <Topbar className="w-full">
      <IconButton size="sm" icon={<PanelLeft />} aria-label="Свернуть меню" />
      <Breadcrumb
        items={[
          { label: 'Продажи', href: '#sales' },
          { label: 'Сделки', href: '#deals' },
          { label: '«Студия Север» — сайт и брендинг' },
        ]}
      />
      <div className="flex-1" />
      <Input size="sm" aria-label="Поиск по CRM" placeholder="Поиск по CRM" prefix={<Search />} kbd="⌘K" className="w-56 max-md:hidden" />
      <IconButton size="sm" icon={<Bell />} aria-label="Уведомления" />
      <Avatar name="Анна Северова" size={28} />
    </Topbar>
  );
}
