import { Button, FocusGroup } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const periods = ['Сегодня', 'Неделя', 'Месяц', 'Год'];

const playground: Playground = {
  render: (p) => {
    const orientation = p.pick('orientation', ['horizontal', 'vertical'] as const);
    return (
      <FocusGroup aria-label="Период" orientation={orientation} loop={p.bool('loop')} className={orientation === 'vertical' ? 'flex flex-col gap-2' : 'flex gap-2'}>
        {periods.map((period) => (
          <Button key={period} variant="secondary" size="sm">
            {period}
          </Button>
        ))}
      </FocusGroup>
    );
  },
  code: (p) => `<FocusGroup aria-label="Период"${p.attrs(['orientation', 'loop'])}>
  <Button variant="secondary" size="sm">Сегодня</Button>
  <Button variant="secondary" size="sm">Неделя</Button>
  <Button variant="secondary" size="sm">Месяц</Button>
  <Button variant="secondary" size="sm">Год</Button>
</FocusGroup>`,
};

export default playground;
