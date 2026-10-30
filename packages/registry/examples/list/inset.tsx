import { Bell, Mail, MessageCircle } from 'lucide-react';
import { List, ListItem, Switch } from '@/kvant';

export default function ListInset() {
  return (
    <List
      variant="inset"
      header="Уведомления"
      footer="Сводка приходит по понедельникам в 9:00 по Москве."
      className="w-full max-w-sm"
    >
      <ListItem leading={<Bell />} title="Новые сделки" control={<Switch size="lg" defaultChecked />} />
      <ListItem leading={<MessageCircle />} title="Упоминания в комментариях" control={<Switch size="lg" />} />
      <ListItem leading={<Mail />} title="Сводка на почту" value="Еженедельно" chevron onClick={() => {}} />
    </List>
  );
}
