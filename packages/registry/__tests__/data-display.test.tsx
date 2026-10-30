import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bell } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Accordion,
  AccordionItem,
  Carousel,
  CarouselSlide,
  CodeBlock,
  Collapsible,
  DataList,
  DataListItem,
  DataTable,
  DonutChart,
  KpiCard,
  LineChart,
  List,
  ListItem,
  Switch,
  Timeline,
  TimelineDay,
  TimelineItem,
  formatAxisValue,
  niceTicks,
  tokenizeCode,
  type DataTableColumn,
} from '..';

describe('List', () => {
  it('labels the list by its header, toggles a control from anywhere on the row and marks selection', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(
      <List header="Уведомления" footer="Сводка приходит по понедельникам в 9:00.">
        <ListItem leading={<Bell />} title="Новые сделки" control={<Switch />} />
        <ListItem title="Валюта отчётов" value="Рубль, ₽" chevron onClick={onOpen} />
        <ListItem title="Еженедельная сводка" selected onClick={() => {}} />
      </List>,
    );
    expect(screen.getByRole('list', { name: 'Уведомления' })).toBeTruthy();

    await user.click(screen.getByText('Новые сделки'));
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');

    await user.click(screen.getByRole('button', { name: /Валюта отчётов/ }));
    expect(onOpen).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: /Еженедельная сводка/ }).getAttribute('aria-pressed')).toBe('true');
  });
});

describe('DataList', () => {
  it('pairs terms with values and copies a value', async () => {
    const user = userEvent.setup();
    render(
      <DataList>
        <DataListItem label="Клиент">«Студия Север»</DataListItem>
        <DataListItem label="ИНН" copyValue="7704512386">
          7704512386
        </DataListItem>
      </DataList>,
    );
    expect(screen.getByText('ИНН').tagName).toBe('DT');
    expect(screen.getByText('«Студия Север»').closest('dd')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Скопировать: ИНН' }));
    expect(await navigator.clipboard.readText()).toBe('7704512386');
    expect(screen.getByRole('status').textContent).toBe('Скопировано');
  });
});

interface Deal {
  id: string;
  title: string;
  amount: number;
}

const deals: Deal[] = [
  { id: 'd3', title: 'Баннеры к распродаже', amount: 124_000 },
  { id: 'd1', title: 'Айдентика и сайт', amount: 1_284_900 },
  { id: 'd2', title: 'Иллюстрации к книге', amount: 960_000 },
  { id: 'd4', title: 'Анимация логотипа', amount: 312_500 },
  { id: 'd5', title: 'Упаковка для чая', amount: 286_000 },
];

const columns: readonly DataTableColumn<Deal>[] = [
  { id: 'title', header: 'Сделка', cell: (deal) => deal.title, sortValue: (deal) => deal.title },
  { id: 'amount', header: 'Сумма', numeric: true, cell: (deal) => `${deal.amount} ₽`, sortValue: (deal) => deal.amount },
];

const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);

