import { Kbd } from '@/kvant';

export default function KbdCombos() {
  return (
    <div className="flex flex-col items-center gap-3 text-body-sm text-fg-2">
      <span className="flex items-center gap-1">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
      <span className="flex items-center gap-1">
        <Kbd>Ctrl</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>P</Kbd>
      </span>
    </div>
  );
}
