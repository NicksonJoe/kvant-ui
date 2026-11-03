import { TransferList, type TransferItem } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const people: TransferItem[] = [
  { id: 'smirnov', label: 'Алексей Смирнов', description: 'Владелец воронки', locked: true },
  { id: 'kim', label: 'Мария Ким', description: 'Бухгалтерия' },
  { id: 'belova', label: 'Тамара Белова', description: 'Логистика' },
  { id: 'lebedev', label: 'Олег Лебедев', description: 'Продажи · опт' },
  { id: 'petrov', label: 'Игорь Петров', description: 'Закупки' },
  { id: 'volkova', label: 'Ирина Волкова', description: 'Приглашение не принято', disabled: true },
];

const playground: Playground = {
  initial: { searchPlaceholder: 'Имя или отдел' },
  render: (p) => (
    <TransferList
      items={people}
      titles={['Сотрудники', 'Имеют доступ']}
      defaultValue={['smirnov', 'petrov']}
      searchPlaceholder={p.text('searchPlaceholder')}
      rows={p.pick('rows', [4, 6, 8] as const)}
      loading={p.bool('loading')}
      disabled={p.bool('disabled')}
      movedText={p.text('movedText')}
      className="w-full"
    />
  ),
  code: (p) => `<TransferList items={people} titles={['Сотрудники', 'Имеют доступ']}${p.attrs(['searchPlaceholder', 'rows', 'loading', 'disabled', 'movedText'])} />`,
};

export default playground;