describe('DataTable', () => {
  it('cycles sorting none → ascending → descending → none', async () => {
    const user = userEvent.setup();
    render(<DataTable aria-label="Сделки" rows={deals} columns={columns} getRowId={(deal) => deal.id} />);
    const sortButton = screen.getByRole('button', { name: /Сумма/ });
    const header = sortButton.closest('th');

    await user.click(sortButton);
    expect(header?.getAttribute('aria-sort')).toBe('ascending');
    expect(bodyRows()[0]?.textContent).toContain('Баннеры');
    expect(bodyRows()[1]?.textContent).toContain('Упаковка');

    await user.click(sortButton);
    expect(header?.getAttribute('aria-sort')).toBe('descending');
    expect(bodyRows()[0]?.textContent).toContain('Айдентика');

    await user.click(sortButton);
    expect(header?.getAttribute('aria-sort')).toBe('none');
    expect(bodyRows()[1]?.textContent).toContain('Айдентика');
  });

  it('selects the page, shows the bulk bar and clears it with Escape', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    render(
      <DataTable
        aria-label="Сделки"
        rows={deals}
        columns={columns}
        getRowId={(deal) => deal.id}
        selectable
        bulkActions={(ids) => (
          <button type="button" onClick={() => onArchive(ids)}>
            Архив
          </button>
        )}
      />,
    );
    expect(screen.queryByRole('group', { name: 'Действия с выбранными' })).toBeNull();

    await user.click(screen.getByRole('checkbox', { name: 'Выбрать все строки' }));
    const bar = screen.getByRole('group', { name: 'Действия с выбранными' });
    expect(within(bar).getByText('Выбрано: 5')).toBeTruthy();
    expect(bodyRows().every((row) => row.getAttribute('aria-selected') === 'true')).toBe(true);

    await user.click(within(bar).getByRole('button', { name: 'Архив' }));
    expect(onArchive).toHaveBeenCalledWith(['d3', 'd1', 'd2', 'd4', 'd5']);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('group', { name: 'Действия с выбранными' })).toBeNull();
    expect(bodyRows().some((row) => row.getAttribute('aria-selected') === 'true')).toBe(false);
  });

  it('moves between rows with arrows and selects with Space', async () => {
    const user = userEvent.setup();
    render(<DataTable aria-label="Сделки" rows={deals} columns={columns} getRowId={(deal) => deal.id} selectable />);
    const [first, second] = bodyRows();
    first?.focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(second);
    await user.keyboard(' ');
    expect(second?.getAttribute('aria-selected')).toBe('true');
    expect(first?.getAttribute('aria-selected')).toBe('false');
  });

  it('pages rows on the client and reports the visible range', async () => {
    const user = userEvent.setup();
    render(<DataTable aria-label="Сделки" rows={deals} columns={columns} getRowId={(deal) => deal.id} pageSize={2} />);
    expect(screen.getByText('Показано 1–2 из 5')).toBeTruthy();
    expect(bodyRows()).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Следующая страница' }));
    expect(screen.getByText('Показано 3–4 из 5')).toBeTruthy();
    expect(bodyRows()[0]?.textContent).toContain('Иллюстрации');
  });

  it('keeps the header while loading and shows the empty state when there are no rows', () => {
    const { rerender } = render(
      <DataTable aria-label="Сделки" rows={[]} columns={columns} getRowId={(deal: Deal) => deal.id} loading />,
    );
    expect(screen.getByRole('table').getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('columnheader', { name: 'Сделка' })).toBeTruthy();

    rerender(<DataTable aria-label="Сделки" rows={[]} columns={columns} getRowId={(deal: Deal) => deal.id} empty="Сделок не найдено" />);
    expect(screen.getByText('Сделок не найдено')).toBeTruthy();
  });
});

