import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { AppBar, AppBarActions, AppBarButton, Avatar, Input, List, ListItem } from '@/kvant';

const deals = [
  { client: '«Студия Север»', title: 'Сайт и брендинг', amount: '184 000 ₽' },
  { client: '«Орбита Лаб»', title: 'Приложение для iOS', amount: '1 240 000 ₽' },
  { client: 'Полюс', title: 'Редизайн CRM', amount: '320 000 ₽' },
  { client: 'Меридиан', title: 'Поддержка сайта', amount: '48 000 ₽' },
  { client: 'Литера', title: 'Ребрендинг', amount: '720 000 ₽' },
  { client: 'Колос', title: 'Сайт для пекарни', amount: '184 000 ₽' },
];

export default function TopbarIos() {
  const [scrolled, setScrolled] = useState(false);

  return (
    <div
      className="relative h-[560px] w-full max-w-[402px] overflow-y-auto rounded-[36px] bg-background shadow-raised"
      onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 8)}
    >
      <AppBar
        className="sticky top-0"
        title="Сделки"
        titleSize="large"
        scrolled={scrolled}
        trailing={
          <AppBarActions>
            <AppBarButton icon={<SlidersHorizontal />} aria-label="Фильтры" />
            <AppBarButton icon={<Plus />} aria-label="Новая сделка" />
          </AppBarActions>
        }
      >
        <Input aria-label="Поиск по сделкам" placeholder="Поиск по сделкам" prefix={<Search />} />
      </AppBar>
      <div className="px-4 pt-2 pb-6">
        <List variant="inset" header="Активные · 48">
          {deals.map((deal) => (
            <ListItem key={deal.client} leading={<Avatar name={deal.client.replace(/[«»]/g, '')} size={40} />} title={deal.client} subtitle={deal.title} value={deal.amount} />
          ))}
        </List>
      </div>
    </div>
  );
}
