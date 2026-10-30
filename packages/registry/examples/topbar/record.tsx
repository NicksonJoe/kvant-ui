import { ChevronLeft, Ellipsis } from 'lucide-react';
import { Badge, Button, IconButton, Topbar, TopbarTitle } from '@/kvant';

export default function TopbarRecord() {
  return (
    <Topbar className="w-full">
      <IconButton size="sm" aria-label="Назад к сделкам" icon={<ChevronLeft />} />
      <TopbarTitle>Айдентика для пекарни</TopbarTitle>
      <Badge tone="warning" variant="dot">
        Переговоры
      </Badge>
      <div className="flex-1" />
      <Button size="sm" variant="secondary" className="max-sm:hidden">
        Выставить счёт
      </Button>
      <IconButton size="sm" aria-label="Ещё действия" icon={<Ellipsis />} />
    </Topbar>
  );
}
