import { ScrollArea } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const lines = Array.from({ length: 14 }, (_, index) => `Задача ${index + 1}: созвон с клиентом`);

const playground: Playground = {
  render: (p) => (
    <ScrollArea
      orientation={p.pick('orientation', ['vertical', 'horizontal', 'both'] as const)}
      fade={p.bool('fade')}
      className="h-48 w-full max-w-xs rounded-xl bg-surface-1 shadow-raised"
    >
      <ul className="flex w-max min-w-full flex-col p-4 text-body-sm text-fg-1">
        {lines.map((line) => (
          <li key={line} className="flex h-9 items-center whitespace-nowrap">
            {line}
          </li>
        ))}
      </ul>
    </ScrollArea>
  ),
  code: (p) => `<ScrollArea${p.attrs(['orientation', 'fade'])} className="h-48">
  {/* длинное содержимое */}
</ScrollArea>`,
};

export default playground;
