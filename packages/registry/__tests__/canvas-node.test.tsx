import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  CanvasAddStep,
  CanvasGroupFrame,
  CanvasNodeCard,
  CanvasNodePeek,
  CanvasNodeTable,
  CanvasNodeToolbar,
  CanvasNote,
  CanvasSubflowBreadcrumbs,
  CanvasToolbarButton,
  CanvasToolbarSeparator,
} from '../components/canvas-node';

const card = () => document.querySelector('[data-slot=canvas-node]') as HTMLElement;

describe('CanvasNodeCard', () => {
  it('shows the kind tile, title, kind subtitle and the summary chip', () => {
    render(<CanvasNodeCard kind="action" title="Создать сделку" summary="этап: Неразобранное" />);
    expect(card()?.getAttribute('data-kind')).toBe('action');
    expect(card()?.getAttribute('data-size')).toBe('full');
    expect(screen.getByText('Создать сделку')).toBeTruthy();
    expect(screen.getByText('Действие')).toBeTruthy();
    expect(screen.getByText('этап: Неразобранное')).toBeTruthy();
  });

  it('replaces the summary with the run status and names the corner badge', () => {
    const { rerender } = render(
      <CanvasNodeCard kind="action" title="Создать сделку" summary="этап" status="running" statusText="Выполняется · 1,2 с" />,
    );
    expect(screen.queryByText('этап')).toBeNull();
    expect(screen.getByText('Выполняется · 1,2 с')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Выполняется' })).toBeTruthy();
    expect(card()?.getAttribute('data-status')).toBe('running');

    rerender(<CanvasNodeCard kind="action" title="Создать сделку" summary="этап" status="done" />);
    expect(screen.getByText('этап')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Готово' })).toBeTruthy();

    rerender(<CanvasNodeCard kind="action" title="Создать сделку" status="idle" />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('makes the error chip a button that opens the log', async () => {
    const onStatusClick = vi.fn();
    render(<CanvasNodeCard kind="action" title="Создать сделку" status="error" statusText="Сервис занят · Повторить" onStatusClick={onStatusClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Сервис занят · Повторить' }));
    expect(onStatusClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('img', { name: 'Ошибка' })).toBeTruthy();
  });

  it('marks selection, group selection and disabled for the engine', () => {
    const { rerender } = render(<CanvasNodeCard kind="trigger" title="Новое сообщение" selected />);
    expect(card()?.getAttribute('data-selected')).toBe('single');
    rerender(<CanvasNodeCard kind="trigger" title="Новое сообщение" selected="group" />);
    expect(card()?.getAttribute('data-selected')).toBe('group');
    rerender(<CanvasNodeCard kind="trigger" title="Новое сообщение" disabled />);
    expect(card()?.hasAttribute('data-selected')).toBe(false);
    expect(card()?.hasAttribute('data-disabled')).toBe(true);
    expect(screen.getByText('Выключен').classList.contains('sr-only')).toBe(true);
  });

  it('collapses to the title pill: no subtitle, no chip', () => {
    render(<CanvasNodeCard kind="condition" title="Есть бюджет?" summary="budget ≥ 50 000" size="collapsed" />);
    expect(card()?.getAttribute('data-size')).toBe('collapsed');
    expect(screen.getByText('Есть бюджет?')).toBeTruthy();
    expect(screen.queryByText('Условие')).toBeNull();
    expect(screen.queryByText('budget ≥ 50 000')).toBeNull();
  });

  it('shows the last value, resilience badges, retry, pin, output count and the changed dot', () => {
    const { rerender } = render(
      <CanvasNodeCard
        kind="trigger"
        title="Новое сообщение"
        subtitle="Триггер · Telegram"
        preview={{ value: '«Нужен сайт»', time: '3 мин назад' }}
        retries={3}
        timeout="30 с"
        fallback="ветка «сбой»"
        outputCount={12}
        changed
      />,
    );
    expect(screen.getByText('«Нужен сайт»')).toBeTruthy();
    expect(screen.getByText('3 мин назад')).toBeTruthy();
    expect(screen.getByText('3 повтора')).toBeTruthy();
    expect(screen.getByText('30 с')).toBeTruthy();
    expect(screen.getByText('ветка «сбой»')).toBeTruthy();
    expect(screen.getByLabelText('Прошло через выход: 12')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Изменён после публикации' })).toBeTruthy();

    rerender(<CanvasNodeCard kind="action" title="Выставить счёт" retrying="Повтор 2 из 3 · через 10 с" pinned="Закреплено · 3 поля" />);
    expect(screen.getByText('Повтор 2 из 3 · через 10 с')).toBeTruthy();
    expect(screen.queryByText('Закреплено · 3 поля')).toBeNull();

    rerender(<CanvasNodeCard kind="action" title="Выставить счёт" pinned="Закреплено · 3 поля" />);
    expect(screen.getByText('Закреплено · 3 поля')).toBeTruthy();
  });

  it('lists up to four agent steps, then «ещё N», with usage and price', () => {
    render(
      <CanvasNodeCard
        kind="agent"
        title="Ответить клиенту"
        steps={[
          { label: 'Прочитал переписку', state: 'done' },
          { label: 'Нашёл сделку', state: 'done' },
          { label: 'Пишет ответ', state: 'running' },
          { label: 'Отправит в Telegram', state: 'pending' },
          { label: 'Закроет задачу', state: 'pending' },
          { label: 'Поставит напоминание', state: 'pending' },
        ]}
        usage="1,2 с · 640 токенов"
        price="0,4 ₽"
      />,
    );
    const steps = screen.getByRole('list', { name: 'Шаги агента' });
    expect(within(steps).getAllByRole('listitem')).toHaveLength(5);
    expect(within(steps).getByText('ещё 2')).toBeTruthy();
    expect(within(steps).getByText('Пишет ответ').closest('li')?.getAttribute('aria-current')).toBe('step');
    expect(screen.getByText('0,4 ₽')).toBeTruthy();
  });

  it('shows who is here: three avatars, then +N, and the editor tag with ring', () => {
    render(
      <CanvasNodeCard
        kind="action"
        title="Сменить этап"
        people={[
          { name: 'Ирина', color: 'var(--color-chart-2)', editing: true },
          { name: 'Алексей', color: 'var(--color-chart-6)' },
          { name: 'Мария', color: 'var(--color-chart-3)' },
          { name: 'Пётр', color: 'var(--color-chart-8)' },
        ]}
      />,
    );
    expect(screen.getByText('Ирина правит')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Ирина' })).toBeTruthy();
    expect(screen.getByText('+1')).toBeTruthy();
    expect(card()?.hasAttribute('data-editing')).toBe(true);
  });

  it('puts a service logo into the tile instead of the kind icon', () => {
    render(
      <CanvasNodeCard
        kind="action"
        title="Выставить счёт"
        logo={{ name: '1С', background: '#FFD400', color: '#C8102E', content: '1С' }}
      />,
    );
    const tile = document.querySelector('[data-slot=canvas-node-tile]') as HTMLElement;
    expect(tile?.getAttribute('aria-label')).toBe('1С');
    expect(tile.style.backgroundColor).not.toBe('');
  });
});

describe('special nodes', () => {
  it('table node lists fields with keys and marks them for the engine ports', () => {
    render(
      <CanvasNodeTable
        title="Сделки"
        count="1 284 записи"
        fields={[
          { name: 'id', type: 'uuid', key: 'primary' },
          { name: 'title', type: 'текст' },
          { name: 'client_id', type: 'Клиенты', key: 'foreign', highlighted: true },
        ]}
      />,
    );
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(rows[0]?.getAttribute('data-field')).toBe('id');
    expect(within(rows[0] as HTMLElement).getByText('ID')).toBeTruthy();
    expect(rows[2]?.hasAttribute('data-highlighted')).toBe(true);
    expect(screen.getByRole('table', { name: 'Сделки' })).toBeTruthy();
  });

  it('add-step placeholder is a button with the Tab hint', async () => {
    const onClick = vi.fn();
    render(<CanvasAddStep onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: /Добавить шаг/ }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Tab')).toBeTruthy();
  });

  it('note shows text and author', () => {
    render(
      <CanvasNote author={{ name: 'Анна', color: 'var(--color-chart-2)' }} time="2 мин назад">
        Порог бюджета согласовать с Игорем
      </CanvasNote>,
    );
    expect(screen.getByText('Порог бюджета согласовать с Игорем')).toBeTruthy();
    expect(screen.getByText('Анна · 2 мин назад')).toBeTruthy();
  });

  it('peek card lists input and output of the last run', () => {
    render(
      <CanvasNodePeek
        title="Последний запуск"
        meta="3 мин назад · 12 из 12"
        rows={[
          { label: 'вход', value: 'Иван Петров · сайт' },
          { label: 'выход', value: 'сделка № 1284' },
        ]}
      />,
    );
    expect(screen.getByText('вход')).toBeTruthy();
    expect(screen.getByText('сделка № 1284')).toBeTruthy();
  });
});

describe('toolbar, group and subflow', () => {
  it('toolbar is one tab stop with arrow navigation and named icon buttons', async () => {
    const onRun = vi.fn();
    render(
      <CanvasNodeToolbar aria-label="Действия с шагом">
        <CanvasToolbarButton label="Запустить шаг" onClick={onRun}>
          Шаг
        </CanvasToolbarButton>
        <CanvasToolbarSeparator />
        <CanvasToolbarButton label="Дублировать" icon={<span />} />
        <CanvasToolbarButton label="Отключить" icon={<span />} />
      </CanvasNodeToolbar>,
    );
    expect(screen.getByRole('toolbar', { name: 'Действия с шагом' })).toBeTruthy();
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Шаг' }));
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Дублировать' }));
    await userEvent.click(screen.getByRole('button', { name: 'Шаг' }));
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it('group frame folds and opens as a graph; folded it becomes a stack with the count', async () => {
    const onCollapsedChange = vi.fn();
    const onOpen = vi.fn();
    const { rerender } = render(
      <CanvasGroupFrame title="Обработка оплаты" count={3} onCollapsedChange={onCollapsedChange} onOpen={onOpen}>
        <span>шаги</span>
      </CanvasGroupFrame>,
    );
    const fold = screen.getByRole('button', { name: 'Свернуть группу «Обработка оплаты»' });
    expect(fold?.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('3 шага')).toBeTruthy();
    await userEvent.click(fold);
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    await userEvent.click(screen.getByRole('button', { name: 'Открыть как граф' }));
    expect(onOpen).toHaveBeenCalledTimes(1);

    rerender(
      <CanvasGroupFrame title="Обработка оплаты" count={3} collapsed onCollapsedChange={onCollapsedChange}>
        <span>шаги</span>
      </CanvasGroupFrame>,
    );
    expect(screen.queryByText('шаги')).toBeNull();
    expect(screen.getByText('Подпоток · 3 шага')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Развернуть группу «Обработка оплаты»' }));
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
  });

  it('subflow crumbs go back on click and on Esc', async () => {
    const onBack = vi.fn();
    render(<CanvasSubflowBreadcrumbs parent="Заявка → сделка" current="Обработка оплаты" onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: 'Назад к «Заявка → сделка»' }));
    await userEvent.keyboard('{Escape}');
    expect(onBack).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Обработка оплаты')?.getAttribute('aria-current')).toBe('page');
  });
});
