import { useState } from 'react';
import { Gantt, type GanttChange, type GanttTask } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const initialTasks: GanttTask[] = [
  { id: 'brief', group: 'Дизайн', title: 'Бриф', start: '2026-11-02', end: '2026-11-04', progress: 1 },
  { id: 'proto', group: 'Дизайн', title: 'Прототип', start: '2026-11-05', end: '2026-11-11', progress: 0.5, dependsOn: ['brief'] },
  { id: 'done', group: 'Дизайн', title: 'Макеты согласованы', start: '2026-11-13', end: '2026-11-13', milestone: true, dependsOn: ['proto'] },
];

function Demo({ dayWidth, editable }: { dayWidth: number; editable: boolean }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selected, setSelected] = useState('proto');
  const onChange = (change: GanttChange) => setTasks((list) => list.map((task) => (task.id === change.id ? { ...task, ...change } : task)));
  return (
    <Gantt
      aria-label="План"
      className="w-full"
      tasks={tasks}
      from="2026-11-02"
      to="2026-11-15"
      today="2026-11-06"
      dayWidth={dayWidth}
      selectedId={selected}
      onSelect={setSelected}
      onChange={editable ? onChange : undefined}
    />
  );
}

const playground: Playground = {
  controls: [{ name: 'editable', type: 'boolean', default: true, description: 'Передать onChange: перетаскивание, края и ← → на строках.' }],
  render: (p) => <Demo dayWidth={p.num('dayWidth')} editable={p.bool('editable')} />,
  code: (p) =>
    `<Gantt aria-label="План" tasks={tasks} from="2026-11-02" to="2026-11-15" today="2026-11-06"${p.attrs(['dayWidth'])}${p.bool('editable') ? ' onChange={moveTask}' : ''} />`,
};

export default playground;
