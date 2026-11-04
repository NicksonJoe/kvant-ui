import { ArcDiagramChart, ChordChart, CohortChart, FunnelChart, NetworkChart, SankeyChart, WaterfallChart } from '@/kvant';
import type { Playground } from '@/kvant/meta';
import { shopPaths, shopSections } from './arc-diagram';
import { planMoves, plans } from './chord';
import { retention } from './cohort';
import { orderFunnel } from './funnel';
import { integrationPairs, integrations } from './network';
import { journeyLegend, journeyLinks, journeyNodes } from './sankey';
import { millions, planToFact } from './waterfall';

const kinds = ['funnel', 'waterfall', 'sankey', 'chord', 'network', 'arc', 'cohort'] as const;

const code: Record<(typeof kinds)[number], (highlight: boolean) => string> = {
  funnel: () => `<FunnelChart aria-label="Воронка заказа" data={orderFunnel} />`,
  waterfall: () => `<WaterfallChart aria-label="От плана к факту" data={planToFact} formatValue={millions} />`,
  sankey: (on) => `<SankeyChart aria-label="Путь клиента" nodes={journeyNodes} links={journeyLinks}${on ? ' highlight="purchase" legend={journeyLegend}' : ''} />`,
  chord: (on) => `<ChordChart aria-label="Переходы между тарифами" groups={plans} flows={planMoves}${on ? ' highlight="business"' : ''} />`,
  network: () => `<NetworkChart aria-label="Интеграции, которые подключают вместе" nodes={integrations} links={integrationPairs} />`,
  arc: () => `<ArcDiagramChart aria-label="Пути по разделам магазина" nodes={shopSections} links={shopPaths} />`,
  cohort: () => `<CohortChart aria-label="Удержание по когортам" data={retention} />`,
};

const playground: Playground = {
  controls: [
    {
      name: 'kind',
      type: 'enum',
      options: kinds,
      default: 'sankey',
      description: 'Тип: воронка, водопад, санкей, хорды, граф связей, дуговая диаграмма, когорты.',
    },
    { name: 'highlight', type: 'boolean', default: true, description: 'Смысловой поток: в санкее — к покупке, в хордах — из «Бизнеса».' },
  ],
  render: (p) => {
    const on = p.bool('highlight');
    switch (p.pick('kind', kinds)) {
      case 'funnel':
        return <FunnelChart aria-label="Воронка заказа" className="w-full" data={orderFunnel} />;
      case 'waterfall':
        return <WaterfallChart aria-label="От плана к факту" className="w-full" data={planToFact} formatValue={millions} />;
      case 'chord':
        return <ChordChart aria-label="Переходы между тарифами" className="w-full" groups={plans} flows={planMoves} highlight={on ? 'business' : undefined} />;
      case 'network':
        return <NetworkChart aria-label="Интеграции, которые подключают вместе" className="w-full" nodes={integrations} links={integrationPairs} />;
      case 'arc':
        return <ArcDiagramChart aria-label="Пути по разделам магазина" className="w-full" nodes={shopSections} links={shopPaths} />;
      case 'cohort':
        return <CohortChart aria-label="Удержание по когортам" className="w-full" data={retention} />;
      default:
        return (
          <SankeyChart
            aria-label="Путь клиента"
            className="w-full"
            nodes={journeyNodes}
            links={journeyLinks}
            highlight={on ? 'purchase' : undefined}
            legend={on ? journeyLegend : undefined}
          />
        );
    }
  },
  code: (p) => code[p.pick('kind', kinds)](p.bool('highlight')),
};

export default playground;
