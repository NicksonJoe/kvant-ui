import { useState } from 'react';
import { Badge, Checkbox, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/kvant';

const clients = [
  { id: 'c1', name: 'Ольга Миронова', company: '«Хлебница»', status: 'Активный' },
  { id: 'c2', name: 'Игорь Лебедев', company: '«Парус»', status: 'Новый' },
  { id: 'c3', name: 'Дарья Ким', company: '«Листва»', status: 'Активный' },
];

export default function TableSelection() {
  const [selected, setSelected] = useState<readonly string[]>(['c2']);
  const toggle = (id: string, on: boolean) => setSelected((current) => (on ? [...current, id] : current.filter((item) => item !== id)));
  const all = selected.length === clients.length;

  return (
    <Table density="compact" containerClassName="w-full max-w-2xl">
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              aria-label="Выбрать всех"
              checked={all}
              indeterminate={selected.length > 0 && !all}
              onCheckedChange={(on) => setSelected(on ? clients.map((client) => client.id) : [])}
            />
          </TableHead>
          <TableHead>Клиент</TableHead>
          <TableHead>Компания</TableHead>
          <TableHead>Статус</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id} selected={selected.includes(client.id)}>
            <TableCell>
              <Checkbox
                aria-label={`Выбрать: ${client.name}`}
                checked={selected.includes(client.id)}
                onCheckedChange={(on) => toggle(client.id, on)}
              />
            </TableCell>
            <TableCell className="font-medium">{client.name}</TableCell>
            <TableCell className="text-fg-2">{client.company}</TableCell>
            <TableCell>
              <Badge tone={client.status === 'Новый' ? 'accent' : 'neutral'}>{client.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
