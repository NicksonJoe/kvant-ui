import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, type SortDirection } from '@/kvant';

const deals = [
  { id: 'd1', title: 'Айдентика для пекарни', client: '«Хлебница»', amount: 1_284_900 },
  { id: 'd2', title: 'Сайт для яхт-клуба', client: '«Парус»', amount: 860_000 },
  { id: 'd3', title: 'Упаковка чайной линейки', client: '«Листва»', amount: 420_000 },
  { id: 'd4', title: 'Приложение для фитнес-клуба', client: '«Ока»', amount: 3_400_000 },
];
const rub = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });

export default function TableSorting() {
  const [sort, setSort] = useState<SortDirection>('descending');
  const rows = [...deals].sort((a, b) => (sort === 'ascending' ? a.amount - b.amount : sort === 'descending' ? b.amount - a.amount : 0));

  return (
    <Table containerClassName="w-full max-w-2xl">
      <TableHeader>
        <TableRow>
          <TableHead>Сделка</TableHead>
          <TableHead>Клиент</TableHead>
          <TableHead numeric sort={sort} onSort={() => setSort(sort === 'descending' ? 'ascending' : 'descending')}>
            Сумма
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((deal) => (
          <TableRow key={deal.id}>
            <TableCell className="font-medium">{deal.title}</TableCell>
            <TableCell className="text-fg-2">{deal.client}</TableCell>
            <TableCell numeric>{rub.format(deal.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
