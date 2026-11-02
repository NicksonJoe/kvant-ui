import { useState } from 'react';
import { Avatar, Gantt, type GanttTask } from '@/kvant';

const tasks: GanttTask[] = [
  { id: 'brief', group: 'Дизайн', title: 'Бриф и исследование', start: '2026-10-27', end: '2026-10-31', progress: 1, assignee: <Avatar name="Анна Северова" size={20} /> },
  { id: 'proto', group: 'Дизайн', title: 'Прототип', start: '2026-11-02', end: '2026-11-06', progress: 0.7, dependsOn: ['brief'], assignee: <Avatar name="Вера Лебедева" size={20} /> },
  { id: 'pages', group: 'Дизайн', title: 'Макеты страниц', start: '2026-11-09', end: '2026-11-17', progress: 0.1, dependsOn: ['proto'], assignee: <Avatar name="Вера Лебедева" size={20} /> },
  { id: 'approved', group: 'Дизайн', title: 'Макеты согласованы', start: '2026-11-18', end: '2026-11-18', milestone: true, dependsOn: ['pages'] },
  { id: 'layout', group: 'Разработка', title: 'Вёрстка', start: '2026-11-19', end: '2026-11-27', progress: 0, color: 'var(--color-chart-3)', dependsOn: ['approved'], assignee: <Avatar name="Илья Громов" size={20} /> },
  { id: 'crm', group: 'Разработка', title: 'Интеграция с CRM', start: '2026-11-20', end: '2026-11-27', color: 'var(--color-chart-3)', risk: 'ждёт API · риск +2 дня', dependsOn: ['approved'], assignee: <Avatar name="Пётр Ильин" size={20} /> },
  { id: 'launch', group: 'Разработка', title: 'Запуск сайта', start: '2026-11-28', end: '2026-11-28', milestone: true, dependsOn: ['layout', 'crm'] },
];

export default function GanttProject() {
  const [selected, setSelected] = useState('proto');
  return (
    <Gantt
      aria-label="План работ: сайт для «Полюса»"
      className="w-full"
      tasks={tasks}
      from="2026-10-26"
      to="2026-11-29"
      today="2026-11-03"
      selectedId={selected}
      onSelect={setSelected}
    />
  );
}
