import { ChartColumn, House, Users } from 'lucide-react';
import { Sidebar, SidebarItem, SidebarSection } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <div className="h-72 overflow-hidden rounded-xl shadow-raised">
      <Sidebar collapsed={p.bool('collapsed')}>
        <SidebarSection label="Разделы">
          <SidebarItem href="#home" icon={<House />} label="Обзор" />
          <SidebarItem href="#deals" icon={<ChartColumn />} label="Сделки" count={24} active />
          <SidebarItem href="#clients" icon={<Users />} label="Клиенты" count={318} />
        </SidebarSection>
      </Sidebar>
    </div>
  ),
  code: (p) => `<Sidebar${p.attrs(['collapsed'])}>
  <SidebarSection label="Разделы">
    <SidebarItem href="/" icon={<House />} label="Обзор" />
    <SidebarItem href="/deals" icon={<ChartColumn />} label="Сделки" count={24} active />
    <SidebarItem href="/clients" icon={<Users />} label="Клиенты" count={318} />
  </SidebarSection>
</Sidebar>`,
};

export default playground;
