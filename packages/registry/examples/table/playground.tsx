import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <Table density={p.pick('density', ['compact', 'comfortable', 'touch'] as const)} containerClassName="w-full max-w-xl">
      <TableHeader>
        <TableRow>
          <TableHead>Сделка</TableHead>
          <TableHead numeric>Сумма</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Айдентика для пекарни</TableCell>
          <TableCell numeric>1 284 900 ₽</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Сайт для яхт-клуба</TableCell>
          <TableCell numeric>860 000 ₽</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  code: (p) => `<Table${p.attrs(['density'])}>
  <TableHeader>
    <TableRow>
      <TableHead>Сделка</TableHead>
      <TableHead numeric>Сумма</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Айдентика для пекарни</TableCell>
      <TableCell numeric>1 284 900 ₽</TableCell>
    </TableRow>
  </TableBody>
</Table>`,
};

export default playground;
