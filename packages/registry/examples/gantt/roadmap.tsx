import { Gantt, type GanttTask } from '@/kvant';

const tasks: GanttTask[] = [
  { id: 'research', title: 'Интервью с клиентами', start: '2026-11-02', end: '2026-11-13', progress: 1, color: 'var(--color-chart-7)' },
  { id: 'mvp', title: 'MVP счетов', start: '2026-11-16', end: '2026-12-04', progress: 0.35, color: 'var(--color-chart-1)', dependsOn: ['research'] },
  { id: 'beta', title: 'Бета для 10 студий', start: '2026-12-07', end: '2026-12-07', milestone: true, dependsOn: ['mvp'] },
];

export default function GanttRoadmap() {
  return <Gantt aria-label="Дорожная карта: счета" className="w-full" tasks={tasks} from="2026-11-02" to="2026-12-13" today="2026-11-20" dayWidth={20} />;
}
