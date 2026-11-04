import { Card, CardHeader, NightingaleChart } from '@/kvant';

const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const revenue = [62, 58, 74, 88, 100, 94, 80, 77, 99, 116, 136, 158];

export default function ChartPartsRose() {
  return (
    <Card className="w-full">
      <CardHeader title="Выручка по месяцам: роза" description="2026, ноябрь и декабрь — прогноз · площадь сектора = выручка, кольца 79 и 158 млн" />
      <NightingaleChart
        aria-label="Выручка по месяцам 2026 года"
        formatValue={(value) => `${value} млн ₽`}
        data={months.map((label, i) => ({ label, value: revenue[i] ?? 0 }))}
        highlight={['Окт', 'Ноя', 'Дек']}
        legendLabels={{ base: 'Месяц', highlight: 'Последний квартал' }}
      />
    </Card>
  );
}
