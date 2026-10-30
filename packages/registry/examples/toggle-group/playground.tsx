import { Bold, Italic, Strikethrough, Underline } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <ToggleGroup
      // remount when the mode changes: the starting value differs
      key={String(p.bool('multiple'))}
      multiple={p.bool('multiple')}
      orientation={p.pick('orientation', ['horizontal', 'vertical'] as const)}
      disabled={p.bool('disabled')}
      defaultValue={p.bool('multiple') ? ['bold', 'italic'] : ['bold']}
      aria-label="Начертание"
    >
      <ToggleGroupItem value="bold" aria-label="Жирный">
        <Bold />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Курсив">
        <Italic />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Подчёркнутый">
        <Underline />
      </ToggleGroupItem>
      <ToggleGroupItem value="strikethrough" aria-label="Зачёркнутый">
        <Strikethrough />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  code: (p) => `<ToggleGroup${p.attrs(['multiple', 'orientation', 'disabled'])} defaultValue={${p.bool('multiple') ? "['bold', 'italic']" : "['bold']"}} aria-label="Начертание">
  <ToggleGroupItem value="bold" aria-label="Жирный"><Bold /></ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Курсив"><Italic /></ToggleGroupItem>
  <ToggleGroupItem value="underline" aria-label="Подчёркнутый"><Underline /></ToggleGroupItem>
  <ToggleGroupItem value="strikethrough" aria-label="Зачёркнутый"><Strikethrough /></ToggleGroupItem>
</ToggleGroup>`,
};

export default playground;
