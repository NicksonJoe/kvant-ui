import { useState } from 'react';
import { Avatar, TransferList, type TransferItem } from '@/kvant';

const staff = [
  ['kim', 'Мария Ким', 'Бухгалтерия'],
  ['belova', 'Тамара Белова', 'Логистика'],
  ['lebedev', 'Олег Лебедев', 'Продажи · опт'],
  ['novikov', 'Дмитрий Новиков', 'Склад'],
  ['guseva', 'Екатерина Гусева', 'Маркетинг'],
  ['kuznetsova', 'Анна Кузнецова', 'Продажи · розница'],
  ['petrov', 'Игорь Петров', 'Закупки'],
  ['sokolova', 'Марина Соколова', 'Продажи · опт'],
] as const;

const people: TransferItem[] = [
  { id: 'smirnov', label: 'Алексей Смирнов', description: 'Владелец воронки', locked: true, avatar: <Avatar name="Алексей Смирнов" size={28} /> },
  ...staff.map(([id, label, description]) => ({ id, label, description, avatar: <Avatar name={label} size={28} /> })),
  { id: 'volkova', label: 'Ирина Волкова', description: 'Приглашение не принято', disabled: true, avatar: <Avatar name="Ирина Волкова" size={28} /> },
];

export default function TransferListAccess() {
  const [access, setAccess] = useState<string[]>(['smirnov', 'petrov', 'sokolova']);
  return (
    <TransferList
      items={people}
      titles={['Сотрудники', 'Имеют доступ']}
      searchPlaceholder="Имя или отдел"
      value={access}
      onValueChange={setAccess}
      movedText="Только что добавлен"
      className="w-full"
    />
  );
}
