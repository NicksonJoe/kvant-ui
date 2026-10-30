import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BUTTON_SIZES, ButtonGroup, ButtonGroupItem } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <ButtonGroup
      variant={p.pick('variant', ['secondary', 'primary'] as const)}
      size={p.pick('size', BUTTON_SIZES)}
      disabled={p.bool('disabled')}
      aria-label="Период"
    >
      <ButtonGroupItem iconOnly aria-label="Предыдущая неделя">
        <ChevronLeft />
      </ButtonGroupItem>
      <ButtonGroupItem>Сегодня</ButtonGroupItem>
      <ButtonGroupItem iconOnly aria-label="Следующая неделя">
        <ChevronRight />
      </ButtonGroupItem>
    </ButtonGroup>
  ),
  code: (p) => `<ButtonGroup${p.attrs(['variant', 'size', 'disabled'])} aria-label="Период">
  <ButtonGroupItem iconOnly aria-label="Предыдущая неделя">
    <ChevronLeft />
  </ButtonGroupItem>
  <ButtonGroupItem>Сегодня</ButtonGroupItem>
  <ButtonGroupItem iconOnly aria-label="Следующая неделя">
    <ChevronRight />
  </ButtonGroupItem>
</ButtonGroup>`,
};

export default playground;
