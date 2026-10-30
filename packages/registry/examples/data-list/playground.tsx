import { DataList, DataListItem } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  controls: [{ name: 'copy', type: 'boolean', default: true, description: 'Кнопка «копировать» у ИНН.' }],
  render: (p) => (
    <DataList orientation={p.pick('orientation', ['horizontal', 'vertical'] as const)} className="w-full max-w-lg">
      <DataListItem label="Клиент">«Студия Север»</DataListItem>
      <DataListItem label="Сумма">1 284 900 ₽</DataListItem>
      <DataListItem label="ИНН" copyValue={p.bool('copy') ? '7704512386' : undefined}>
        7704512386
      </DataListItem>
    </DataList>
  ),
  code: (p) => `<DataList${p.attrs(['orientation'])}>
  <DataListItem label="Клиент">«Студия Север»</DataListItem>
  <DataListItem label="Сумма">1 284 900 ₽</DataListItem>
  <DataListItem label="ИНН"${p.bool('copy') ? ' copyValue="7704512386"' : ''}>7704512386</DataListItem>
</DataList>`,
};

export default playground;
