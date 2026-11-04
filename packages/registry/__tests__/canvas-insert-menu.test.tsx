import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  CanvasGraphSearch,
  CanvasHistoryPanel,
  CanvasInsertMenu,
  CanvasNodeMenuContent,
  CanvasPaneMenuContent,
  type CanvasSearchResult,
} from '../components/canvas-insert-menu';
import { ContextMenu, ContextMenuTrigger } from '../components/menu';
import type { CanvasStepGroup, CanvasStepTemplate } from '../components/step-palette';

const notifyManager: CanvasStepTemplate = { id: 'notify-manager', kind: 'action', title: 'Уведомить менеджера' };
const groups: CanvasStepGroup[] = [
  {
    id: 'actions',
    title: 'Действия',
    items: [
      { id: 'notify-tg', kind: 'action', title: 'Уведомление в Telegram' },
      { id: 'create-deal', kind: 'action', title: 'Создать сделку' },
    ],
  },
  { id: 'logic', title: 'Логика', items: [{ id: 'wait-payment', kind: 'wait', title: 'Ждать уведомления о платеже' }] },
];
const templates: CanvasStepTemplate[] = [{ id: 'notify-wait', kind: 'group', title: 'Уведомить и ждать ответа · 3 шага' }];

function Insert(props: { onInsert: (template: CanvasStepTemplate, options: { open: boolean }) => void; onClose?: () => void }) {
  return (
    <CanvasInsertMenu
      context="после «Создать сделку»"
      suggestions={[{ template: notifyManager, reason: 'чаще всего ставят после создания сделки' }]}
      groups={groups}
      templates={templates}
      onClose={props.onClose ?? vi.fn()}
      onInsert={props.onInsert}
    />
  );
}

