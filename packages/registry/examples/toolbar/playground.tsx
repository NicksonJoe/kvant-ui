import { Bold, Italic, Undo2 } from 'lucide-react';
import { Toolbar, ToolbarButton, ToolbarToggle } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <Toolbar aria-label="Форматирование" variant={p.pick('variant', ['floating', 'selection'] as const)}>
      <ToolbarButton label="Отменить" shortcut="⌘Z" icon={<Undo2 />} />
      <ToolbarToggle label="Жирный" shortcut="⌘B" icon={<Bold />} defaultPressed />
      <ToolbarToggle label="Курсив" shortcut="⌘I" icon={<Italic />} />
    </Toolbar>
  ),
  code: (p) => `<Toolbar aria-label="Форматирование"${p.attrs(['variant'])}>
  <ToolbarButton label="Отменить" shortcut="⌘Z" icon={<Undo2 />} />
  <ToolbarToggle label="Жирный" shortcut="⌘B" icon={<Bold />} defaultPressed />
  <ToolbarToggle label="Курсив" shortcut="⌘I" icon={<Italic />} />
</Toolbar>`,
};

export default playground;
