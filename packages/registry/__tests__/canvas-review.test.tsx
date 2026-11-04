import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CanvasProblem } from '../components/canvas-check';
import { CanvasChangeNote, CanvasProblems, CanvasVersionBar, CanvasVersionList, type CanvasVersion } from '../components/canvas-review';

const problems: CanvasProblem[] = [
  { id: 'cycle', kind: 'cycle', severity: 'error', title: 'Цикл без выхода', description: 'Напомнить → Ждать 3 дня → Напомнить.', nodeIds: ['remind'] },
  { id: 'input', kind: 'required-input', severity: 'error', title: 'Пустой обязательный вход', description: '«Счёт в банк» ждёт «клиент».', nodeIds: ['bill'] },
  { id: 'branch', kind: 'open-branch', severity: 'warning', title: 'Ветка обрывается', description: 'После «Ответить шаблоном» ничего нет.', nodeIds: ['reply'] },
  { id: 'type', kind: 'type-mismatch', severity: 'warning', title: 'Текст идёт в число', description: '«Сумма» получает текст.', nodeIds: ['deal'] },
];

describe('CanvasProblems', () => {
  it('counts errors and warnings and blocks publishing while errors remain', () => {
    const onPublish = vi.fn();
    render(<CanvasProblems problems={problems} onShow={() => {}} onPublish={onPublish} />);
    expect(screen.getByRole('status').textContent).toBe('Нашлось 4 · 2 ошибки · 2 предупреждения');
    const publish = screen.getByRole('button', { name: 'Опубликовать' });
    expect(publish.hasAttribute('disabled') || publish.getAttribute('aria-disabled') === 'true').toBe(true);
    expect(screen.getByText('сначала ошибки')).toBeTruthy();
  });

  it('publishes when only warnings are left', () => {
    const onPublish = vi.fn();
    render(<CanvasProblems problems={problems.filter((problem) => problem.severity === 'warning')} onPublish={onPublish} />);
    fireEvent.click(screen.getByRole('button', { name: 'Опубликовать' }));
    expect(onPublish).toHaveBeenCalledOnce();
  });

  it('«Показать» takes the camera to the step; a fixable problem offers «Исправить»', () => {
    const onShow = vi.fn();
    const onFix = vi.fn();
    render(<CanvasProblems problems={problems} onShow={onShow} onFix={onFix} canFix={(problem) => problem.kind === 'type-mismatch'} />);
    const rows = within(screen.getByRole('list', { name: 'Проблемы графа' })).getAllByRole('listitem');
    fireEvent.click(within(rows[0] as HTMLElement).getByRole('button', { name: 'Показать: Цикл без выхода' }));
    expect(onShow).toHaveBeenCalledWith(problems[0]);
    fireEvent.click(within(rows[3] as HTMLElement).getByRole('button', { name: 'Исправить: Текст идёт в число' }));
    expect(onFix).toHaveBeenCalledWith(problems[3]);
  });

  it('says the graph is clean', () => {
    render(<CanvasProblems problems={[]} />);
    expect(screen.getByRole('status').textContent).toBe('Проблем нет');
  });
});

describe('CanvasVersionBar', () => {
  it('names both versions, counts changes and restores', () => {
    const onRestore = vi.fn();
    render(
      <CanvasVersionBar
        from="v7 · 28 октября"
        to="Черновик"
        diff={{ nodes: { added: ['a', 'b'], changed: ['c'], removed: ['d'], unchanged: [] }, edges: { added: [], removed: [] } }}
        restoreLabel="Восстановить v7"
        onRestore={onRestore}
      />,
    );
    expect(screen.getByRole('group', { name: 'Сравнение: v7 · 28 октября → Черновик' })).toBeTruthy();
    expect(screen.getByLabelText('добавлено 2, изменено 1, удалено 1').textContent).toBe('+2~1−1');
    fireEvent.click(screen.getByRole('button', { name: 'Восстановить v7' }));
    expect(onRestore).toHaveBeenCalledOnce();
  });
});

describe('CanvasVersionList', () => {
  const versions: CanvasVersion[] = [
    { id: 'draft', label: 'Черновик', draft: true, note: 'с тех пор 2 правки' },
    { id: 'v7', label: 'Версия 7', date: new Date(2026, 9, 28), byline: 'Опубликовала Ирина', current: true },
    { id: 'v6', label: 'Версия 6', date: new Date(2026, 9, 20), byline: 'Опубликовал Игорь' },
  ];

  it('lists versions with authors and compares or restores one', () => {
    const onCompare = vi.fn();
    const onRestore = vi.fn();
    render(<CanvasVersionList versions={versions} comparingId="v7" onCompare={onCompare} onRestore={onRestore} />);
    const list = screen.getByRole('list', { name: 'Версии' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(within(list).getByText('Опубликовала Ирина · 28 октября')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Сравнить: Версия 7' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Сравнить: Версия 6' }));
    expect(onCompare).toHaveBeenCalledWith('v6');
    fireEvent.click(screen.getByRole('button', { name: 'Восстановить: Версия 6' }));
    expect(onRestore).toHaveBeenCalledWith('v6');
    expect(screen.queryByRole('button', { name: 'Восстановить: Черновик' })).toBeNull();
  });
});

describe('CanvasChangeNote', () => {
  it('reads as what it was and what it became', () => {
    render(<CanvasChangeNote title="Инструкция агента" before="Найди бюджет и срок." after="Найди бюджет, срок и задачу." meta="Вы · 4 мин назад" />);
    expect(screen.getByRole('note').textContent).toBe('Инструкция агентабыло: Найди бюджет и срок.стало: Найди бюджет, срок и задачу.Вы · 4 мин назад');
  });
});
