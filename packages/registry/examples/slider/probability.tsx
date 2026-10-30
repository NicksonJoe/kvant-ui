import { Slider } from '@/kvant';

export default function SliderProbability() {
  return (
    <Slider
      label="Вероятность сделки"
      defaultValue={75}
      step={25}
      marks={[0, 25, 50, 75, 100]}
      formatValue={(value) => `${value} %`}
      className="w-104 max-w-full"
    />
  );
}
