import { CopyButton } from '@/kvant';

export default function CopyButtonLabelled() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex flex-col">
        <span className="text-caption text-fg-3">Номер предложения</span>
        <span className="font-mono text-label-md text-fg-1">КП-2026-114</span>
      </div>
      <CopyButton value="КП-2026-114" label="Копировать" />
    </div>
  );
}
