import { Bold, Italic, Strikethrough, Underline } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/kvant';

export default function ToggleGroupFormatting() {
  return (
    <ToggleGroup multiple defaultValue={['bold', 'italic']} aria-label="Начертание">
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
  );
}
