import type { CategoryMeta } from '../types';
import chart from './chart';
import chartComparison from './chart-comparison';
import chartRanking from './chart-ranking';
import chartDeviation from './chart-deviation';
import chartTrend from './chart-trend';
import chartParts from './chart-parts';
import chartDistribution from './chart-distribution';
import chartCorrelation from './chart-correlation';
import chartFlow from './chart-flow';
import chartGeo from './chart-geo';
import chartStatus from './chart-status';
import chartHierarchy from './chart-hierarchy';
import chartText from './chart-text';

const category: CategoryMeta = {
  id: 'charts',
  title: 'Графики',
  description: 'Ядро — линии, области, столбцы, кольцо, KPI — и по компоненту на каждый вопрос к данным: сравнение, рейтинг, отклонение, динамика, части целого, распределение, связь, поток, география, статус, иерархия, текст.',
  components: [chart, chartComparison, chartRanking, chartDeviation, chartTrend, chartParts, chartDistribution, chartCorrelation, chartFlow, chartGeo, chartStatus, chartHierarchy, chartText],
};

export default category;
