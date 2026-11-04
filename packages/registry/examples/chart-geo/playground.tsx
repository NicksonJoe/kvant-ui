import { BubbleMap, ChoroplethMap, DensityMap, FlowMap, PinMap, TileMap } from '@/kvant';
import type { Playground } from '@/kvant/meta';
import { cityOrders, deliveryAddresses, densityLabels, okrugRepeat, pickupPoints, regionOrders, shipments } from './data';

const kinds = ['tile', 'choropleth', 'bubble', 'pins', 'density', 'flow'] as const;
const categories = [{ name: 'Пункт выдачи' }, { name: 'Магазин' }, { name: 'Склад', color: 'var(--color-fg-1)', marker: 'square' as const }];

const playground: Playground = {
  controls: [
    {
      name: 'kind',
      type: 'enum',
      options: kinds,
      default: 'tile',
      description: 'Тип карты: плитки, хороплет по округам, пузыри, пины, плотность или потоки.',
    },
  ],
  render: (p) => {
    const legend = p.bool('legend');
    const label = p.text('valueLabel') || undefined;
    switch (p.pick('kind', kinds)) {
      case 'choropleth':
        return <ChoroplethMap aria-label="Повторные заказы по округам" className="w-full" data={okrugRepeat} legend={legend} valueLabel={label ?? 'Повторных заказов, %'} />;
      case 'bubble':
        return <BubbleMap aria-label="Заказы по городам" className="w-full" data={cityOrders} valueLabel={label ?? 'Заказов за месяц'} />;
      case 'pins':
        return <PinMap aria-label="Точки самовывоза в Москве" className="w-full" points={pickupPoints} categories={categories} legend={legend} />;
      case 'density':
        return <DensityMap aria-label="Где живут покупатели" className="w-full" points={deliveryAddresses} labels={densityLabels} legend={legend} />;
      case 'flow':
        return <FlowMap aria-label="Отгрузки со складов" className="w-full" flows={shipments} legend={legend} valueLabel={label ?? 'Отправлений в неделю'} />;
      default:
        return (
          <TileMap
            aria-label="Заказы по регионам"
            className="w-full"
            data={regionOrders}
            thresholds={[5, 10, 20, 40]}
            legend={legend}
            valueLabel={label ?? 'Заказов на 10 тыс жителей'}
          />
        );
    }
  },
  code: (p) => {
    const attrs = p.attrs(['valueLabel', 'legend']);
    switch (p.pick('kind', kinds)) {
      case 'choropleth':
        return `<ChoroplethMap\n  aria-label="Повторные заказы по округам"${attrs}\n  data={[{ id: 'ЦАО', value: 42 }, { id: 'САО', value: 18 }, { id: 'ЮЗАО', value: 31 }]}\n/>`;
      case 'bubble':
        return `<BubbleMap\n  aria-label="Заказы по городам"${p.attrs(['valueLabel'])}\n  data={[\n    { name: 'Москва', region: 'МСК', value: 1840 },\n    { name: 'Петербург', region: 'СПБ', value: 920 },\n  ]}\n/>`;
      case 'pins':
        return `<PinMap\n  aria-label="Точки самовывоза в Москве"${p.attrs(['legend'])}\n  categories={[{ name: 'Пункт выдачи' }, { name: 'Склад', color: 'var(--color-fg-1)', marker: 'square' }]}\n  points={[\n    { name: 'ПВЗ Таганская', category: 'Пункт выдачи', lon: 37.6752, lat: 55.748 },\n    { name: 'Склад «Запад»', category: 'Склад', label: true, lon: 37.4345, lat: 55.678 },\n  ]}\n/>`;
      case 'density':
        return `<DensityMap\n  aria-label="Где живут покупатели"${p.attrs(['legend'])}\n  points={addresses} // [{ lon: 37.61, lat: 55.75 }, …]\n  labels={[{ name: 'Центр', lon: 37.6105, lat: 55.8048 }]}\n/>`;
      case 'flow':
        return `<FlowMap\n  aria-label="Отгрузки со складов"${attrs}\n  flows={[\n    { from: { name: 'Москва', region: 'МСК' }, to: { name: 'Санкт-Петербург', region: 'СПБ' }, value: 420 },\n    { from: { name: 'Екатеринбург', region: 'СВЕ' }, to: { name: 'Челябинская область', region: 'ЧЕЛ' }, value: 190 },\n  ]}\n/>`;
      default:
        return `<TileMap\n  aria-label="Заказы по регионам"${attrs}\n  thresholds={[5, 10, 20, 40]}\n  data={[{ id: 'МСК', value: 58 }, { id: 'СПБ', value: 46 }, { id: 'СВЕ', value: 31 }]}\n/>`;
    }
  },
};

export default playground;
