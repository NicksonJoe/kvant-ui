import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  BubbleMap,
  ChoroplethMap,
  DensityMap,
  FlowMap,
  MOSCOW_BASEMAP,
  MOSCOW_OKRUGS,
  PinMap,
  RUSSIA_BASEMAP,
  RUSSIA_TILES,
  TileMap,
  linearProjection,
  tileBasemap,
  type GeoPin,
} from '..';

const slots = (container: HTMLElement, slot: string) => [...container.querySelectorAll<SVGElement>(`[data-slot="${slot}"]`)];
const tooltip = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-slot="chart-tooltip"]');
const spoken = (container: HTMLElement) => container.querySelector('[aria-live]')?.textContent ?? '';
const plot = () => screen.getByRole('group');

/** Parses `M ax ay Q cx cy bx by` into numbers. */
const quad = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe('Geo geometry', () => {
  it('projects lon/lat linearly around an origin', () => {
    const project = linearProjection({ lon: 37.6176, lat: 55.752 }, { x: 302, y: 150 }, [1125, 757]);
    expect(project(37.6176, 55.752)).toEqual({ x: 302, y: 150 });
    const east = project(37.7176, 55.852);
    expect(east.x).toBeCloseTo(414.5);
    expect(east.y).toBeCloseTo(74.3);
    // the Moscow scheme puts the Kremlin at the centre of the rings
    expect(MOSCOW_BASEMAP.project?.(37.6176, 55.752)).toEqual({ x: 302, y: 150 });
  });

  it('lays tiles on a 42 × 34 grid with region centres', () => {
    expect(RUSSIA_TILES).toHaveLength(59);
    expect(RUSSIA_BASEMAP.regions?.['МСК']).toEqual({ name: 'Москва', x: 103, y: 151 });
    const custom = tileBasemap([{ id: 'A', name: 'Альфа', col: 1, row: 2 }]);
    expect(custom.width).toBe(38 + 42);
    expect(custom.height).toBe(30 + 68);
    expect(custom.land[0]?.startsWith('M46 68h30')).toBe(true);
  });

  it('ships the Moscow okrugs: ЦАО inside TTK and eight sectors', () => {
    expect(MOSCOW_OKRUGS.features.map((feature) => feature.id)).toEqual(['ЦАО', 'САО', 'СВАО', 'ВАО', 'ЮВАО', 'ЮАО', 'ЮЗАО', 'ЗАО', 'СЗАО']);
  });
});

describe('ChoroplethMap', () => {
  const data = [
    { id: 'ЦАО', value: 48 },
    { id: 'САО', value: 4 },
    { id: 'СВАО', value: 5 },
    { id: 'ВАО', value: 12 },
    { id: 'ЮВАО', value: 20 },
    { id: 'ЮАО', value: 39 },
    { id: 'ЮЗАО', value: 9 },
    { id: 'ЗАО', value: 19 },
  ];

  it('fills regions by thresholds and lists the classes', () => {
    const { container } = render(
      <ChoroplethMap aria-label="Заказы по округам" data={data} thresholds={[5, 10, 20, 40]} valueLabel="Заказов на 1000 жителей" />,
    );
    const regions = slots(container, 'geo-region');
    expect(regions).toHaveLength(9);
    const classOf = (id: string) => regions.find((region) => region.dataset.id === id)?.dataset.class;
    expect(classOf('САО')).toBe('0');
    expect(classOf('СВАО')).toBe('1');
    expect(classOf('ЮЗАО')).toBe('1');
    expect(classOf('ВАО')).toBe('2');
    expect(classOf('ЗАО')).toBe('2');
    expect(classOf('ЮВАО')).toBe('3');
    expect(classOf('ЮАО')).toBe('3');
    expect(classOf('ЦАО')).toBe('4');
    expect(classOf('СЗАО')).toBe('none');
    expect(regions.find((region) => region.dataset.id === 'ЦАО')?.getAttribute('fill')).toBe('var(--color-seq-5)');
    expect(container.querySelector('[data-slot="geo-scale"]')?.textContent).toBe('Заказов на 1000 жителейдо 55–910–1920–3940+');
  });

  it('falls back to quintiles without thresholds', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const { container } = render(
      <TileMap
        aria-label="Регионы"
        tiles={values.map((value) => ({ id: `R${value}`, name: `Регион ${value}`, col: value, row: 0 }))}
        data={values.map((value) => ({ id: `R${value}`, value }))}
      />,
    );
    expect(slots(container, 'geo-region').map((region) => region.dataset.class)).toEqual(['0', '0', '1', '1', '2', '2', '3', '3', '4', '4']);
  });

  it('duplicates the data as a table, with a dash where there is none', () => {
    render(<ChoroplethMap aria-label="Заказы по округам" data={data} />);
    const table = screen.getByRole('table');
    expect(within(table).getByRole('rowheader', { name: 'Центральный округ' })).toBeTruthy();
    const row = within(table).getByRole('rowheader', { name: 'Северо-Западный округ' }).closest('tr');
    expect(row?.textContent).toContain('—');
  });

  it('shows a tooltip on hover and steps regions with the keyboard', async () => {
    const user = userEvent.setup();
    const { container } = render(<ChoroplethMap aria-label="Заказы по округам" data={data} thresholds={[5, 10, 20, 40]} valueLabel="Заказов" />);
    const centre = slots(container, 'geo-region').find((region) => region.dataset.id === 'ЦАО');
    if (!centre) throw new Error('no ЦАО');
    await user.hover(centre);
    expect(tooltip(container)?.textContent).toContain('Центральный округ');
    expect(tooltip(container)?.textContent).toContain('48');
    expect(container.querySelector('[data-slot="geo-region-active"]')).toBeTruthy();
    await user.unhover(centre);

    plot().focus();
    await user.keyboard('{ArrowRight}');
    expect(spoken(container)).toBe('Центральный округ: 48, 40+');
    await user.keyboard('{ArrowRight}');
    expect(spoken(container)).toBe('Северный округ: 4, до 5');
    await user.keyboard('{End}');
    expect(spoken(container)).toBe('Северо-Западный округ: нет данных');
    expect(tooltip(container)?.textContent).toContain('нет данных');
    await user.keyboard('{Escape}');
    expect(tooltip(container)).toBeNull();
  });
});

