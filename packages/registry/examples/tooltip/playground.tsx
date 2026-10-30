import { Button, Tooltip } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { content: 'Скопировать ссылку', shortcut: '⇧⌘C' },
  render: (p) => (
    <Tooltip
      content={p.text('content')}
      shortcut={p.text('shortcut') || undefined}
      side={p.pick('side', ['top', 'bottom', 'left', 'right'] as const)}
      disabled={p.bool('disabled')}
    >
      <Button variant="secondary">Наведите на меня</Button>
    </Tooltip>
  ),
  code: (p) => `<Tooltip${p.attrs(['content', 'shortcut', 'side', 'disabled'])}>
  <Button variant="secondary">Наведите на меня</Button>
</Tooltip>`,
};

export default playground;
