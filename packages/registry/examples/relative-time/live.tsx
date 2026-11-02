import { RelativeTime } from '@/kvant';

export default function RelativeTimeLive() {
  return (
    <p className="text-body-sm text-fg-2">
      Черновик сохранён <RelativeTime date={new Date()} className="text-fg-1" />
    </p>
  );
}
