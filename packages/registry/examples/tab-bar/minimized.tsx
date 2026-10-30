import { House, LayoutGrid, Mail, Search, Users } from 'lucide-react';
import { useRef, useState } from 'react';
import { TabBar, TabBarAction, TabBarItem } from '@/kvant';

const rows = Array.from({ length: 14 }, (_, index) => `Сделка № 24-${String(117 + index)}`);

export default function TabBarMinimized() {
  const [minimized, setMinimized] = useState(false);
  const last = useRef(0);

  return (
    <div className="relative h-[480px] w-full max-w-[402px] overflow-hidden rounded-[36px] bg-background shadow-raised">
      <div
        className="h-full overflow-y-auto px-4 pt-4 pb-28"
        onScroll={(event) => {
          const top = event.currentTarget.scrollTop;
          // collapse while scrolling down, expand on the way back up
          if (Math.abs(top - last.current) > 4) setMinimized(top > last.current && top > 24);
          last.current = top;
        }}
      >
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row} className="rounded-lg bg-surface-1 px-4 py-3 text-body-sm shadow-raised">
              {row}
            </li>
          ))}
        </ul>
      </div>
      <TabBar
        aria-label="Разделы приложения"
        minimized={minimized}
        className="absolute inset-x-4 bottom-5"
        action={<TabBarAction icon={<Search />} aria-label="Поиск" />}
      >
        <TabBarItem href="#home" icon={<House />} label="Сводка" />
        <TabBarItem href="#deals" icon={<LayoutGrid />} label="Сделки" active />
        <TabBarItem href="#clients" icon={<Users />} label="Клиенты" />
        <TabBarItem href="#inbox" icon={<Mail />} label="Входящие" count={4} />
      </TabBar>
    </div>
  );
}
