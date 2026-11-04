import { fireEvent, render, screen, within } from '@testing-library/react';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  AgentEmpty,
  AgentFileCard,
  AgentHistory,
  AgentLauncher,
  AgentPanel,
  AgentStatus,
  AgentTable,
  agentTableText,
  groupConversations,
  useAgentShortcut,
  type AgentConversation,
} from '../components/agent-panel';

const now = new Date(2026, 9, 29, 15, 0);
const at = (day: number, hours: number, minutes = 0) => new Date(2026, 9, day, hours, minutes);

describe('AgentLauncher', () => {
  it('is a button named after the agent, with the shortcut', () => {
    render(<AgentLauncher placement="inline" />);
    const button = screen.getByRole('button', { name: 'Агент Норды' });
    expect(button.getAttribute('aria-keyshortcuts')).toBe('Meta+J Control+J');
  });

  it('puts the state into the name and shows the ring while working', () => {
    const { rerender } = render(<AgentLauncher placement="inline" status="working" activity="Готовлю отчёт…" />);
    const button = screen.getByRole('button', { name: 'Агент Норды, готовлю отчёт' });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(document.querySelector('[data-slot=agent-launcher-ring]')).not.toBeNull();
    expect(screen.getByText('Готовлю отчёт…').getAttribute('aria-hidden')).toBe('true');
    rerender(<AgentLauncher placement="inline" status="unread" />);
    expect(screen.getByRole('button', { name: 'Агент Норды, есть ответ' }).hasAttribute('aria-busy')).toBe(false);
    expect(document.querySelector('[data-slot=agent-launcher-dot]')).not.toBeNull();
    expect(screen.getByRole('status').textContent).toContain('Агент Норды: ответ готов');
  });
});

describe('useAgentShortcut', () => {
  function Probe({ onToggle }: { onToggle: () => void }) {
    useAgentShortcut(onToggle);
    return null;
  }

  it('toggles on ⌘J and Ctrl+J, not on J alone or with Shift', () => {
    const onToggle = vi.fn();
    render(<Probe onToggle={onToggle} />);
    fireEvent.keyDown(window, { key: 'j', metaKey: true });
    fireEvent.keyDown(window, { key: 'J', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'j' });
    fireEvent.keyDown(window, { key: 'j', metaKey: true, shiftKey: true });
    expect(onToggle).toHaveBeenCalledTimes(2);
  });
});

