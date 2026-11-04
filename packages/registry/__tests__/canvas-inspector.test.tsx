import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { pluralRu } from '../components/canvas-check';
import { CanvasInspector, InspectorEmpty, InspectorGroup, InspectorNote, InspectorOutputs, InstructionField, VariableChip, splitVariables } from '../components/canvas-inspector';

describe('pluralRu', () => {
  it('agrees the noun with the number', () => {
    const forms = ['ошибка', 'ошибки', 'ошибок'] as const;
    expect([1, 2, 5, 11, 21, 22].map((count) => pluralRu(count, forms))).toEqual(['ошибка', 'ошибки', 'ошибок', 'ошибок', 'ошибка', 'ошибки']);
  });
});

describe('splitVariables', () => {
  it('cuts text into plain parts and {{variables}}', () => {
    expect(splitVariables('Найди {{сообщение.текст}} и {{ заявка.budget }}.')).toEqual([
      { type: 'text', value: 'Найди ' },
      { type: 'variable', value: '{{сообщение.текст}}', path: 'сообщение.текст' },
      { type: 'text', value: ' и ' },
      { type: 'variable', value: '{{ заявка.budget }}', path: 'заявка.budget' },
      { type: 'text', value: '.' },
    ]);
  });

  it('leaves an unclosed {{ as text', () => {
    expect(splitVariables('набрать {{')).toEqual([{ type: 'text', value: 'набрать {{' }]);
  });
});

describe('CanvasInspector', () => {
  it('is a region named after the step with three tabs; runs show their count', () => {
    render(
      <CanvasInspector title="Новое сообщение" subtitle="Триггер · Telegram · шаг 1" params={<p>Бот</p>} data={<p>Вход и выход</p>} runs={<p>Список</p>} runCount={128} onClose={() => {}} />,
    );
    const region = screen.getByRole('region', { name: 'Новое сообщение' });
    expect(within(region).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Параметры', 'Данные', 'Запуски 128']);
    expect(within(region).getByText('Бот')).toBeTruthy();
    fireEvent.click(within(region).getByRole('tab', { name: 'Данные' }));
    expect(within(region).getByText('Вход и выход')).toBeTruthy();
  });

  it('says there were no runs', () => {
    render(<CanvasInspector title="Ответить шаблоном" params={<p>Шаблон</p>} runCount={0} />);
    expect(screen.getByRole('tab', { name: 'Запусков нет' })).toBeTruthy();
  });

  it('closes with the close button', () => {
    const onClose = vi.fn();
    render(<CanvasInspector title="Шаг" params={<p />} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть инспектор' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('warns how many errors block publishing', () => {
    const { rerender } = render(<CanvasInspector title="Шаг" params={<p />} errors={1} />);
    expect(screen.getByRole('alert').textContent).toBe('1 ошибка мешает публиковать');
    rerender(<CanvasInspector title="Шаг" params={<p />} errors={3} />);
    expect(screen.getByRole('alert').textContent).toBe('3 ошибки мешают публиковать');
  });

  it('without params it is a plain panel', () => {
    render(
      <CanvasInspector title="Заявка из Telegram → сделка" subtitle="Черновик">
        <InspectorEmpty steps={6} edges={5} warnings={2} />
      </CanvasInspector>,
    );
    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.getByText('Выберите шаг')).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Граф' }).textContent).toContain('Предупреждения2');
  });
});

describe('InspectorGroup and outputs', () => {
  it('names outputs with their types and values and adds a field', () => {
    const onAdd = vi.fn();
    render(
      <InspectorGroup label="Выходы" actionLabel="Поле" onAction={onAdd}>
        <InspectorOutputs
          aria-label="Выходы"
          outputs={[
            { name: 'budget', type: 'number', value: '120 000' },
            { name: 'клиент', type: 'object' },
          ]}
        />
      </InspectorGroup>,
    );
    const rows = within(screen.getByRole('list', { name: 'Выходы' })).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual(['budgetчисло120 000', 'клиентобъект']);
    fireEvent.click(screen.getByRole('button', { name: '+ Поле' }));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it('a variable chip shows the braces', () => {
    render(<VariableChip path="заявка.task" />);
    expect(screen.getByText('{{заявка.task}}')).toBeTruthy();
  });

  it('a note has a title and a line under it', () => {
    render(<InspectorNote title="Прошлый запуск — 3 мин назад">budget = 120 000, ветка «да»</InspectorNote>);
    expect(screen.getByText('Прошлый запуск — 3 мин назад')).toBeTruthy();
  });
});

describe('InstructionField', () => {
  it('edits text and highlights variables behind it', () => {
    const onValueChange = vi.fn();
    render(<InstructionField aria-label="Инструкция" defaultValue="Найди {{сообщение.текст}}" onValueChange={onValueChange} />);
    const field = screen.getByRole('textbox', { name: 'Инструкция' });
    expect(document.querySelector('[data-slot=instruction-variable]')?.textContent).toBe('{{сообщение.текст}}');
    fireEvent.change(field, { target: { value: 'Найди бюджет' } });
    expect(onValueChange).toHaveBeenCalledWith('Найди бюджет');
  });

  it('inserts a variable at the caret', () => {
    const onValueChange = vi.fn();
    render(<InstructionField aria-label="Инструкция" defaultValue="Найди  в тексте" variables={['сообщение.текст']} onValueChange={onValueChange} />);
    const field = screen.getByRole('textbox', { name: 'Инструкция' });
    if (!(field instanceof HTMLTextAreaElement)) throw new Error('not a textarea');
    field.setSelectionRange(6, 6);
    fireEvent.click(screen.getByRole('button', { name: 'Вставить {{сообщение.текст}}' }));
    expect(onValueChange).toHaveBeenCalledWith('Найди {{сообщение.текст}} в тексте');
  });
});
