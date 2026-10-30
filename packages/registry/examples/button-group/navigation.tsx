import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ButtonGroup, ButtonGroupItem } from '@/kvant';

export default function ButtonGroupNavigation() {
  return (
    <ButtonGroup aria-label="Период">
      <ButtonGroupItem iconOnly aria-label="Предыдущая неделя">
        <ChevronLeft />
      </ButtonGroupItem>
      <ButtonGroupItem>Сегодня</ButtonGroupItem>
      <ButtonGroupItem iconOnly aria-label="Следующая неделя">
        <ChevronRight />
      </ButtonGroupItem>
    </ButtonGroup>
  );
}
