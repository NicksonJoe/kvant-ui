import { ChartColumn, House, Inbox, Settings2, Users } from 'lucide-react';
import { Sidebar, SidebarFooter, SidebarItem, SidebarSection } from '@/kvant';

export default function SidebarCollapsed() {
  return (
    <div className="h-80 overflow-hidden rounded-xl shadow-raised">
      <Sidebar collapsed>
        <SidebarSection label="Разделы">
          <SidebarItem href="#home" icon={<House />} label="Обзор" shortcut="G O" />
          <SidebarItem href="#deals" icon={<ChartColumn />} label="Сделки" shortcut="G D" active />
          <SidebarItem href="#clients" icon={<Users />} label="Клиенты" shortcut="G C" />
          <SidebarItem href="#inbox" icon={<Inbox />} label="Входящие" />
        </SidebarSection>
        <SidebarFooter>
          <SidebarItem href="#settings" icon={<Settings2 />} label="Настройки" />
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