describe('TileMap', () => {
  it('draws the Russian tile grid with codes, Moscow at column 2 row 4', () => {
    const { container } = render(<TileMap aria-label="Заказы по регионам" data={[{ id: 'МСК', value: 42 }]} thresholds={[5, 10, 20, 40]} />);
    const tiles = slots(container, 'geo-region');
    expect(tiles).toHaveLength(59);
    const moscow = tiles.find((tile) => tile.dataset.id === 'МСК');
    expect(moscow?.getAttribute('d')?.startsWith('M88 136h30')).toBe(true);
    expect(moscow?.dataset.class).toBe('4');
    expect(container.querySelector('svg')?.textContent).toContain('МСК');
    expect(container.querySelector('svg')?.textContent).toContain('ДАГ');
  });
});

describe('BubbleMap', () => {
  const data = [
    { name: 'Петербург', region: 'СПБ', value: 460 },
    { name: 'Москва', region: 'МСК', value: 1840 },
    { name: 'Казань', region: 'ТАТ', value: 115 },
    { name: 'Новосибирск', region: 'НСК', value: 410 },
    { name: 'Екатеринбург', region: 'СВЕ', value: 380 },
    { name: 'Самара', region: 'САМ', value: 210 },
  ];

  it('sizes bubbles by area, the biggest underneath', () => {
    const { container } = render(<BubbleMap aria-label="Заказы по городам" data={data} />);
    const bubbles = slots(container, 'geo-bubble');
    expect(bubbles.map((bubble) => bubble.dataset.name)).toEqual(['Москва', 'Петербург', 'Новосибирск', 'Екатеринбург', 'Самара', 'Казань']);
    expect(Number(bubbles[0]?.getAttribute('r'))).toBeCloseTo(32);
    expect(Number(bubbles[1]?.getAttribute('r'))).toBeCloseTo(16);
    expect(bubbles[0]?.getAttribute('cx')).toBe('103');
    expect(bubbles[0]?.getAttribute('cy')).toBe('151');
  });

  it('labels the top four and keys the sizes', () => {
    const { container } = render(<BubbleMap aria-label="Заказы по городам" data={data} valueLabel="Заказов за месяц" />);
    const svgText = container.querySelector('svg')?.textContent ?? '';
    expect(svgText.replace(/\s/g, ' ')).toContain('Москва 1 840');
    expect(svgText).toContain('Екатеринбург');
    expect(svgText).not.toContain('Самара');
    const legend = container.querySelector<HTMLElement>('[data-slot="geo-size-legend"]');
    expect(legend?.textContent?.replace(/\s/g, ' ')).toBe('Заказов за месяц1005001 500');
  });

  it('steps from the largest bubble and reads it out', async () => {
    const user = userEvent.setup();
    const { container } = render(<BubbleMap aria-label="Заказы по городам" data={data} valueLabel="Заказов" />);
    plot().focus();
    await user.keyboard('{ArrowRight}');
    expect(spoken(container).replace(/\s/g, ' ')).toBe('Москва: 1 840');
    await user.keyboard('{ArrowRight}');
    expect(spoken(container)).toBe('Петербург: 460');
    expect(tooltip(container)?.textContent).toContain('Петербург');
  });
});

