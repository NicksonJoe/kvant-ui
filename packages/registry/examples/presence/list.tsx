import { Plus, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import { Avatar, Button, IconButton, Presence } from '@/kvant';

interface Visit {
  id: number;
  name: string;
  service: string;
  time: string;
  /** Added after the first show: grows in place instead of the cascade. */
  added?: boolean;
  removed?: boolean;
}

const day: Visit[] = [
  { id: 1, name: 'Анна Соколова', service: 'Стрижка и укладка', time: '10:00' },
  { id: 2, name: 'Мария Ветрова', service: 'Окрашивание', time: '11:30' },
  { id: 3, name: 'Ирина Лебедева', service: 'Маникюр', time: '13:00' },
  { id: 4, name: 'Ольга Миронова', service: 'Укладка', time: '15:30' },
  { id: 5, name: 'Елена Котова', service: 'Педикюр', time: '17:00' },
];

export default function PresenceList() {
  const [visits, setVisits] = useState(day);
  const [shown, setShown] = useState(0);

  return (
    <div className="flex w-full max-w-96 flex-col gap-3">
      <div className="flex flex-col rounded-xl bg-surface-1 px-5 pt-4 pb-2 shadow-raised">
        <span className="text-label-sm text-fg-3">Сегодня, 29 октября</span>
        {/* a new key replays the first show */}
        <ul key={shown} className="flex flex-col">
          {visits.map((visit, index) => (
            <Presence
              key={visit.id}
              render={<li className="group/row" />}
              present={!visit.removed}
              motion={visit.added ? 'collapse' : 'rise'}
              index={index}
              onExitComplete={() => setVisits((current) => current.filter((item) => item.id !== visit.id))}
            >
              <div className="flex h-14 items-center gap-3 border-b border-separator group-last/row:border-b-0">
                <Avatar name={visit.name} size={32} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-label-md font-medium text-fg-1">{visit.name}</span>
                  <span className="text-body-xs text-fg-3">{visit.service}</span>
                </div>
                <time className="text-body-sm text-fg-2">{visit.time}</time>
                <IconButton
                  aria-label={`Отменить запись: ${visit.name}`}
                  icon={<X />}
                  size="xs"
                  onClick={() => setVisits((current) => current.map((item) => (item.id === visit.id ? { ...item, removed: true } : item)))}
                />
              </div>
            </Presence>
          ))}
        </ul>
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<Plus />}
          onClick={() => setVisits((current) => [{ id: Date.now(), name: 'Новая запись', service: 'Консультация', time: '09:00', added: true }, ...current])}
        >
          Добавить
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<RotateCcw />}
          onClick={() => {
            setVisits(day);
            setShown((value) => value + 1);
          }}
        >
          Показать снова
        </Button>
      </div>
    </div>
  );
}
