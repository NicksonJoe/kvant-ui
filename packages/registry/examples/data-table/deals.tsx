import { Archive, ChevronDown, Ellipsis, LayoutGrid, List, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  IconButton,
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  SegmentedControl,
  Tag,
  type BadgeTone,
  type DataTableColumn,
} from '@/kvant';

interface Deal {
  id: string;
  title: string;
  client: string;
  stage: 'Квалификация' | 'Бриф' | 'Переговоры' | 'Договор' | 'Счёт выставлен';
  owner: string;
  amount: number;
  closing: string;
  overdue?: boolean;
}

const deals: Deal[] = [
  { id: 'd1', title: 'Айдентика и сайт', client: '«Студия Север»', stage: 'Переговоры', owner: 'Анна Северова', amount: 1_284_900, closing: '14.11.2026' },
  { id: 'd2', title: 'Иллюстрации к книге', client: '«Издательство Полка»', stage: 'Договор', owner: 'Вера Лебедева', amount: 960_000, closing: '02.12.2026' },
  { id: 'd3', title: 'Сайт и CRM-интеграция', client: '«Орбита Лаб»', stage: 'Переговоры', owner: 'Илья Громов', amount: 640_000, closing: '21.11.2026' },
  { id: 'd4', title: 'Презентация для инвесторов', client: '«Полярный свет»', stage: 'Квалификация', owner: 'Пётр Ильин', amount: 412_000, closing: '05.12.2026' },
  { id: 'd5', title: 'Анимация логотипа', client: '«Студия Север»', stage: 'Счёт выставлен', owner: 'Анна Северова', amount: 312_500, closing: '08.11.2026' },
  { id: 'd6', title: 'Упаковка для линейки чая', client: '«Чайная лавка»', stage: 'Бриф', owner: 'Илья Громов', amount: 286_000, closing: '15.12.2026' },
  { id: 'd7', title: 'Фирменный стиль кафе', client: '«Зерно и пар»', stage: 'Переговоры', owner: 'Вера Лебедева', amount: 240_000, closing: '30.11.2026' },
  { id: 'd8', title: 'Обложки для подкаста', client: '«Тихий эфир»', stage: 'Договор', owner: 'Пётр Ильин', amount: 168_000, closing: '19.11.2026' },
  { id: 'd9', title: 'Баннеры к распродаже', client: '«Маркет 24»', stage: 'Счёт выставлен', owner: 'Анна Северова', amount: 124_000, closing: '25.10.2026', overdue: true },
  { id: 'd10', title: 'Иконки для приложения', client: '«Орбита Лаб»', stage: 'Договор', owner: 'Илья Громов', amount: 96_000, closing: '12.12.2026' },
  { id: 'd11', title: 'Сайт для пекарни', client: '«Колос»', stage: 'Бриф', owner: 'Вера Лебедева', amount: 184_000, closing: '18.12.2026' },
  { id: 'd12', title: 'Ребрендинг «Литеры»', client: '«Литера»', stage: 'Квалификация', owner: 'Пётр Ильин', amount: 720_000, closing: '22.12.2026' },
];

const stageTone: Record<Deal['stage'], BadgeTone> = {
  Квалификация: 'neutral',
  Бриф: 'neutral',
  Переговоры: 'info',
  Договор: 'success',
  'Счёт выставлен': 'warning',
};

const rub = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;

const columns: readonly DataTableColumn<Deal>[] = [
  { id: 'title', header: 'Сделка', cell: (deal) => <span className="font-medium">{deal.title}</span>, sortValue: (deal) => deal.title },
  { id: 'client', header: 'Клиент', cell: (deal) => <span className="text-fg-2">{deal.client}</span> },
  { id: 'stage', header: 'Этап', cell: (deal) => <Badge tone={stageTone[deal.stage]}>{deal.stage}</Badge> },
  {
    id: 'owner',
    header: 'Ответственный',
    cell: (deal) => (
      <span className="flex items-center gap-2 whitespace-nowrap">
        <Avatar name={deal.owner} size={24} />
        {deal.owner}
      </span>
    ),
  },
  { id: 'amount', header: 'Сумма', numeric: true, cell: (deal) => rub(deal.amount), sortValue: (deal) => deal.amount },
  {
    id: 'closing',
    header: 'Закрытие',
    cell: (deal) => <span className={deal.overdue ? 'text-danger-soft-fg' : 'text-fg-2'}>{deal.closing}</span>,
  },
];

export default function DataTableDeals() {
  const [query, setQuery] = useState('');
  const [onlyActive, setOnlyActive] = useState(true);
  const [view, setView] = useState<'table' | 'board'>('table');
  const needle = query.trim().toLocaleLowerCase('ru');
  const rows = deals.filter(
    (deal) =>
      (!needle || `${deal.title} ${deal.client}`.toLocaleLowerCase('ru').includes(needle)) &&
      (!onlyActive || deal.stage !== 'Квалификация'),
  );

  return (
    <DataTable
      aria-label="Сделки"
      className="w-full"
      rows={rows}
      columns={columns}
      getRowId={(deal) => deal.id}
      rowLabel={(deal) => deal.title}
      selectable
      defaultSelected={['d2', 'd3', 'd5']}
      defaultSort={{ column: 'amount', direction: 'descending' }}
      pageSize={6}
      toolbar={
        <>
          <Input
            size="sm"
            aria-label="Поиск по сделкам"
            placeholder="Поиск по сделкам"
            prefix={<Search />}
            kbd="/"
            value={query}
            onValueChange={setQuery}
            onClear={() => setQuery('')}
            className="w-full sm:w-65"
          />
          {onlyActive ? (
            <Tag selected size="md" onRemove={() => setOnlyActive(false)} removeLabel="Убрать фильтр «в работе»">
              Статус: в работе
            </Tag>
          ) : null}
          <Button variant="secondary" size="sm" trailingIcon={<ChevronDown />}>
            Ответственный
          </Button>
          <Button variant="ghost" size="sm" leadingIcon={<Plus />} onClick={() => setOnlyActive(true)}>
            Фильтр
          </Button>
          <div className="flex-1" />
          <SegmentedControl
            aria-label="Вид"
            value={view}
            onValueChange={setView}
            options={[
              { value: 'table', label: <><List className="size-4" aria-hidden />Таблица</> },
              { value: 'board', label: <><LayoutGrid className="size-4" aria-hidden />Канбан</> },
            ]}
          />
          <Button size="sm" leadingIcon={<Plus />}>
            Новая сделка
          </Button>
        </>
      }
      rowActions={(deal) => (
        <Menu>
          <MenuTrigger render={<IconButton size="xs" icon={<Ellipsis />} aria-label={`Действия: ${deal.title}`} />} />
          <MenuContent align="end">
            <MenuItem>Открыть</MenuItem>
            <MenuItem>Дублировать</MenuItem>
            <MenuItem destructive>Удалить</MenuItem>
          </MenuContent>
        </Menu>
      )}
      bulkActions={(_ids, clear) => (
        <>
          <Button variant="ghost" leadingIcon={<Archive />} onClick={clear}>
            Архив
          </Button>
          <Button variant="danger-soft" leadingIcon={<Trash2 />} onClick={clear}>
            Удалить
          </Button>
        </>
      )}
    />
  );
}