describe('PinMap', () => {
  const points: GeoPin[] = [
    { name: 'ПВЗ на Тверской', category: 'Пункт выдачи', lon: 37.6176, lat: 55.752 },
    { name: 'ПВЗ на Профсоюзной', category: 'Пункт выдачи', lon: 37.5506, lat: 55.7463 },
    { name: 'Магазин на Арбате', category: 'Магазин', lon: 37.6402, lat: 55.7624, detail: 'Открыт до 22:00' },
    { name: 'Склад «Запад»', category: 'Склад', lon: 37.4345, lat: 55.678, label: true },
  ];
  const categories = [{ name: 'Пункт выдачи' }, { name: 'Магазин' }, { name: 'Склад', color: 'var(--color-fg-1)', marker: 'square' as const }];

  it('puts the pin tip on the projected address', () => {
    const { container } = render(<PinMap aria-label="Точки самовывоза" points={points} categories={categories} />);
    const pins = slots(container, 'geo-pin');
    expect(pins).toHaveLength(4);
    expect(pins[0]?.dataset.x).toBe('302');
    expect(pins[0]?.dataset.y).toBe('150');
    expect(pins[3]?.dataset.marker).toBe('square');
    expect(container.querySelector('svg')?.textContent).toContain('Склад «Запад»');
  });

  it('legend counts each type and hides it', async () => {
    const user = userEvent.setup();
    const { container } = render(<PinMap aria-label="Точки самовывоза" points={points} categories={categories} />);
    const button = screen.getByRole('button', { name: 'Пункт выдачи · 2' });
    expect(button.getAttribute('aria-pressed')).toBe('true');
    await user.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(slots(container, 'geo-pin')).toHaveLength(2);
  });

  it('shows the type and the detail in the tooltip', async () => {
    const user = userEvent.setup();
    const { container } = render(<PinMap aria-label="Точки самовывоза" points={points} categories={categories} />);
    plot().focus();
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    expect(spoken(container)).toBe('Магазин на Арбате: Магазин, Открыт до 22:00');
    expect(tooltip(container)?.textContent).toContain('Открыт до 22:00');
  });

  it('clusters pins of one region with three sizes', () => {
    const at = (region: string, count: number): GeoPin[] =>
      Array.from({ length: count }, (_, i) => ({ name: `Точка ${region} ${i + 1}`, category: 'Пункт выдачи', region }));
    const { container } = render(
      <PinMap aria-label="Точки по стране" basemap={RUSSIA_BASEMAP} cluster points={[...at('СВЕ', 3), ...at('МСК', 50), ...at('НСК', 10), ...at('ТАТ', 1)]} />,
    );
    const clusters = slots(container, 'geo-cluster');
    expect(clusters.map((cluster) => [cluster.dataset.count, cluster.getAttribute('r')])).toEqual([
      ['50', '15'],
      ['10', '12'],
      ['3', '9'],
    ]);
    expect(slots(container, 'geo-pin')).toHaveLength(1);
    expect(container.querySelector('[data-slot="geo-cluster-legend"]')?.textContent).toContain('одна точка');
  });

  it('clusters by itself past 200 points', () => {
    const many = (count: number): GeoPin[] => Array.from({ length: count }, (_, i) => ({ name: `Точка ${i}`, region: 'МСК' }));
    const { container, unmount } = render(<PinMap aria-label="Точки" basemap={RUSSIA_BASEMAP} points={many(200)} />);
    expect(slots(container, 'geo-cluster')).toHaveLength(0);
    unmount();
    const next = render(<PinMap aria-label="Точки" basemap={RUSSIA_BASEMAP} points={many(201)} />);
    expect(slots(next.container, 'geo-cluster').map((cluster) => cluster.dataset.count)).toEqual(['201']);
  });

  it('reads a cluster out with its region', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PinMap aria-label="Точки по стране" basemap={RUSSIA_BASEMAP} cluster points={Array.from({ length: 21 }, (_, i) => ({ name: `Точка ${i}`, region: 'СВЕ' }))} />,
    );
    plot().focus();
    await user.keyboard('{Home}');
    expect(spoken(container)).toBe('Свердловская область: 21 точка');
  });
});

