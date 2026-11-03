import { Archive, Link2, Pin, Share2 } from 'lucide-react';
import { Avatar, FocusGroup, IconButton, cn, focusRing } from '@/kvant';

const clients = [
  { name: 'Анна Соколова', note: 'Стрижка и укладка' },
  { name: 'Мария Ветрова', note: 'Окрашивание' },
  { name: 'Ирина Лебедева', note: 'Маникюр' },
];

export default function FocusManagementGroup() {
  return (
    <div className="flex w-full max-w-96 flex-col overflow-hidden rounded-xl bg-surface-1 shadow-raised">
      <div className="flex items-center justify-between gap-3 border-b border-separator px-4 py-2">
        <span className="text-label-md font-medium text-fg-1">Сегодня, 29 октября</span>
        <FocusGroup aria-label="Действия со списком" className="flex gap-1">
          <IconButton aria-label="Закрепить" icon={<Pin />} size="sm" />
          <IconButton aria-label="Поделиться" icon={<Share2 />} size="sm" />
          <IconButton aria-label="Скопировать ссылку" icon={<Link2 />} size="sm" />
          <IconButton aria-label="В архив" icon={<Archive />} size="sm" disabled />
        </FocusGroup>
      </div>
      <FocusGroup aria-label="Клиенты" orientation="vertical" className="flex flex-col">
        {clients.map((client) => (
          <button
            key={client.name}
            type="button"
            className={cn('flex items-center gap-3 px-4 py-2.5 text-left not-last:border-b not-last:border-separator hover:bg-fill-1', focusRing.inset)}
          >
            <Avatar name={client.name} size={32} />
            <span className="flex flex-col">
              <span className="text-label-md font-medium text-fg-1">{client.name}</span>
              <span className="text-body-xs text-fg-3">{client.note}</span>
            </span>
          </button>
        ))}
      </FocusGroup>
    </div>
  );
}
