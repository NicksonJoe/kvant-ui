import { Meter } from '@/kvant';

/** Own zones and range: a project budget turns amber at 75 % and red past 95 %; the ticks follow the range. */
export default function MeterThresholds() {
  return (
    <div className="flex w-full max-w-[360px] flex-col gap-8">
      <Meter
        label="Бюджет проекта"
        value={980_000}
        max={1_284_900}
        thresholds={[75, 95]}
        valueLabel="980 000 из 1 284 900 ₽"
        status="76 % · заложите резерв на правки"
      />
      <Meter label="Загрузка дизайнеров" value={58} thresholds={[75, 95]} status="58 % · можно брать новый проект" />
    </div>
  );
}
