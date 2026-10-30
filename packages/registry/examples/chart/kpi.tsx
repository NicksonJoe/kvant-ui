import { KpiCard } from '@/kvant';

export default function ChartKpi() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Выручка"
        period="Октябрь"
        value="1 284 900 ₽"
        change="+12,4 %"
        comparison="к сентябрю"
        data={[41, 44, 43, 47, 46, 49, 52, 51, 55, 54, 58, 63]}
      />
      <KpiCard label="Новые сделки" period="Октябрь" value="38" change="+3" comparison="к сентябрю" data={[29, 31, 30, 33, 31, 34, 33, 35, 34, 36, 35, 38]} />
      <KpiCard
        label="Конверсия в оплату"
        period="Октябрь"
        value="24,6 %"
        change="−1,2 п. п."
        trend="down"
        comparison="к сентябрю"
        data={[27, 28, 27.5, 27.8, 26.9, 27.2, 26.4, 26.8, 25.9, 26.1, 25.3, 24.6]}
      />
      <KpiCard label="Средний чек" period="Октябрь" value="33 813 ₽" change="+3,1 %" comparison="к сентябрю" data={[30, 31, 30.5, 31.6, 31.2, 32.4, 32, 32.9, 33.1, 32.8, 33.5, 33.8]} />
    </div>
  );
}
