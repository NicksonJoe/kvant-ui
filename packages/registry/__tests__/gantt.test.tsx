import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Gantt, type GanttChange, type GanttProps, type GanttTask } from '..';

const tasks: GanttTask[] = [
  { id: 'brief', group: 'Дизайн', title: 'Бриф и исследование', start: '2026-10-27', end: '2026-11-01', progress: 1 },
  { id: 'proto', group: 'Дизайн', title: 'Прототип', start: '2026-11-02', end: '2026-11-06', progress: 0.7, dependsOn: ['brief'] },
  { id: 'approved', group: 'Дизайн', title: 'Макеты согласованы', start: '2026-11-13', end: '2026-11-13', milestone: true, dependsOn: ['proto'] },
  { id: 'crm', group: 'Разработка', title: 'Интеграция с CRM', start: '2026-11-16', end: '2026-11-23', progress: 0, risk: 'ждёт API · риск +2 дня', dependsOn: ['approved'] },
];

const range = { from: '2026-10-26', to: '2026-11-29' } as const;
const bar = (id: string) => document.querySelector<HTMLElement>(`[data-gantt-bar="${id}"]`);
const edge = (id: string, side: 'start' | 'end') => document.querySelector<HTMLElement>(`[data-gantt-bar="${id}"] [data-gantt-edge="${side}"]`);
const tooltip = () => document.querySelector<HTMLElement>('[data-slot=gantt-tooltip]');
const status = () => screen.getByRole('status').textContent;

/** Press at x and move through the next points; the pointer stays down. */
function drag(target: HTMLElement | null, x: number, ...moves: number[]) {
  if (!target) throw new Error('no drag target');
  fireEvent.pointerDown(target, { clientX: x, clientY: 10, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 });
  for (const to of moves) fireEvent.pointerMove(target, { clientX: to, clientY: 10, pointerId: 1, pointerType: 'mouse', buttons: 1 });
}
const release = (target: HTMLElement | null) => {
  if (target) fireEvent.pointerUp(target, { pointerId: 1, pointerType: 'mouse' });
};

/** Keeps the dates Gantt reports, like a real screen does. */
function Editable(props: Partial<GanttProps>) {
  const [list, setList] = useState<readonly GanttTask[]>(tasks);
  const onChange = (change: GanttChange) => {
    props.onChange?.(change);
    setList((current) => current.map((task) => (task.id === change.id ? { ...task, start: change.start, end: change.end } : task)));
  };
  return <Gantt aria-label="План работ" {...range} {...props} tasks={list} onChange={onChange} />;
}

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

