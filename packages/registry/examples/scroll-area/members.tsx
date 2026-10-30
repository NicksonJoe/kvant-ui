import { Avatar, Badge, ScrollArea } from '@/kvant';

const members = [
  ['Алина Смирнова', 'Руководитель'],
  ['Борис Ким', 'Дизайнер'],
  ['Вера Ланская', 'Менеджер'],
  ['Глеб Орлов', 'Разработчик'],
  ['Дина Мухина', 'Копирайтер'],
  ['Егор Белов', 'Аналитик'],
  ['Жанна Тарасова', 'Бухгалтер'],
  ['Илья Соколов', 'Тестировщик'],
];

export default function ScrollAreaMembers() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2 rounded-xl bg-surface-1 py-4 shadow-raised">
      <h3 className="flex items-center gap-2 px-4 text-label-md font-semibold text-fg-1">
        Участники проекта <Badge>{members.length}</Badge>
      </h3>
      <ScrollArea className="h-56">
        <ul className="flex flex-col px-4">
          {members.map(([name, role]) => (
            <li key={name} className="flex h-11 items-center gap-3 text-body-sm">
              <Avatar name={name ?? ''} size={28} />
              <span className="min-w-0 flex-1 truncate font-medium text-fg-1">{name}</span>
              <span className="text-fg-3">{role}</span>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