describe('Accordion and Collapsible', () => {
  it('keeps one item open at a time', async () => {
    const user = userEvent.setup();
    render(
      <Accordion defaultValue={['import']}>
        <AccordionItem value="import" title="Можно ли перенести данные из другой CRM?">
          Да, загрузите выгрузку в CSV.
        </AccordionItem>
        <AccordionItem value="price" title="Как считается стоимость тарифа?">
          По числу мест.
        </AccordionItem>
      </Accordion>,
    );
    const importTrigger = screen.getByRole('button', { name: /перенести данные/ });
    const priceTrigger = screen.getByRole('button', { name: /стоимость тарифа/ });
    expect(importTrigger.getAttribute('aria-expanded')).toBe('true');

    await user.click(priceTrigger);
    expect(priceTrigger.getAttribute('aria-expanded')).toBe('true');
    expect(importTrigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('collapsible swaps «Показать» for «Скрыть»', async () => {
    const user = userEvent.setup();
    render(
      <Collapsible title="Реквизиты для счёта" summary="ООО «Студия Север»">
        ИНН 7701234567
      </Collapsible>,
    );
    const trigger = screen.getByRole('button', { name: 'Показать' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    await user.click(trigger);
    expect(screen.getByRole('button', { name: 'Скрыть' }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('ИНН 7701234567')).toBeTruthy();
  });
});

describe('Carousel', () => {
  const scrollTo = vi.fn();
  const original = Element.prototype.scrollTo;
  afterEach(() => {
    Element.prototype.scrollTo = original;
    scrollTo.mockReset();
  });

  it('labels slides and scrolls one slide forward', async () => {
    Element.prototype.scrollTo = scrollTo as unknown as typeof Element.prototype.scrollTo;
    const user = userEvent.setup();
    render(
      <Carousel aria-label="Кейсы клиентов">
        <CarouselSlide>«Студия Север»</CarouselSlide>
        <CarouselSlide>«Орбита Лаб»</CarouselSlide>
        <CarouselSlide>Полюс</CarouselSlide>
      </Carousel>,
    );
    expect(screen.getByRole('group', { name: '1 из 3' }).getAttribute('aria-roledescription')).toBe('слайд');
    expect(screen.getByRole('button', { name: 'Предыдущий слайд' }).hasAttribute('disabled')).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Следующий слайд' }));
    expect(scrollTo).toHaveBeenCalledOnce();
  });
});

describe('Timeline', () => {
  it('lists events of a day with machine-readable time and marks the latest', () => {
    render(
      <Timeline>
        <TimelineDay label="Сегодня">
          <TimelineItem time="14:32" latest>
            Анна Северова перевела сделку в следующий этап
          </TimelineItem>
          <TimelineItem time="12:05">Оплачен счёт № 24-117</TimelineItem>
        </TimelineDay>
      </Timeline>,
    );
    const day = screen.getByRole('list', { name: 'Сегодня' });
    const items = within(day).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]?.hasAttribute('data-latest')).toBe(true);
    expect(within(day).getByText('14:32').tagName).toBe('TIME');
  });
});

describe('Charts', () => {
  it('picks round ticks and short axis labels', () => {
    expect(niceTicks(66_400)).toEqual([0, 20_000, 40_000, 60_000, 80_000]);
    expect(niceTicks(33)).toEqual([0, 10, 20, 30, 40]);
    expect(niceTicks(0)).toEqual([0, 1]);
    expect(formatAxisValue(80_000)).toBe('80 тыс');
    expect(formatAxisValue(1_500_000)).toBe('1,5 млн');
    expect(formatAxisValue(15)).toBe('15');
  });

  it('donut shows the total and shares with a decimal comma', () => {
    render(
      <DonutChart
        aria-label="Сделки по этапам"
        totalLabel="сделок"
        data={[
          { label: 'Квалификация', value: 64 },
          { label: 'Бриф', value: 52 },
        ]}
      />,
    );
    expect(screen.getByText('116')).toBeTruthy();
    // the matcher normalises the no-break space in the text to a plain one
    expect(screen.getByText('55,2 %')).toBeTruthy();
  });

  it('legend hides and shows a series', async () => {
    const user = userEvent.setup();
    render(
      <LineChart
        aria-label="Заявки по источникам"
        labels={['10 авг', '17 авг', '24 авг']}
        series={[
          { name: 'Сайт', values: [18, 21, 19] },
          { name: 'Реклама', values: [14, 12, 15] },
        ]}
      />,
    );
    const site = screen.getByRole('button', { name: 'Сайт' });
    expect(site.getAttribute('aria-pressed')).toBe('true');
    await user.click(site);
    expect(site.getAttribute('aria-pressed')).toBe('false');
  });

  it('KPI card reads value, change and period', () => {
    render(<KpiCard label="Выручка" period="Октябрь" value="1 284 900 ₽" change="+12,4 %" trend="up" comparison="к сентябрю" />);
    expect(screen.getByText('1 284 900 ₽')).toBeTruthy();
    expect(screen.getByText('+12,4 %')).toBeTruthy();
    expect(screen.getByText('Рост:')).toBeTruthy();
  });
});

describe('CodeBlock', () => {
  it('tokenizes keywords, strings, numbers, types and comments', () => {
    const tokens = tokenizeCode('const stage: string = "won"; // 42 later\nreturn 42;');
    const kinds = (kind: string) => tokens.filter((token) => token.kind === kind).map((token) => token.text);
    expect(kinds('keyword')).toEqual(['const', 'return']);
    expect(kinds('string')).toEqual(['"won"']);
    expect(kinds('type')).toEqual(['string']);
    expect(kinds('number')).toEqual(['42']);
    expect(kinds('comment')).toEqual(['// 42 later']);
    expect(tokens.map((token) => token.text).join('')).toBe('const stage: string = "won"; // 42 later\nreturn 42;');
  });

  it('switches files and copies the visible one', async () => {
    const user = userEvent.setup();
    render(
      <CodeBlock
        files={[
          { name: 'deal.ts', code: 'export const deal = 1;' },
          { name: 'deal.test.ts', code: 'test("deal");' },
        ]}
      />,
    );
    expect(screen.getByRole('tab', { name: 'deal.ts' }).getAttribute('aria-selected')).toBe('true');
    await user.click(screen.getByRole('tab', { name: 'deal.test.ts' }));
    await user.click(screen.getByRole('button', { name: 'Скопировать код' }));
    expect(await navigator.clipboard.readText()).toBe('test("deal");');
  });
});
