import { NotificationCenter, type NotificationItem } from '@/kvant';

const items: NotificationItem[] = [
  { id: 'lead', group: 'Вчера', title: 'Новая заявка из Telegram от Марины Ким', meta: '18:42' },
  { id: 'act', group: '28 октября', title: 'Клиент подписал акт № 318', meta: '14:05 · Диадок' },
];

export default function NotificationCenterRead() {
  return <NotificationCenter items={items} />;
}
