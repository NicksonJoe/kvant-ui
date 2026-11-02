import { NotificationCenter, type NotificationItem } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const items: NotificationItem[] = [
  { id: 'm', group: 'Сегодня', title: 'Вера упомянула вас в сделке «Сайт для Орбиты»', meta: '5 мин назад', unread: true, mention: true },
  { id: 'p', group: 'Сегодня', title: 'Оплачен счёт № 312 на 48 000 ₽', meta: '28 мин назад · Т-Банк', unread: true },
  { id: 'l', group: 'Вчера', title: 'Новая заявка из Telegram от Марины Ким', meta: '18:42' },
];

const playground: Playground = {
  render: () => <NotificationCenter items={items} onMarkAllRead={() => {}} />,
  code: () => `<NotificationCenter items={items} onMarkAllRead={markAllRead} footer={<NotificationCenterLink href="/inbox" />} />`,
};

export default playground;
