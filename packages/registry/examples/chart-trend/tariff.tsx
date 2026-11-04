import { Card, CardHeader, StepLineChart } from '@/kvant';

const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const labels = ['25', '26'].flatMap((year) => months.map((month) => `${month} ${year}`));
const titles = ['2025', '2026'].flatMap((year) => months.map((month) => `${month} ${year}`));
const prices = [...Array(4).fill(990), ...Array(4).fill(1190), ...Array(8).fill(1290), ...Array(8).fill(1490)] as number[];
const rub = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;

export default function ChartTrendTariff() {
  return (
    <Card className="w-full">
      <CardHeader title="Цена тарифа «Бизнес»" description="2025–2026, ₽ в месяц · значение держится до следующего изменения" />
      <StepLineChart aria-label="Цена тарифа «Бизнес» по месяцам" name="Цена" labels={labels} tooltipLabels={titles} values={prices} formatValue={rub} formatTick={rub} />
    </Card>
  );
}
