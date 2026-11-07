import { CircleCheck, House, LayoutGrid, Users } from 'lucide-react';
import { useState, type MouseEvent } from 'react';
import { AgentAvatar, TabBar, TabBarCenter, TabBarItem } from '@/kvant';

const left = [
  { id: 'home', label: 'Сводка', icon: <House /> },
  { id: 'deals', label: 'Сделки', icon: <LayoutGrid /> },
];
const right = [
  { id: 'tasks', label: 'Задачи', icon: <CircleCheck /> },
  { id: 'clients', label: 'Клиенты', icon: <Users /> },
];

/** Norda on the phone: the agent's face sits in the middle of the bar, between the sections. */
export default function TabBarAgent() {
  const [active, setActive] = useState('home');
  const open = (id: string) => (event: MouseEvent) => {
    event.preventDefault();
    setActive(id);
  };
  const item = ({ id, ...tab }: (typeof left)[number]) => <TabBarItem key={id} href={`#${id}`} {...tab} active={active === id} onClick={open(id)} />;

  return (
    <div className="relative h-[200px] w-full max-w-[402px] overflow-hidden rounded-[36px] bg-background shadow-raised">
      <TabBar aria-label="Разделы приложения" className="absolute inset-x-4 bottom-5">
        {left.map(item)}
        <TabBarCenter aria-label="Агент Норды">
          <AgentAvatar size={56} />
        </TabBarCenter>
        {right.map(item)}
      </TabBar>
    </div>
  );
}