describe('CanvasInsertMenu', () => {
  it('opens focused with the suggestion first and sections named', () => {
    render(<Insert onInsert={vi.fn()} />);
    const input = screen.getByRole('combobox', { name: 'Вставить шаг' });
    expect(document.activeElement).toBe(input);
    expect(screen.getByText('после «Создать сделку»')).toBeTruthy();
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByRole('group', { name: 'Норда предлагает' })).toBeTruthy();
    expect(within(listbox).getByRole('group', { name: 'Шаги' })).toBeTruthy();
    expect(within(listbox).getByRole('group', { name: 'Шаблоны' })).toBeTruthy();
    const first = within(listbox).getAllByRole('option')[0] as HTMLElement;
    expect(first.getAttribute('aria-selected')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe(first.id);
  });

  it('filters across sections, ↓ moves, Enter inserts, ⇧Enter inserts and opens', async () => {
    const onInsert = vi.fn();
    render(<Insert onInsert={onInsert} />);
    await userEvent.keyboard('увед');
    expect(screen.queryByRole('option', { name: /Создать сделку/ })).toBeNull();
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options[1]?.querySelector('mark')?.textContent).toBe('Увед');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onInsert).toHaveBeenLastCalledWith(groups[0]?.items[0], { open: false });
    await userEvent.keyboard('{ArrowUp}{Shift>}{Enter}{/Shift}');
    expect(onInsert).toHaveBeenLastCalledWith(notifyManager, { open: true });
  });

  it('inserts on click, says when nothing matches, closes on Esc', async () => {
    const onInsert = vi.fn();
    const onClose = vi.fn();
    render(<Insert onInsert={onInsert} onClose={onClose} />);
    await userEvent.click(screen.getByRole('option', { name: /Уведомить и ждать ответа/ }));
    expect(onInsert).toHaveBeenLastCalledWith(templates[0], { open: false });
    await userEvent.type(screen.getByRole('combobox'), 'zzz');
    expect(screen.getByText('Ничего не нашлось')).toBeTruthy();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

/** Host the way a canvas does it: a trigger opens the menu, every close unmounts it. */
function Hosted({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const close = () => {
    onClose?.();
    setOpen(false);
  };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Добавить шаг
      </button>
      <button type="button">Снаружи</button>
      {open ? <CanvasInsertMenu groups={groups} onInsert={close} onClose={close} /> : null}
    </>
  );
}

describe('CanvasInsertMenu focus', () => {
  it('Esc returns focus to where it was before the menu opened', async () => {
    render(<Hosted />);
    await userEvent.click(screen.getByRole('button', { name: 'Добавить шаг' }));
    expect(document.activeElement).toBe(screen.getByRole('combobox'));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Добавить шаг' }));
  });

  it('inserting also returns focus', async () => {
    render(<Hosted />);
    await userEvent.click(screen.getByRole('button', { name: 'Добавить шаг' }));
    await userEvent.keyboard('{Enter}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Добавить шаг' }));
  });

  it('Esc closes wherever the focus is inside the menu', async () => {
    const onClose = vi.fn();
    render(<Hosted onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Добавить шаг' }));
    const listbox = screen.getByRole('listbox');
    listbox.tabIndex = 0; // browsers make a scrolling list a Tab stop; jsdom does not
    listbox.focus();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Добавить шаг' }));
  });

  it('closes when the focus leaves the menu and does not pull it back', async () => {
    const onClose = vi.fn();
    render(<Hosted onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Добавить шаг' }));
    await userEvent.click(screen.getByRole('button', { name: 'Снаружи' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Снаружи' }));
  });

  it('stays open and focused under StrictMode, which runs the effects twice on mount', async () => {
    const onClose = vi.fn();
    render(
      <StrictMode>
        <Hosted onClose={onClose} />
      </StrictMode>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Добавить шаг' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole('combobox'));
  });

  it('a click inside the menu keeps it open', async () => {
    const onClose = vi.fn();
    render(<Hosted onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Добавить шаг' }));
    await userEvent.click(screen.getByText('Шаги'));
    expect(onClose).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole('combobox'));
  });
});

describe('canvas context menus', () => {
  it('pane menu shows only the actions that have handlers', async () => {
    const user = userEvent.setup();
    const onInsertStep = vi.fn();
    render(
      <ContextMenu>
        <ContextMenuTrigger>Канвас</ContextMenuTrigger>
        <CanvasPaneMenuContent onInsertStep={onInsertStep} onSelectAll={vi.fn()} />
      </ContextMenu>,
    );
    await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Канвас') });
    const menu = await screen.findByRole('menu');
    expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Вставить шагTab', 'Выделить всё⌘A']);
    await user.click(within(menu).getByRole('menuitem', { name: /Вставить шаг/ }));
    expect(onInsertStep).toHaveBeenCalledTimes(1);
  });

  it('node menu flips «Отключить» to «Включить» and keeps «Удалить…» last', async () => {
    const user = userEvent.setup();
    render(
      <ContextMenu>
        <ContextMenuTrigger>Шаг</ContextMenuTrigger>
        <CanvasNodeMenuContent disabled onRunFrom={vi.fn()} onToggleDisabled={vi.fn()} onDelete={vi.fn()} />
      </ContextMenu>,
    );
    await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Шаг') });
    const items = within(await screen.findByRole('menu')).getAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual(['Запустить отсюда⇧↵', 'ВключитьD', 'Удалить…⌫']);
  });
});

const results: CanvasSearchResult[] = [
  { id: 'n1', kind: 'step', title: 'Уведомить менеджера', detail: 'Шаг · Действия' },
  { id: 'n2', kind: 'setting', title: 'Создать сделку', detail: 'Настройка «Ответственный»: менеджер по очереди' },
  { id: 'n3', kind: 'note', title: 'Порог бюджета согласовать…', detail: 'Стикер · Анна' },
];

function Search({ onNavigate, onClose }: { onNavigate: (result: CanvasSearchResult) => void; onClose: () => void }) {
  const [query, setQuery] = useState('менеджер');
  return <CanvasGraphSearch query={query} onQueryChange={setQuery} results={results} onNavigate={onNavigate} onClose={onClose} />;
}

describe('CanvasGraphSearch', () => {
  it('counts, filters by kind, highlights and walks the matches', async () => {
    const onNavigate = vi.fn();
    render(<Search onNavigate={onNavigate} onClose={vi.fn()} />);
    expect(screen.getByText('1 из 3')).toBeTruthy();
    expect(onNavigate).toHaveBeenLastCalledWith(results[0]);
    expect(screen.getAllByText('менеджер', { selector: 'mark' })).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: 'Следующая находка' }));
    expect(screen.getByText('2 из 3')).toBeTruthy();
    expect(onNavigate).toHaveBeenLastCalledWith(results[1]);

    await userEvent.click(screen.getByRole('radio', { name: 'Стикеры 1' }));
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByText('1 из 1')).toBeTruthy();
    expect(onNavigate).toHaveBeenLastCalledWith(results[2]);
  });

  it('Enter goes forward, ⇧Enter back, click jumps, Esc closes', async () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    render(<Search onNavigate={onNavigate} onClose={onClose} />);
    const input = screen.getByRole('searchbox', { name: 'Найти на графе' });
    input.focus();
    await userEvent.keyboard('{Enter}{Enter}{Enter}');
    expect(onNavigate).toHaveBeenLastCalledWith(results[0]);
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}');
    expect(onNavigate).toHaveBeenLastCalledWith(results[2]);
    await userEvent.click(screen.getByRole('option', { name: /Создать сделку/ }));
    expect(onNavigate).toHaveBeenLastCalledWith(results[1]);
    input.focus();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('says when the graph has no matches', () => {
    render(<CanvasGraphSearch query="ыыы" onQueryChange={vi.fn()} results={[]} onNavigate={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Нет совпадений')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Следующая находка' }).hasAttribute('disabled')).toBe(true);
  });
});

describe('CanvasHistoryPanel', () => {
  it('marks the current point and restores another one', async () => {
    const onRestore = vi.fn();
    const entries = [
      { id: 'h1', title: 'Подключила «Есть бюджет?»', author: 'Анна', time: 'только что' },
      { id: 'h2', title: 'Разложил граф · 6 шагов', author: 'Вы', time: '12 мин назад' },
    ];
    render(<CanvasHistoryPanel entries={entries} currentId="h1" period="сегодня" onRestore={onRestore} />);
    const list = screen.getByRole('list', { name: 'История' });
    const [current, older] = within(list).getAllByRole('listitem') as [HTMLElement, HTMLElement];
    expect(current.getAttribute('aria-current')).toBe('step');
    expect(within(current).queryByRole('button')).toBeNull();
    expect(within(older).getByText('Вы · 12 мин назад')).toBeTruthy();
    await userEvent.click(within(older).getByRole('button', { name: 'Вернуть сюда: Разложил граф · 6 шагов' }));
    expect(onRestore).toHaveBeenCalledWith(entries[1]);
  });
});
