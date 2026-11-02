import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Gantt, type GanttTask } from '..';

const tasks: GanttTask[] = [
  { id: 'brief', group: 'Дизайн', title: 'Бриф и исследование', start: '2026-10-27', end: '2026-11-01', progress: 1 },
  { id: 'proto', group: 'Дизайн', title: 'Прототип', start: '2026-11-02', end: '2026-11-06', progress: 0.7, dependsOn: ['brief'] },
  { id: 'approved', group: 'Дизайн', title: 'Макеты согласованы', start: '2026-11-13', end: '2026-11-13', milestone: true, dependsOn: ['proto'] },
  { id: 'crm', group: 'Разработка', title: 'Интеграция с CRM', start: '2026-11-16', end: '2026-11-23', progress: 0, risk: 'ждёт API · риск +2 дня', dependsOn: ['approved'] },
];

describe('Gantt', () => {
  it('lists tasks by group with dates and progress in their names', () => {
    render(<Gantt aria-label="План работ" tasks={tasks} from="2026-10-26" to="2026-11-29" />);
    expect(screen.getByRole('group', { name: 'Дизайн, 3 задачи' })).toBeDefined();
    expect(screen.getByRole('group', { name: 'Разработка, 1 задача' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Прототип, 2 ноя – 6 ноя, готово 70 %' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Макеты согласованы, веха 13 ноя' })).toBeDefined();
    expect(screen.getByText('ждёт API · риск +2 дня')).toBeDefined();
  });

  it('places bars on the day grid and draws one link per dependency', () => {
    render(<Gantt aria-label="План работ" tasks={tasks} from="2026-10-26" to="2026-11-29" dayWidth={30} />);
    const bar = document.querySelector<HTMLElement>('[data-gantt-bar="proto"]');
    // 2 Nov is day 7 counted from 26 Oct; five days long
    expect(bar?.style.left).toBe('210px');
    expect(bar?.style.width).toBe('150px');
    expect(document.querySelectorAll('[data-slot=gantt-link]')).toHaveLength(3);
  });

  it('selects a task from its row and marks it', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Gantt aria-label="План работ" tasks={tasks} from="2026-10-26" to="2026-11-29" selectedId="brief" onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: /Бриф и исследование/ }).getAttribute('aria-pressed')).toBe('true');
    await user.click(screen.getByRole('button', { name: /Интеграция с CRM/ }));
    expect(onSelect).toHaveBeenCalledWith('crm');
  });
});
