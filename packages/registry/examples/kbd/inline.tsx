import { Kbd } from '@/kvant';

export default function KbdInline() {
  return (
    <p className="text-body-sm text-fg-2">
      Нажмите <Kbd>Esc</Kbd>, чтобы закрыть, или <Kbd>↵</Kbd>, чтобы открыть сделку.
    </p>
  );
}
