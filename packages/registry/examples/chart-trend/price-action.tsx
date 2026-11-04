import { Card, CardHeader, KagiChart, PointFigureChart, RenkoChart } from '@/kvant';
import { closeDates, closes, rub } from './prices';

export default function ChartTrendPriceAction() {
  return (
    <Card className="w-full">
      <CardHeader title="Графики без оси времени" description="Один и тот же курс за четыре месяца · новая фигура только при движении цены, не по календарю" />
      <div className="grid gap-x-8 gap-y-6 md:grid-cols-3">
        <section className="flex min-w-0 flex-col gap-2">
          <h3 className="text-label-md font-semibold text-fg-1">Ренко · кирпич 2 ₽</h3>
          <RenkoChart aria-label="Ренко, кирпич 2 рубля" values={closes} labels={closeDates} brickSize={2} formatValue={rub} legend={false} />
        </section>
        <section className="flex min-w-0 flex-col gap-2">
          <h3 className="text-label-md font-semibold text-fg-1">Крестики-нолики · клетка 1 ₽, разворот 3</h3>
          <PointFigureChart aria-label="Крестики-нолики, клетка 1 рубль, разворот 3" values={closes} labels={closeDates} boxSize={1} reversal={3} formatValue={rub} legend={false} />
        </section>
        <section className="flex min-w-0 flex-col gap-2">
          <h3 className="text-label-md font-semibold text-fg-1">Каги · разворот 3 %</h3>
          <KagiChart aria-label="Каги, разворот 3 процента" values={closes} labels={closeDates} reversal={3} formatValue={rub} legend={false} />
        </section>
      </div>
    </Card>
  );
}
