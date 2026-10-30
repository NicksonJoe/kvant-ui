import { Eye, Shield, Users } from 'lucide-react';
import { Listbox, type ListboxOption } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const roles: readonly ListboxOption<'owner' | 'manager' | 'viewer'>[] = [
  { value: 'owner', label: 'Владелец', description: 'Полный доступ, оплата и удаление', icon: <Shield /> },
  { value: 'manager', label: 'Менеджер', description: 'Сделки, клиенты и отчёты команды', icon: <Users /> },
  { value: 'viewer', label: 'Наблюдатель', description: 'Только просмотр, без экспорта', icon: <Eye /> },
];

const playground: Playground = {
  render: (p) =>
    p.bool('multiple') ? (
      <Listbox multiple aria-label="Роли" options={roles} defaultValue={['manager']} disabled={p.bool('disabled')} emptyText={p.text('emptyText')} className="w-80 max-w-full" />
    ) : (
      <Listbox aria-label="Роль" options={roles} defaultValue="manager" disabled={p.bool('disabled')} emptyText={p.text('emptyText')} className="w-80 max-w-full" />
    ),
  code: (p) => `<Listbox
  aria-label="Роль"${p.attrs(['multiple', 'disabled', 'emptyText'])}
  defaultValue=${p.bool('multiple') ? "{['manager']}" : '"manager"'}
  options={[
    { value: 'owner', label: 'Владелец', description: 'Полный доступ, оплата и удаление', icon: <Shield /> },
    { value: 'manager', label: 'Менеджер', description: 'Сделки, клиенты и отчёты команды', icon: <Users /> },
    { value: 'viewer', label: 'Наблюдатель', description: 'Только просмотр, без экспорта', icon: <Eye /> },
  ]}
/>`,
};

export default playground;