describe('Gantt groups', () => {
  it('collapses a group from its header: rows and bars go, the summary bar stays, the next group moves up', () => {
    const onCollapsedChange = vi.fn();
    render(<Gantt aria-label="План работ" tasks={tasks} {...range} onCollapsedChange={onCollapsedChange} />);
    const header = screen.getByRole('button', { name: 'Дизайн' });
    expect(header.getAttribute('aria-expanded')).toBe('true');
    const crmTop = bar('crm')?.style.top;

    fireEvent.click(header);
    expect(header.getAttribute('aria-expanded')).toBe('false');
    expect(onCollapsedChange).toHaveBeenLastCalledWith(['Дизайн']);
    expect(screen.queryByText('Прототип')).toBeNull();
    expect(bar('proto')).toBeNull();
    expect(document.querySelectorAll('[data-slot=gantt-summary]')).toHaveLength(2);
    expect(bar('crm')?.style.top).not.toBe(crmTop);
    // links into hidden rows have nowhere to go
    expect(document.querySelectorAll('[data-slot=gantt-link]')).toHaveLength(0);
    // the group keeps its name and count while collapsed
    expect(screen.getByRole('group', { name: 'Дизайн, 3 задачи' })).toBeDefined();

    fireEvent.click(header);
    expect(header.getAttribute('aria-expanded')).toBe('true');
    expect(onCollapsedChange).toHaveBeenLastCalledWith([]);
    expect(bar('proto')).not.toBeNull();
  });

  it('starts collapsed from defaultCollapsed', () => {
    render(<Gantt aria-label="План работ" tasks={tasks} {...range} defaultCollapsed={['Разработка']} />);
    expect(screen.getByRole('button', { name: 'Разработка' }).getAttribute('aria-expanded')).toBe('false');
    expect(bar('crm')).toBeNull();
  });

  it('follows the collapsed prop and only reports clicks', async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    render(<Gantt aria-label="План работ" tasks={tasks} {...range} collapsed={['Дизайн']} onCollapsedChange={onCollapsedChange} />);
    await user.click(screen.getByRole('button', { name: 'Дизайн' }));
    expect(onCollapsedChange).toHaveBeenCalledWith([]);
    expect(screen.getByRole('button', { name: 'Дизайн' }).getAttribute('aria-expanded')).toBe('false');
    expect(bar('proto')).toBeNull();
  });

  it('toggles a group with Enter and Space', async () => {
    const user = userEvent.setup();
    render(<Gantt aria-label="План работ" tasks={tasks} {...range} />);
    const header = screen.getByRole('button', { name: 'Дизайн' });
    header.focus();
    await user.keyboard('{Enter}');
    expect(header.getAttribute('aria-expanded')).toBe('false');
    await user.keyboard(' ');
    expect(header.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('Gantt dragging', () => {
  it('moves a bar by whole days, shows the dates while dragging and reports them on release', () => {
    const onChange = vi.fn();
    render(<Gantt aria-label="План работ" tasks={tasks} {...range} dayWidth={30} onChange={onChange} />);
    const target = bar('proto');
    // 65 px at 30 px a day snaps to two days
    drag(target, 300, 330, 365);
    expect(target?.style.left).toBe('270px');
    expect(target?.style.width).toBe('150px');
    expect(target?.hasAttribute('data-dragging')).toBe(true);
    expect(tooltip()?.textContent).toBe('4 ноя – 8 ноя · 5 дней');
    expect(onChange).not.toHaveBeenCalled();
    release(target);
    expect(onChange).toHaveBeenCalledWith({ id: 'proto', start: '2026-11-04', end: '2026-11-08' });
    expect(tooltip()).toBeNull();
    expect(status()).toBe('Прототип: 4 ноя – 8 ноя, 5 дней');
    // controlled: until the parent passes new dates the bar shows the old ones
    expect(target?.style.left).toBe('210px');
  });

  it('works with touch the same way', () => {
    const onChange = vi.fn();
    render(<Gantt aria-label="План работ" tasks={tasks} {...range} onChange={onChange} />);
    const target = bar('proto');
    if (!target) throw new Error('no bar');
    fireEvent.pointerDown(target, { clientX: 100, clientY: 10, pointerId: 7, pointerType: 'touch', button: 0 });
    // a second finger does not take over
    fireEvent.pointerMove(target, { clientX: 400, clientY: 12, pointerId: 8, pointerType: 'touch' });
    fireEvent.pointerMove(target, { clientX: 70, clientY: 12, pointerId: 7, pointerType: 'touch' });
    fireEvent.pointerUp(target, { clientX: 70, clientY: 12, pointerId: 7, pointerType: 'touch' });
    expect(onChange).toHaveBeenCalledWith({ id: 'proto', start: '2026-11-01', end: '2026-11-05' });
  });

  it('keeps the dates the parent stores', () => {
    render(<Editable />);
    const target = bar('proto');
    drag(target, 300, 330);
    release(target);
    expect(bar('proto')?.style.left).toBe('240px');
    expect(screen.getByRole('button', { name: 'Прототип, 3 ноя – 7 ноя, готово 70 %' })).toBeDefined();
  });

  it('resizes from the end and from the start, never shorter than a day', () => {
    const onChange = vi.fn();
    render(<Gantt aria-label="План работ" tasks={tasks} {...range} dayWidth={30} onChange={onChange} />);
    drag(edge('proto', 'end'), 300, 330);
    expect(tooltip()?.textContent).toBe('2 ноя – 7 ноя · 6 дней');
    release(edge('proto', 'end'));
    expect(onChange).toHaveBeenLastCalledWith({ id: 'proto', start: '2026-11-02', end: '2026-11-07' });

    drag(edge('proto', 'start'), 300, 240);
    expect(bar('proto')?.style.left).toBe('150px');
    release(edge('proto', 'start'));
    expect(onChange).toHaveBeenLastCalledWith({ id: 'proto', start: '2026-10-31', end: '2026-11-06' });

    drag(edge('proto', 'start'), 300, 900);
    expect(tooltip()?.textContent).toBe('6 ноя · 1 день');
    release(edge('proto', 'start'));
    expect(onChange).toHaveBeenLastCalledWith({ id: 'proto', start: '2026-11-06', end: '2026-11-06' });
  });

  it('puts the bar back on Escape and reports nothing', () => {
    const onChange = vi.fn();
    render(<Gantt aria-label="План работ" tasks={tasks} {...range} onChange={onChange} />);
    const target = bar('proto');
    drag(target, 300, 400);
    expect(target?.style.left).not.toBe('210px');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(target?.style.left).toBe('210px');
    expect(tooltip()).toBeNull();
    release(target);
    expect(onChange).not.toHaveBeenCalled();
    expect(status()).toBe('Перетаскивание отменено');
  });

  it('selects on press and does not report a press without a move', () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    render(<Gantt aria-label="План работ" tasks={tasks} {...range} onChange={onChange} onSelect={onSelect} />);
    drag(bar('crm'), 300, 310);
    release(bar('crm'));
    expect(onSelect).toHaveBeenCalledWith('crm');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('stops at min and max', () => {
    const onChange = vi.fn();
    render(<Gantt aria-label="План работ" tasks={tasks} {...range} min="2026-10-27" max="2026-11-08" onChange={onChange} />);
    drag(bar('proto'), 300, 600);
    release(bar('proto'));
    expect(onChange).toHaveBeenLastCalledWith({ id: 'proto', start: '2026-11-04', end: '2026-11-08' });

    // brief already starts on min: it cannot move earlier, only stretch later
    drag(edge('brief', 'start'), 300, 150);
    release(edge('brief', 'start'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('stops at the visible range without min and max', () => {
    const onChange = vi.fn();
    render(<Gantt aria-label="План работ" tasks={tasks} {...range} onChange={onChange} />);
    drag(bar('brief'), 300, 150);
    release(bar('brief'));
    expect(onChange).toHaveBeenLastCalledWith({ id: 'brief', start: '2026-10-26', end: '2026-10-31' });

    drag(edge('crm', 'end'), 300, 800);
    release(edge('crm', 'end'));
    expect(onChange).toHaveBeenLastCalledWith({ id: 'crm', start: '2026-11-16', end: '2026-11-29' });
  });

  it('moves a milestone as one day, without resize edges', () => {
    const onChange = vi.fn();
    render(<Gantt aria-label="План работ" tasks={tasks} {...range} onChange={onChange} />);
    expect(document.querySelector('[data-gantt-bar="approved"] [data-gantt-edge]')).toBeNull();
    drag(bar('approved'), 300, 330);
    expect(tooltip()?.textContent).toBe('14 ноя');
    release(bar('approved'));
    expect(onChange).toHaveBeenCalledWith({ id: 'approved', start: '2026-11-14', end: '2026-11-14' });
  });

  it('is read-only without onChange', () => {
    render(<Gantt aria-label="План работ" tasks={tasks} {...range} />);
    expect(document.querySelector('[data-gantt-edge]')).toBeNull();
    drag(bar('proto'), 300, 400);
    expect(bar('proto')?.style.left).toBe('210px');
    expect(tooltip()).toBeNull();
    release(bar('proto'));
  });
});

describe('Gantt keyboard', () => {
  it('is one tab stop; arrows, Home and End walk the visible rows', async () => {
    const user = userEvent.setup();
    render(<Gantt aria-label="План работ" tasks={tasks} {...range} />);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Дизайн' }));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Бриф и исследование/ }));
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Интеграция с CRM/ }));
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Разработка' }));
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Дизайн' }));
    await user.keyboard('{Enter}{ArrowDown}');
    // the collapsed group's tasks are skipped
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Разработка' }));
    expect(document.querySelectorAll('[data-slot=gantt] button[tabindex="0"]')).toHaveLength(1);
  });

  it('starts from the selected task', async () => {
    const user = userEvent.setup();
    render(<Gantt aria-label="План работ" tasks={tasks} {...range} selectedId="proto" />);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Прототип/ }));
  });

  it('moves the focused task by a day with ← → and changes its length with Shift', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Editable onChange={onChange} />);
    const row = screen.getByRole('button', { name: /Прототип/ });
    expect(row.getAttribute('aria-keyshortcuts')).toBe('ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight');
    row.focus();

    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith({ id: 'proto', start: '2026-11-03', end: '2026-11-07' });
    expect(status()).toBe('Прототип: 3 ноя – 7 ноя, 5 дней');

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith({ id: 'proto', start: '2026-11-01', end: '2026-11-05' });

    await user.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(onChange).toHaveBeenLastCalledWith({ id: 'proto', start: '2026-11-01', end: '2026-11-06' });
    expect(status()).toBe('Прототип: 1 ноя – 6 ноя, 6 дней');

    await user.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{/Shift}');
    expect(onChange).toHaveBeenLastCalledWith({ id: 'proto', start: '2026-11-01', end: '2026-11-04' });
    // focus stays on the same row after its label changes
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Прототип/ }));
  });

  it('says why a task does not move at a limit', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Editable onChange={onChange} min="2026-10-27" />);
    screen.getByRole('button', { name: /Бриф/ }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(onChange).not.toHaveBeenCalled();
    expect(status()).toBe('Раньше 27 окт нельзя');

    screen.getByRole('button', { name: /Интеграция с CRM/ }).focus();
    await user.keyboard('{Shift>}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{/Shift}');
    expect(onChange).toHaveBeenLastCalledWith({ id: 'crm', start: '2026-11-16', end: '2026-11-29' });
    expect(status()).toBe('Позже 29 ноя нельзя');

    screen.getByRole('button', { name: /Прототип/ }).focus();
    await user.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');
    expect(onChange).toHaveBeenLastCalledWith({ id: 'proto', start: '2026-11-02', end: '2026-11-02' });
    expect(status()).toBe('Короче одного дня нельзя');
  });

  it('moves a milestone with ← → and ignores Shift on it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Editable onChange={onChange} />);
    screen.getByRole('button', { name: /Макеты согласованы/ }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith({ id: 'approved', start: '2026-11-12', end: '2026-11-12' });
    expect(status()).toBe('Макеты согласованы: веха 12 ноя');
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('does not change dates without onChange', async () => {
    const user = userEvent.setup();
    render(<Gantt aria-label="План работ" tasks={tasks} {...range} />);
    const row = screen.getByRole('button', { name: /Прототип/ });
    row.focus();
    await user.keyboard('{ArrowRight}');
    expect(bar('proto')?.style.left).toBe('210px');
    expect(row.getAttribute('aria-keyshortcuts')).toBeNull();
  });
});
