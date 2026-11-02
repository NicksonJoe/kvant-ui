import { Clock, RussianRuble } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Avatar, Button, NotificationCenter, NotificationCenterLink, type NotificationItem } from '@/kvant';

const systemIcon = (icon: ReactNode, tone: string) => (
  <span className={`grid size-8 place-items-center rounded-full [&_svg]:size-4 [&_svg]:stroke-[1.75] ${tone}`}>{icon}</span>
);

const initial: NotificationItem[] = [
  {
    id: 'mention',
    group: 'Сегодня',
    leading: <Avatar name="Вера Ланская" />,
    title: (
      <>
        <b className="font-semibold">Вера Ланская</b> упомянула вас в сделке <b className="font-semibold">«Сайт для Орбита Лаб»</b>
      </>
    ),
    quote: 'Анна, клиент просит перенести созвон на четверг',
    meta: '5 мин назад',
    unread: true,
    mention: true,
  },
  {
    id: 'payment',
    group: 'Сегодня',
    leading: systemIcon(<RussianRuble aria-hidden />, 'bg-success-soft text-success-soft-fg'),
    title: (
      <>
        Оплачен <b className="font-semibold">счёт № 312</b> на 48 000 ₽ от «Студии Север»
      </>
    ),
    meta: '28 мин назад · Т-Банк',
    unread: true,
  },
  {
    id: 'task',
    group: 'Сегодня',
    leading: <Avatar name="Илья Орлов" />,
    title: (
      <>
        <b className="font-semibold">Илья Орлов</b> назначил вам задачу «Подготовить КП» со сроком до пятницы
      </>
    ),
    meta: '2 ч назад · «Брендбук для Кофе Лаб»',
    unread: true,
    actions: <Button size="xs">Принять</Button>,
  },
  {
    id: 'deadline',
    group: 'Вчера',
    leading: systemIcon(<Clock aria-hidden />, 'bg-warning-soft text-warning-soft-fg'),
    title: 'Срок по сделке «Брендбук для Кофе Лаб» истекает 2 ноября',
    meta: '09:00',
  },
];

export default function NotificationCenterTopbar() {
  const [items, setItems] = useState(initial);
  return (
    <div className="flex w-full max-w-md items-center justify-between rounded-xl bg-surface-1 px-4 py-2 shadow-raised">
      <span className="text-label-md font-medium text-fg-1">Сделки</span>
      <NotificationCenter
        items={items}
        onMarkAllRead={() => setItems((list) => list.map((item) => ({ ...item, unread: false })))}
        onItemClick={(id) => setItems((list) => list.map((item) => (item.id === id ? { ...item, unread: false } : item)))}
        footer={<NotificationCenterLink href="#inbox" />}
      />
    </div>
  );
}
