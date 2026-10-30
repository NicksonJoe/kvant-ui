import { Spinner } from '@/kvant';

export default function SpinnerInline() {
  return (
    <p className="flex items-center gap-2 text-body-sm text-fg-2" role="status">
      <Spinner size={16} />
      Загружаем сделки…
    </p>
  );
}
