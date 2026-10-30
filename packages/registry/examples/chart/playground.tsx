import { AreaChart, BarChart, LineChart } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const kinds = ['area', 'line', 'bar'] as const;
const charts = { area: AreaChart, line: LineChart, bar: BarChart } as const;
const names = { area: 'AreaChart', line: 'LineChart', bar: 'BarChart' } as const;
const labels = ['Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь'];

const playground: Playground = {
  controls: [
    { name: 'kind', type: 'enum', options: kinds, default: 'area', description: 'Вид графика: площадь, линии или столбцы.' },
    { name: 'twoSeries', type: 'boolean', default: false, description: 'Вторая серия и легенда.' },
  ],
  render: (p) => {
    const Chart = charts[p.pick('kind', kinds)];
    return (
      <Chart
        aria-label="Новые и закрытые сделки"
        className="w-full"
        height={p.pick('height', [160, 200, 240] as const)}
        labels={labels}
        series={[
          { name: 'Новые', values: [28, 31, 26, 34, 35, 38] },
          ...(p.bool('twoSeries') ? [{ name: 'Закрытые', values: [19, 22, 24, 21, 27, 30] }] : []),
        ]}
      />
    );
  },
  code: (p) => {
    const name = names[p.pick('kind', kinds)];
    return `<${name}
  aria-label="Новые и закрытые сделки"${p.attrs(['height'])}
  labels={['Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь']}
  series={[
    { name: 'Новые', values: [28, 31, 26, 34, 35, 38] },${p.bool('twoSeries') ? "\n    { name: 'Закрытые', values: [19, 22, 24, 21, 27, 30] }," : ''}
  ]}
/>`;
  },
};

export default playground;
