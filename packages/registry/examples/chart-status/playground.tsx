import { GaugeChart, HeatTable, RagList, Scorecard } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const kinds = ['gauge', 'rag', 'heat', 'scorecard'] as const;
const percent = (value: number) => `${value} %`;

const playground: Playground = {
  initial: { label: 'Загрузка склада', value: 78, target: 85 },
  controls: [{ name: 'kind', type: 'enum', options: kinds, default: 'gauge', description: 'Тип: спидометр, светофор, тепловая таблица или скоркард.' }],
  render: (p) => {
    const kind = p.pick('kind', kinds);
    if (kind === 'rag') {
      return (
        <RagList
          aria-label="Светофор KPI"
          className="w-full"
          items={[
            { label: 'Выручка', value: '18,4 млн ₽', target: 'план 18,0', owner: 'Сергей', status: 'green' },
            { label: 'Конверсия сайта', value: '2,9 %', target: 'план 3,2 %', owner: 'Анна', status: 'amber' },
            { label: 'Отток клиентов', value: '6,1 %', target: 'не выше 4 %', owner: 'Ирина', status: 'red' },
          ]}
        />
      );
    }
    if (kind === 'heat') {
      return (
        <HeatTable
          aria-label="Выполнение плана, %"
          className="w-full"
          columns={['Авг', 'Сен', 'Окт']}
          rows={[
            { label: 'Анна Северова', values: [127, 114, 125] },
            { label: 'Дарья Ким', values: [104, 71, 83] },
          ]}
          thresholds={[85, 95, 105, 115]}
          legend="Выполнение плана, %"
        />
      );
    }
    if (kind === 'scorecard') {
      return (
        <Scorecard
          aria-label="Показатели месяца"
          className="w-full"
          rows={[
            { label: 'Выручка', unit: 'млн ₽', value: 5.1, target: 5, decimals: 1, trend: [4.2, 4.5, 4.3, 4.7, 4.9, 5.1], status: 'green' },
            { label: 'NPS', unit: 'баллы', value: 52, target: 60, trend: [64, 60, 56, 52, 52, 52], status: 'amber' },
          ]}
        />
      );
    }
    return (
      <GaugeChart
        className="max-w-md"
        label={p.text('label')}
        value={p.num('value')}
        min={p.num('min')}
        max={p.num('max')}
        target={p.num('target')}
        size={p.pick('size', ['lg', 'sm'] as const)}
        formatValue={percent}
      />
    );
  },
  code: (p) => {
    const kind = p.pick('kind', kinds);
    if (kind === 'rag') return `<RagList\n  aria-label="Светофор KPI"\n  items={[{ label: 'Выручка', value: '18,4 млн ₽', target: 'план 18,0', owner: 'Сергей', status: 'green' }]}\n/>`;
    if (kind === 'heat') return `<HeatTable\n  aria-label="Выполнение плана, %"\n  columns={['Авг', 'Сен', 'Окт']}\n  rows={[{ label: 'Анна Северова', values: [127, 114, 125] }]}\n  thresholds={[85, 95, 105, 115]}\n  legend="Выполнение плана, %"\n/>`;
    if (kind === 'scorecard') return `<Scorecard\n  aria-label="Показатели месяца"\n  rows={[{ label: 'Выручка', unit: 'млн ₽', value: 5.1, target: 5, decimals: 1, trend: [4.2, 4.5, 4.3, 4.7, 4.9, 5.1], status: 'green' }]}\n/>`;
    return `<GaugeChart${p.attrs(['label', 'value', 'min', 'max', 'target', 'size'])}\n  formatValue={(value) => \`\${value} %\`}\n/>`;
  },
};

export default playground;
