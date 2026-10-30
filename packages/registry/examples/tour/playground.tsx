import { Bell, Plus, Search } from 'lucide-react';
import { useId, useState } from 'react';
import { Button, IconButton, Tour, type TourStep } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const sides = ['top', 'bottom', 'left', 'right'] as const;

function TourDemo({ side, steps }: { side: TourStep['side']; steps: number }) {
  const [open, setOpen] = useState(false);
  const scope = useId();
  const find = (name: string) => `[data-tour-scope="${scope}"] [data-tour="${name}"]`;
  const all: TourStep[] = [
    { target: find('new'), title: 'Новая сделка', description: 'Начните с клиента и суммы.', side },
    { target: find('search'), title: 'Поиск', description: 'Сделки, контакты и файлы в одном поле.', side },
    { target: find('bell'), title: 'Уведомления', description: 'Сюда приходят упоминания и просроченные задачи.', side },
  ];
  return (
    <div className="flex flex-col items-center gap-6">
      <div data-tour-scope={scope} className="flex items-center gap-2">
        <Button data-tour="new" size="sm" leadingIcon={<Plus />}>
          Новая сделка
        </Button>
        <IconButton data-tour="search" size="sm" variant="secondary" icon={<Search />} aria-label="Поиск" />
        <IconButton data-tour="bell" size="sm" variant="secondary" icon={<Bell />} aria-label="Уведомления" />
      </div>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Начать тур
      </Button>
      <Tour open={open} onOpenChange={setOpen} steps={all.slice(0, steps)} />
    </div>
  );
}

const playground: Playground = {
  controls: [
    { name: 'steps', type: 'number', options: [1, 2, 3], default: 3, description: 'Сколько шагов (не больше пяти).' },
    { name: 'side', type: 'enum', options: sides, default: 'bottom', description: 'Сторона карточки от цели.' },
  ],
  render: (p) => <TourDemo side={p.pick('side', sides)} steps={p.num('steps')} />,
  code: (p) => `<Tour
  open={open}
  onOpenChange={setOpen}
  steps={[
${[
  "{ target: '#new-deal', title: 'Новая сделка', description: 'Начните с клиента и суммы.'",
  "{ target: '#search', title: 'Поиск', description: 'Сделки, контакты и файлы в одном поле.'",
  "{ target: '#notifications', title: 'Уведомления', description: 'Сюда приходят упоминания и просроченные задачи.'",
]
  .slice(0, p.num('steps'))
  .map((step) => `    ${step}${p.pick('side', sides) === 'bottom' ? '' : `, side: '${p.pick('side', sides)}'`} },`)
  .join('\n')}
  ]}
/>`,
};

export default playground;
