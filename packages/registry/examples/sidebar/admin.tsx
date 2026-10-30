import { ChartColumn, CreditCard, House, Inbox, PanelLeft, Settings2, Users } from 'lucide-react';
import { useState, type MouseEvent } from 'react';
import { IconButton, Sidebar, SidebarFooter, SidebarItem, SidebarSection } from '@/kvant';

const items = [
  { id: 'home', label: 'Обзор', icon: <House /> },
  { id: 'deals', label: 'Сделки', icon: <ChartColumn />, count: 24 },
  { id: 'clients', label: 'Клиенты', icon: <Users />, count: 318 },
  { id: 'inbox', label: 'Входящие', icon: <Inbox />, count: 5 },
  { id: 'billing', label: 'Оплаты', icon: <CreditCard /> },
];

export default function SidebarAdmin() {
  const [active, setActive] = useState('deals');
  const [collapsed, setCollapsed] = useState(false);
  const open = (id: string) => (event: MouseEvent) => {
    event.preventDefault();
    setActive(id);
  };

  return (
    <div className="flex h-96 overflow-hidden rounded-xl shadow-raised">
      <Sidebar collapsed={collapsed}>
        <SidebarSection label="Студия «Север»">
          {items.map(({ id, ...item }) => (
            <SidebarItem key={id} href={`#${id}`} {...item} active={active === id} onClick={open(id)} />
          ))}
        </SidebarSection>
        <SidebarFooter>
          <SidebarItem href="#settings" icon={<Settings2 />} label="Настройки" onClick={open('settings')} active={active === 'settings'} />
        </SidebarFooter>
      </Sidebar>
      <div className="flex w-40 items-start bg-surface-1 p-2 sm:w-64">
        <IconButton
          size="sm"
          aria-label={collapsed ? 'Развернуть панель' : 'Свернуть панель'}
          icon={<PanelLeft />}
          onClick={() => setCollapsed((value) => !value)}
        />
      </div>
    </div>
  );
}
