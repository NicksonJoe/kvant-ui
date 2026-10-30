import { Spinner } from '@/kvant';

export default function SpinnerSizes() {
  return (
    <div className="flex items-center gap-6">
      <Spinner size={16} />
      <Spinner size={20} />
      <Spinner size={24} label="Загрузка" />
    </div>
  );
}
