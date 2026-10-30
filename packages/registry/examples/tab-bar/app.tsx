import { House, LayoutGrid, Mail, Search, Users } from 'lucide-react';
import { useState, type MouseEvent } from 'react';
import { Avatar, List, ListItem, TabBar, TabBarAction, TabBarItem } from '@/kvant';

const tabs = [
  { id: 'home', label: 'Сводка', icon: <House /> },
  { id: 'deals', label: 'Сделки', icon: <LayoutGrid /> },
  { id: 'clients', label: 'Клиенты', icon: <Users /> },
  { id: 'inbox', label: 'Входящие', icon: <Mail />, count: 4 },
];

const deals = [
  { client: '«Студия Север»', title: 'Сайт и брендинг', amount: '184 000 ₽' },
  { client: '«Орбита Лаб»', title: 'Приложение для iOS', amount: '1 240 000 ₽' },
  { client: 'Полюс', title: 'Редизайн CRM', amount: '320 000 ₽' },
  { client: 'Меридиан', title: 'Поддержка сайта', amount: '48 000 ₽' },
];

export default function TabBarApp() {
  const [active, setActive] = useState('deals');
  const open = (id: string) => (event: MouseEvent) => {
    event.preventDefault();
    setActive(id);
  };

  return (
    <div className="relative h-[560px] w-full max-w-[402px] overflow-hidden rounded-[36px] bg-background shadow-raised">
      <div className="h-full overflow-y-auto px-4 pt-4 pb-28">
        <List variant="inset">
          {deals.map((deal) => (
            <ListItem key={deal.client} leading={<Avatar name={deal.client.replace(/[«»]/g, '')} size={40} />} title={deal.client} subtitle={deal.title} value={deal.amount} />
          ))}
        </List>
      </div>
      <TabBar aria-label="Разделы приложения" className="absolute inset-x-4 bottom-5" action={<TabBarAction icon={<Search />} aria-label="Поиск" />}>
        {tabs.map(({ id, ...tab }) => (
          <TabBarItem key={id} href={`#${id}`} {...tab} active={active === id} onClick={open(id)} />
        ))}
      </TabBar>
    </div>
  );
}
