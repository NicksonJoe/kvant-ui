import { Eye, Link, Shield, User, Users } from 'lucide-react';
import { useId } from 'react';
import { Listbox, type ListboxOption } from '@/kvant';

type Role = 'owner' | 'manager' | 'viewer' | 'contractor' | 'client';

const roles: readonly ListboxOption<Role>[] = [
  { value: 'owner', label: 'Владелец', description: 'Полный доступ, оплата и удаление пространства', icon: <Shield />, group: 'Команда студии' },
  { value: 'manager', label: 'Менеджер', description: 'Сделки, клиенты и отчёты своей команды', icon: <Users />, group: 'Команда студии' },
  { value: 'viewer', label: 'Наблюдатель', description: 'Только просмотр, без экспорта', icon: <Eye />, group: 'Команда студии' },
  { value: 'contractor', label: 'Подрядчик', description: 'Видит только проекты, куда его добавили', icon: <Link />, group: 'Внешние участники' },
  {
    value: 'client',
    label: 'Клиент',
    description: 'Появится вместе с личным кабинетом клиента',
    icon: <User />,
    group: 'Внешние участники',
    disabled: true,
  },
];

export default function ListboxRoles() {
  const id = useId();
  return (
    <div className="flex w-104 max-w-full flex-col gap-1.5">
      <span id={id} className="text-label-sm font-medium text-fg-2">
        Роль в пространстве
      </span>
      <Listbox aria-labelledby={id} options={roles} defaultValue="manager" />
    </div>
  );
}
