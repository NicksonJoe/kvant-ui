import { Bell, Calendar, Folder, Globe, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Avatar, List, ListItem, Switch } from '@/kvant';

export default function ListSettings() {
  const [digest, setDigest] = useState(true);

  return (
    <List className="w-full max-w-md">
      <ListItem leading={<Folder />} title="Проекты студии" href="#projects" />
      <ListItem leading={<Avatar name="Анна Северова" size={32} />} title="Анна Северова" subtitle="Аккаунт-менеджер · anna@norda.ru" value="Владелец" />
      <ListItem leading={<Bell />} title="Уведомления о новых сделках" control={<Switch defaultChecked />} />
      <ListItem leading={<Globe />} title="Валюта отчётов" value="Рубль, ₽" chevron onClick={() => {}} />
      <ListItem leading={<Calendar />} title="Еженедельная сводка" selected={digest} onClick={() => setDigest((on) => !on)} />
      <ListItem leading={<Trash2 />} title="Удалить рабочее пространство" destructive onClick={() => {}} />
    </List>
  );
}
