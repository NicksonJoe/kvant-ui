import { Separator } from '@/kvant';

export default function SeparatorVertical() {
  return (
    <div className="flex h-5 items-center gap-3 text-body-sm text-fg-2">
      <span>24 сделки</span>
      <Separator orientation="vertical" />
      <span>318 клиентов</span>
      <Separator orientation="vertical" />
      <span>4,81 млн ₽</span>
    </div>
  );
}
