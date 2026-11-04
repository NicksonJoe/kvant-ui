import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CanvasRunPanel, formatRunTime, runScale, type CanvasRunStep } from '../components/canvas-run';

const steps: CanvasRunStep[] = [
  { id: 'message', title: 'Новое сообщение', status: 'done', start: 0, duration: 80 },
  { id: 'parse', title: 'Разобрать заявку', status: 'running', start: 100, duration: 1500, detail: '840 токенов' },
  { id: 'budget', title: 'Есть бюджет?', status: 'waiting' },
  { id: 'deal', title: 'Создать сделку', status: 'waiting' },
  { id: 'reply', title: 'Ответить шаблоном', status: 'skipped', reason: 'пропущен — ветка «нет» не выбрана' },
];

describe('formatRunTime', () => {
  it('shows milliseconds under a second and tenths of seconds above', () => {
    expect(formatRunTime(80)).toBe('80 мс');
    expect(formatRunTime(1500)).toBe('1,5 с');
    expect(formatRunTime(14_000)).toBe('14 с');
  });
});

describe('runScale', () => {
  it('rounds the end up to half a second and ticks every half second', () => {
    expect(runScale(2300)).toEqual({ total: 2500, ticks: [0, 500, 1000, 1500, 2000, 2500] });
  });

  it('keeps about six ticks on long runs', () => {
    expect(runScale(14_200).ticks).toEqual([0, 5000, 10_000, 15_000]);
  });
});

describe('CanvasRunPanel', () => {
  it('names the run and says where it is', () => {
    render(<CanvasRunPanel title="Запуск № 24" status="running" elapsed={1600} steps={steps} testLabel="тест: «Заявка Ивана»" onStop={() => {}} />);
    const panel = screen.getByRole('region', { name: 'Запуск № 24' });
    expect(within(panel).getByRole('status').textContent).toBe('идёт · 1,6 с · шаг 2 из 5');
    expect(within(panel).getByText('тест: «Заявка Ивана»')).toBeTruthy();
  });

  it('lists steps with their state for the screen reader and selects one', () => {
    const onSelectStep = vi.fn();
    render(<CanvasRunPanel title="Запуск № 24" status="running" elapsed={1600} steps={steps} selectedStepId="parse" onSelectStep={onSelectStep} />);
    const parse = screen.getByRole('button', { name: 'Разобрать заявку, выполняется, 1,5 с · 840 токенов' });
    expect(parse.getAttribute('aria-current')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Новое сообщение, готово, 80 мс' }));
    expect(onSelectStep).toHaveBeenCalledWith('message');
    expect(screen.getByRole('button', { name: 'Ответить шаблоном, пропущен — ветка «нет» не выбрана' })).toBeTruthy();
  });

  it('stops a running run and hides «Остановить» when it is over', () => {
    const onStop = vi.fn();
    const { rerender } = render(<CanvasRunPanel title="Запуск № 24" status="running" steps={steps} onStop={onStop} />);
    fireEvent.click(screen.getByRole('button', { name: 'Остановить' }));
    expect(onStop).toHaveBeenCalledOnce();
    rerender(<CanvasRunPanel title="Запуск № 24" status="done" elapsed={2300} steps={steps} onStop={onStop} />);
    expect(screen.queryByRole('button', { name: 'Остановить' })).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('готово за 2,3 с');
  });

  it('collapses into a strip and opens again', () => {
    const onCollapsedChange = vi.fn();
    const { rerender } = render(<CanvasRunPanel title="Запуск № 24" status="running" steps={steps} onCollapsedChange={onCollapsedChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Свернуть панель запуска' }));
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    rerender(<CanvasRunPanel title="Запуск № 24" status="running" steps={steps} collapsed onCollapsedChange={onCollapsedChange} />);
    expect(screen.queryByRole('button', { name: /Новое сообщение/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Развернуть панель запуска' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('shows the output of the selected step as a table or JSON and pins it', () => {
    const onPin = vi.fn();
    render(
      <CanvasRunPanel
        title="Запуск № 24"
        status="running"
        steps={steps}
        selectedStepId="parse"
        input={{ text: 'Нужен сайт, бюджет 120 000' }}
        output={{ budget: 120000, task: 'Сайт' }}
        onPin={onPin}
      />,
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Выход' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Таблица' }));
    const table = screen.getByRole('table', { name: 'Выход шага «Разобрать заявку»' });
    expect(within(table).getAllByRole('row').map((row) => row.textContent)).toEqual(['budget120000', 'taskСайт']);
    fireEvent.click(screen.getByRole('button', { name: 'Закрепить как тестовые данные шага' }));
    expect(onPin).toHaveBeenCalledOnce();
  });
});
