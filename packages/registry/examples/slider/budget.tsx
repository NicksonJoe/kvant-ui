import { Slider } from '@/kvant';

const rub = new Intl.NumberFormat('ru-RU');

export default function SliderBudget() {
  return (
    <Slider
      label="Бюджет проекта"
      defaultValue={[150_000, 600_000]}
      max={1_000_000}
      step={10_000}
      largeStep={100_000}
      minStepsBetweenValues={1}
      showLimits
      formatValue={(value) => `${rub.format(value)} ₽`}
      className="w-104 max-w-full"
    />
  );
}
