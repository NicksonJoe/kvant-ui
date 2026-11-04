import { Card, CardHeader, SurplusDeficitChart } from '@/kvant';

export default function ChartDeviationSalesPlan() {
  return (
    <Card className="w-full">
      <CardHeader title="Продажи против плана" description="2026, млн ₽ в месяц · план 4,5 млн" />
      <SurplusDeficitChart
        aria-label="Продажи по месяцам против плана 4,5 млн ₽"
        labels={['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт']}
        unit="млн"
        period="за год"
        surplusLabel="Сверх плана"
        deficitLabel="Недобор"
        series={{ name: 'Продажи', values: [3.8, 4.1, 4.9, 5.2, 4.6, 4.2, 3.9, 4.4, 5.3, 5.8] }}
        reference={{ name: 'План', value: 4.5 }}
      />
    </Card>
  );
}
