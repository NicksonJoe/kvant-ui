import { Slider } from '@/kvant';

export default function SliderDiscount() {
  return <Slider label="Скидка по умолчанию" defaultValue={15} max={50} showLimits formatValue={(value) => `${value} %`} className="w-104 max-w-full" />;
}
