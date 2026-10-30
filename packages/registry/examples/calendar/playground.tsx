import { Calendar } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

const playground: Playground = {
  controls: [{ name: 'weekends', type: 'boolean', default: false, description: 'Отключить выходные.' }],
  render: (p) => <Calendar isDateDisabled={p.bool('weekends') ? isWeekend : undefined} />,
  code: (p) =>
    p.bool('weekends') ? '<Calendar isDateDisabled={(date) => date.getDay() === 0 || date.getDay() === 6} />' : '<Calendar />',
};

export default playground;
