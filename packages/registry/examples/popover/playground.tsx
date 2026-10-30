import { Button, Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <Popover>
      <PopoverTrigger render={<Button variant="secondary" />}>Открыть поповер</PopoverTrigger>
      <PopoverContent
        side={p.pick('side', ['top', 'bottom', 'left', 'right'] as const)}
        align={p.pick('align', ['start', 'center', 'end'] as const)}
        sideOffset={p.num('sideOffset')}
      >
        <PopoverTitle>Напоминание о сделке</PopoverTitle>
        <PopoverDescription>Напомним о созвоне по смете в пятницу в 11:00.</PopoverDescription>
      </PopoverContent>
    </Popover>
  ),
  code: (p) => `<Popover>
  <PopoverTrigger render={<Button variant="secondary" />}>Открыть поповер</PopoverTrigger>
  <PopoverContent${p.attrs(['side', 'align', 'sideOffset'])}>
    <PopoverTitle>Напоминание о сделке</PopoverTitle>
    <PopoverDescription>Напомним о созвоне по смете в пятницу в 11:00.</PopoverDescription>
  </PopoverContent>
</Popover>`,
};

export default playground;
