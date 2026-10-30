import { Bell, Search } from 'lucide-react';
import { Avatar, CountBadge, IconButton, Input, Topbar, TopbarTitle } from '@/kvant';

export default function TopbarSection() {
  return (
    <Topbar className="w-full">
      <TopbarTitle>Сделки</TopbarTitle>
      <div className="flex-1" />
      <Input size="sm" aria-label="Поиск" placeholder="Поиск" prefix={<Search />} kbd="⌘K" className="w-56 max-sm:hidden" />
      <span className="relative">
        <IconButton size="sm" aria-label="Уведомления, 3 новых" icon={<Bell />} />
        <CountBadge count={3} className="absolute -top-1 -right-1" />
      </span>
      <Avatar name="Анна Северова" size={32} />
    </Topbar>
  );
}
