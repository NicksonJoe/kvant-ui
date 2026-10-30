import { ProgressCircle } from '@/kvant';

export default function ProgressCircleSizes() {
  return (
    <div className="flex items-center gap-6">
      <ProgressCircle size={20} value={40} aria-label="Загрузка файла" />
      <ProgressCircle size={32} value={55} aria-label="Загрузка файла" />
      <ProgressCircle size={48} value={72} showValue aria-label="Загрузка файла" />
      <ProgressCircle size={64} value={91} showValue aria-label="Загрузка файла" />
    </div>
  );
}
