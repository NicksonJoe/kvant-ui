import { useState } from 'react';
import { Gantt, type GanttChange, type GanttTask } from '@/kvant';

const initialTasks: GanttTask[] = [
  { id: 'calls', group: 'Марина Котова', title: 'Обзвон тёплых заявок', start: '2026-11-09', end: '2026-11-11', progress: 0.6, color: 'var(--color-chart-2)' },
  { id: 'offer', group: 'Марина Котова', title: 'КП для «Северной верфи»', start: '2026-11-12', end: '2026-11-13', color: 'var(--color-chart-2)', dependsOn: ['calls'] },
  { id: 'deal', group: 'Марина Котова', title: 'Сделка на 480\u00a0000\u00a0₽', start: '2026-11-18', end: '2026-11-18', milestone: true, dependsOn: ['offer'] },
  { id: 'import', group: 'Олег Рябов', title: 'Импорт базы из Excel', start: '2026-11-09', end: '2026-11-10', progress: 1, color: 'var(--color-chart-5)' },
  { id: 'dedupe', group: 'Олег Рябов', title: 'Склейка дублей клиентов', start: '2026-11-11', end: '2026-11-16', progress: 0.2, color: 'var(--color-chart-5)', dependsOn: ['import'] },
  { id: 'report', group: 'Олег Рябов', title: 'Отчёт по источникам заявок', start: '2026-11-17', end: '2026-11-20', color: 'var(--color-chart-5)', dependsOn: ['dedupe'] },
];

export default function GanttSprint() {
  const [tasks, setTasks] = useState(initialTasks);
  const [collapsed, setCollapsed] = useState<readonly string[]>(['Олег Рябов']);
  const onChange = (change: GanttChange) => setTasks((list) => list.map((task) => (task.id === change.id ? { ...task, ...change } : task)));
  return (
    <Gantt
      aria-label="Спринт отдела продаж, 9–20 ноября"
      className="w-full"
      tasks={tasks}
      from="2026-11-09"
      to="2026-11-22"
      min="2026-11-09"
      max="2026-11-20"
      today="2026-11-11"
      dayWidth={40}
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
      onChange={onChange}
    />
  );
}
