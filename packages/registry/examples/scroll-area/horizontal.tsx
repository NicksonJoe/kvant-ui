import { ScrollArea, Tag } from '@/kvant';

const filters = ['Все сделки', 'Мои', 'В работе', 'Переговоры', 'Договор', 'Счёт выставлен', 'Просрочены', 'Без ответственного', 'Архив'];

export default function ScrollAreaHorizontal() {
  return (
    <ScrollArea orientation="horizontal" className="w-full max-w-md">
      <div className="flex w-max gap-2 py-1 pb-4">
        {filters.map((name, index) => (
          <Tag key={name} selected={index === 2} onSelectedChange={() => {}}>
            {name}
          </Tag>
        ))}
      </div>
    </ScrollArea>
  );
}
