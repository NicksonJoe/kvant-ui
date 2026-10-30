import { Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { Fab } from '@/kvant';

const tasks = [
  { title: 'Позвонить в «Орбита Лаб»', when: 'Сегодня, 14:00' },
  { title: 'Согласовать смету', when: 'Сегодня, 17:30' },
  { title: 'Отправить договор «Студии Север»', when: 'Завтра' },
  { title: 'Собрать бриф по каталогу', when: 'Завтра' },
  { title: 'Проверить макеты упаковки', when: '31 октября' },
  { title: 'Выставить счёт за октябрь', when: '1 ноября' },
  { title: 'Подготовить отчёт для «Хлебницы»', when: '3 ноября' },
  { title: 'Встреча по сайту кофейни «Зерно»', when: '5 ноября' },
];

export default function FabExtended() {
  const [extended, setExtended] = useState(true);
  const lastTop = useRef(0);
  return (
    <div className="relative h-96 w-full max-w-90 overflow-hidden rounded-3xl bg-surface-1 shadow-raised">
      <ul
        className="h-full overflow-y-auto pb-22"
        // Down folds the label away, up or back to the top brings it back.
        onScroll={(event) => {
          const top = event.currentTarget.scrollTop;
          setExtended(top < 8 || top < lastTop.current);
          lastTop.current = top;
        }}
      >
        {tasks.map((task) => (
          <li key={task.title} className="flex h-15 flex-col justify-center border-b border-separator px-4">
            <span className="text-label-md font-medium text-fg-1">{task.title}</span>
            <span className="text-caption text-fg-3">{task.when}</span>
          </li>
        ))}
      </ul>
      <Fab icon={<Plus />} label="Новая задача" extended={extended} className="absolute right-4 bottom-4" />
    </div>
  );
}
