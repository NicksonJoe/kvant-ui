import { Input } from '@/kvant';

export default function InputSizes() {
  return (
    <div className="flex w-80 flex-col gap-3">
      <Input size="sm" aria-label="Маленькое поле" placeholder="sm · 32 px" />
      <Input size="md" aria-label="Среднее поле" placeholder="md · 36 px" />
      <Input size="lg" aria-label="Большое поле" placeholder="lg · 44 px" />
    </div>
  );
}
