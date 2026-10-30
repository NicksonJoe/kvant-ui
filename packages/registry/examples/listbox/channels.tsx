import { Bell, Mail, MessageCircle, Send } from 'lucide-react';
import { Listbox, type ListboxOption } from '@/kvant';

type Channel = 'email' | 'telegram' | 'push' | 'sms';

const channels: readonly ListboxOption<Channel>[] = [
  { value: 'email', label: 'Почта', description: 'anna.sever@studio.ru', icon: <Mail /> },
  { value: 'telegram', label: 'Telegram', description: '@anna_sever', icon: <Send /> },
  { value: 'push', label: 'Пуш на телефон', description: 'iPhone Анны', icon: <Bell /> },
  { value: 'sms', label: 'СМС', description: 'Только срочное: просроченные оплаты', icon: <MessageCircle /> },
];

export default function ListboxChannels() {
  return <Listbox multiple aria-label="Каналы уведомлений" options={channels} defaultValue={['email', 'push']} className="w-80 max-w-full" />;
}
