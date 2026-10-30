import { House, LayoutGrid, Mail, Search, Users } from 'lucide-react';
import { TabBar, TabBarAction, TabBarItem } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  controls: [{ name: 'search', type: 'boolean', default: true, description: 'Круг поиска справа.' }],
  render: (p) => (
    <TabBar
      aria-label="Разделы приложения"
      minimized={p.bool('minimized')}
      className="w-full max-w-[370px]"
      action={p.bool('search') ? <TabBarAction icon={<Search />} aria-label="Поиск" /> : undefined}
    >
      <TabBarItem href="#home" icon={<House />} label="Сводка" />
      <TabBarItem href="#deals" icon={<LayoutGrid />} label="Сделки" active />
      <TabBarItem href="#clients" icon={<Users />} label="Клиенты" />
      <TabBarItem href="#inbox" icon={<Mail />} label="Входящие" count={4} />
    </TabBar>
  ),
  code: (p) => `<TabBar aria-label="Разделы приложения"${p.attrs(['minimized'])}${p.bool('search') ? ' action={<TabBarAction icon={<Search />} aria-label="Поиск" />}' : ''}>
  <TabBarItem href="/" icon={<House />} label="Сводка" />
  <TabBarItem href="/deals" icon={<LayoutGrid />} label="Сделки" active />
  <TabBarItem href="/clients" icon={<Users />} label="Клиенты" />
  <TabBarItem href="/inbox" icon={<Mail />} label="Входящие" count={4} />
</TabBar>`,
};

export default playground;