describe('DensityMap', () => {
  const centre = Array.from({ length: 50 }, (_, i) => ({ lon: 37.6176 + (i % 5) * 0.001, lat: 55.752 + Math.floor(i / 5) * 0.0005 }));
  const far = [{ lon: 37.4, lat: 55.62 }];

  it('rasterises a deterministic five-step density', () => {
    const first = render(<DensityMap aria-label="Где живут покупатели" points={[...centre, ...far]} />);
    const levels = slots(first.container, 'geo-density');
    expect(levels.map((level) => level.dataset.level)).toEqual(['1', '2', '3', '4', '5']);
    const paths = levels.map((level) => level.getAttribute('d'));
    expect(Number(levels[4]?.dataset.cells)).toBeGreaterThan(0);
    first.unmount();
    const second = render(<DensityMap aria-label="Где живут покупатели" points={[...centre, ...far]} />);
    expect(slots(second.container, 'geo-density').map((level) => level.getAttribute('d'))).toEqual(paths);
  });

  it('counts addresses per step in the table and is not a tab stop', () => {
    render(<DensityMap aria-label="Где живут покупатели" points={[...centre, ...far]} labels={[{ name: 'Центр', lon: 37.6105, lat: 55.8048 }]} />);
    const group = screen.getByRole('group', { name: 'Где живут покупатели' });
    expect(group.hasAttribute('tabindex')).toBe(false);
    const table = within(group).getByRole('table');
    expect(within(table).getByRole('rowheader', { name: 'Много' }).closest('tr')?.textContent).toBe('Много50');
    expect(within(table).getByRole('rowheader', { name: 'Ниже порога' }).closest('tr')?.textContent).toBe('Ниже порога1');
    expect(group.querySelector('svg')?.textContent).toContain('Центр');
    expect(document.querySelector('[data-slot="geo-density-legend"]')?.textContent).toBe('МалоМного');
  });
});

describe('FlowMap', () => {
  const moscow = { name: 'Москва', region: 'МСК' };
  const ekb = { name: 'Екатеринбург', region: 'СВЕ' };
  const flows = [
    { from: moscow, to: { name: 'Санкт-Петербург', region: 'СПБ' }, value: 420 },
    { from: moscow, to: { name: 'Нижегородская область', region: 'НИЖ' }, value: 260 },
    { from: ekb, to: { name: 'Челябинская область', region: 'ЧЕЛ' }, value: 190 },
    { from: ekb, to: { name: 'Пермский край', region: 'ПЕР' }, value: 50 },
  ];

  it('bends each route up, thickness by volume, the largest underneath', () => {
    const { container } = render(<FlowMap aria-label="Отгрузки со складов" flows={flows} />);
    const routes = slots(container, 'geo-route');
    expect(routes.map((route) => route.dataset.to)).toEqual(['Санкт-Петербург', 'Нижегородская область', 'Челябинская область', 'Пермский край']);
    const line = (route: SVGElement | undefined) => route?.querySelector('path');
    expect(Number(line(routes[0])?.getAttribute('stroke-width'))).toBeCloseTo(7);
    expect(Number(line(routes[3])?.getAttribute('stroke-width'))).toBeCloseTo(1.2 + (5.8 * 50) / 420);
    const [ax = 0, ay = 0, , cy = 0, , by = 0] = quad(line(routes[0])?.getAttribute('d') ?? '');
    expect([ax, ay]).toEqual([103, 151]);
    expect(cy).toBeLessThan((ay + by) / 2);
    expect(slots(container, 'geo-origin')).toHaveLength(2);
    expect(slots(container, 'geo-destination')).toHaveLength(4);
    expect(screen.getByText('Толщина — объём: тонкая 50, толстая 420')).toBeTruthy();
  });

  it('legend hides the routes of a warehouse', async () => {
    const user = userEvent.setup();
    const { container } = render(<FlowMap aria-label="Отгрузки со складов" flows={flows} />);
    await user.click(screen.getByRole('button', { name: 'Екатеринбург' }));
    expect(slots(container, 'geo-route')).toHaveLength(2);
    expect(slots(container, 'geo-origin')).toHaveLength(1);
  });

  it('shows the route in the tooltip and steps by volume', async () => {
    const user = userEvent.setup();
    const { container } = render(<FlowMap aria-label="Отгрузки со складов" flows={flows} valueLabel="Отправлений в неделю" />);
    const route = slots(container, 'geo-route')[2];
    if (!route) throw new Error('no route');
    await user.hover(route);
    expect(tooltip(container)?.textContent).toContain('Екатеринбург → Челябинская область');
    expect(tooltip(container)?.textContent).toContain('190');
    await user.unhover(route);
    plot().focus();
    await user.keyboard('{ArrowRight}');
    expect(spoken(container)).toBe('Москва → Санкт-Петербург: 420');
    expect(screen.getByText('Толщина — отправлений в неделю: тонкая 50, толстая 420')).toBeTruthy();
  });
});
