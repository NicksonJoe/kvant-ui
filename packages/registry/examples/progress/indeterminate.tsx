import { Progress, ProgressCircle } from '@/kvant';

export default function ProgressIndeterminate() {
  return (
    <div className="flex w-80 flex-col items-center gap-6">
      <Progress label="Готовим отчёт" value={null} />
      <ProgressCircle value={null} aria-label="Готовим отчёт" />
    </div>
  );
}