describe('AgentPanel', () => {
  function Dock() {
    const [open, setOpen] = useState(false);
    const launcher = useRef<HTMLButtonElement>(null);
    return (
      <>
        <AgentLauncher ref={launcher} placement="inline" hidden={open} onClick={() => setOpen(true)} />
        {open ? (
          <AgentPanel placement="inline" workspace="Студия Север" returnFocusRef={launcher} onClose={() => setOpen(false)} composer={<textarea aria-label="Сообщение" />}>
            <p>Разговор</p>
          </AgentPanel>
        ) : null}
      </>
    );
  }

  it('is a named complementary region, not a modal, with the workspace chip', () => {
    render(<AgentPanel placement="inline" workspace="Студия Север" onClose={() => {}} />);
    const panel = screen.getByRole('complementary', { name: 'Агент Норды' });
    expect(panel.hasAttribute('aria-modal')).toBe(false);
    expect(within(panel).getByText('Студия Север')).toBeTruthy();
  });

  it('opens with focus in the composer; Esc closes it and returns focus to the launcher', () => {
    render(<Dock />);
    fireEvent.click(screen.getByRole('button', { name: 'Агент Норды' }));
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Сообщение' }));
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Сообщение' }), { key: 'Escape' });
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Агент Норды' }));
  });

  it('closes with the close button', () => {
    const onClose = vi.fn();
    render(<AgentPanel placement="inline" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows history and size buttons only with their handlers; history is a toggle', () => {
    const onHistoryChange = vi.fn();
    const onSizeChange = vi.fn();
    const { rerender } = render(<AgentPanel placement="inline" onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: 'История разговоров' })).toBeNull();
    rerender(<AgentPanel placement="inline" onClose={() => {}} historyOpen onHistoryChange={onHistoryChange} size="floating" onSizeChange={onSizeChange} />);
    const history = screen.getByRole('button', { name: 'История разговоров' });
    expect(history.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(history);
    expect(onHistoryChange).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByRole('button', { name: 'Развернуть' }));
    expect(onSizeChange).toHaveBeenCalledWith('docked');
    rerender(<AgentPanel placement="inline" onClose={() => {}} size="docked" onSizeChange={onSizeChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Свернуть в карточку' }));
    expect(onSizeChange).toHaveBeenLastCalledWith('floating');
  });
});

describe('AgentEmpty', () => {
  const suggestions = ['Сделай отчёт по обороту за октябрь', 'Какие сделки зависли и почему?', 'Что у меня сегодня?'];

  it('greets by name and sends a suggestion as is', () => {
    const onSelect = vi.fn();
    render(<AgentEmpty name="Анна" description="Знаю всё о «Студии Север»." suggestions={suggestions} onSelect={onSelect} />);
    expect(screen.getByRole('heading', { name: 'Анна, чем помочь?' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Какие сделки зависли и почему?' }));
    expect(onSelect).toHaveBeenCalledWith('Какие сделки зависли и почему?');
  });

  it('moves between suggestions with arrows and keeps four at most', () => {
    render(<AgentEmpty name="Анна" suggestions={[...suggestions, 'Пятая', 'Шестая']} onSelect={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    buttons[0]?.focus();
    fireEvent.keyDown(buttons[0] as HTMLElement, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(buttons[1]);
    fireEvent.keyDown(buttons[1] as HTMLElement, { key: 'ArrowUp' });
    fireEvent.keyDown(buttons[0] as HTMLElement, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(buttons[3]);
  });
});

const conversations: AgentConversation[] = [
  { id: 'deals', title: 'Зависшие сделки', date: at(29, 11, 5), preview: '«Навигация для ТЦ» ждёт шага 5 дней' },
  { id: 'turnover', title: 'Оборот за октябрь', date: at(29, 14, 32), preview: 'Готово: «Оборот · октябрь 2026.xlsx»' },
  { id: 'plan', title: 'План на среду', date: at(28, 9, 12), preview: '3 встречи и 2 просроченных шага' },
  { id: 'bills', title: 'Напоминания о счетах', date: at(28, 8, 40), status: 'waiting', preview: 'письмо кофейне «Зерно» готово к отправке' },
  { id: 'brief', title: 'Бриф по чайной линейке', date: at(26, 16, 20), preview: 'Собрал 12 вопросов для «Листвы»' },
  { id: 'old', title: 'Сентябрьский отчёт', date: new Date(2026, 8, 3, 10, 0), preview: 'Готово' },
  { id: 'older', title: 'Прошлогодний план', date: new Date(2025, 11, 20, 10, 0) },
];

describe('groupConversations', () => {
  it('groups by today, yesterday, weekday with a date, then month; newest first, waiting on top', () => {
    const groups = groupConversations(conversations, now);
    expect(groups.map((group) => [group.label, group.items.map((item) => item.id)])).toEqual([
      ['Сегодня', ['turnover', 'deals']],
      ['Вчера', ['bills', 'plan']],
      ['Понедельник, 26 октября', ['brief']],
      ['Сентябрь', ['old']],
      ['Декабрь 2025', ['older']],
    ]);
  });
});

describe('AgentHistory', () => {
  it('lists conversations, marks the open one and opens another on click', () => {
    const onSelect = vi.fn();
    render(<AgentHistory conversations={conversations} activeId="turnover" now={now} onSelect={onSelect} onNew={() => {}} />);
    expect(screen.getByRole('button', { name: /Оборот за октябрь/ }).getAttribute('aria-current')).toBe('true');
    expect(screen.getByText('Ждёт вашего решения')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Зависшие сделки/ }));
    expect(onSelect).toHaveBeenCalledWith('deals');
  });

  it('filters by the query in titles and replies', () => {
    render(<AgentHistory conversations={conversations} now={now} onSelect={() => {}} defaultQuery="зерно" />);
    expect(screen.getByRole('button', { name: /Напоминания о счетах/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Оборот за октябрь/ })).toBeNull();
  });

  it('says so when nothing matches', () => {
    render(<AgentHistory conversations={conversations} now={now} onSelect={() => {}} defaultQuery="ничего такого" />);
    expect(screen.getByText('Ничего не нашлось')).toBeTruthy();
  });

  it('shows a working conversation as in progress with its timer', () => {
    render(<AgentHistory conversations={[{ id: 'sync', title: 'Сверка оплат', date: at(29, 14, 50), status: 'working', elapsed: '6 с' }]} now={now} onSelect={() => {}} />);
    const row = screen.getByRole('button', { name: /Сверка оплат/ });
    expect(row.textContent).toContain('В процессе · 6 с');
    expect(row.getAttribute('aria-busy')).toBe('true');
  });
});

describe('AgentFileCard', () => {
  it('a ready file offers download and open', () => {
    const onDownload = vi.fn();
    render(<AgentFileCard name="Оборот · октябрь 2026.xlsx" format="xlsx" meta="3 листа · 18 КБ" onDownload={onDownload} onOpen={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Скачать' }));
    expect(onDownload).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Открыть' })).toBeTruthy();
    expect(screen.getByText('XLSX')).toBeTruthy();
  });

  it('a file being made is busy and shows its progress', () => {
    render(<AgentFileCard name="Оборот.xlsx" format="xlsx" status="preparing" progress={66} meta="Собираю лист «Воронка» · 2 из 3" />);
    expect(document.querySelector('[data-slot=agent-file]')?.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('66');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('a failed file says why and offers a way out', () => {
    const onRetry = vi.fn();
    render(<AgentFileCard name="Оборот.xlsx" format="xlsx" status="error" error="Банк не отдал выписку" onRetry={onRetry} />);
    expect(screen.getByText('Банк не отдал выписку')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe('AgentTable', () => {
  const columns = [
    { key: 'stage', label: 'Этап' },
    { key: 'count', label: 'Сделок', numeric: true },
    { key: 'sum', label: 'Сумма', numeric: true },
  ] as const;
  const rows = [
    { stage: 'Бриф', count: 1, sum: '420 000 ₽' },
    { stage: 'Договор', count: 1, sum: '860 000 ₽' },
  ];

  it('copies as tab-separated text, header and total included', () => {
    expect(agentTableText(columns, rows, { stage: 'Итого', count: 2, sum: '1 280 000 ₽' })).toBe(
      'Этап\tСделок\tСумма\nБриф\t1\t420 000 ₽\nДоговор\t1\t860 000 ₽\nИтого\t2\t1 280 000 ₽',
    );
  });

  it('is a real table with a caption', () => {
    render(<AgentTable title="Сделки в работе по этапам" caption="на 29 октября" columns={columns} rows={rows} />);
    const table = screen.getByRole('table', { name: 'Сделки в работе по этапам' });
    expect(within(table).getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(['Этап', 'Сделок', 'Сумма']);
    expect(within(table).getAllByRole('row')).toHaveLength(3);
  });
});

describe('AgentStatus', () => {
  it('reads as in progress or done with the time', () => {
    const { rerender } = render(<AgentStatus state="working" time="6 с" />);
    expect(screen.getByText('В процессе')).toBeTruthy();
    rerender(<AgentStatus state="done" time="за 14 с" />);
    expect(screen.getByText('Готово')).toBeTruthy();
    expect(screen.getByText('за 14 с')).toBeTruthy();
  });
});
