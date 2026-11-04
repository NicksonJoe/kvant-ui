import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  CanvasAgentPrompt,
  CanvasAgentProposal,
  CanvasCommentPin,
  CanvasCommentThread,
  CanvasCursor,
  CanvasEditingLabel,
  CanvasPresence,
  CanvasSticky,
  presenceColor,
  presenceLabel,
} from '../components/canvas-collab';

describe('presenceLabel', () => {
  it('names up to three people and counts the rest', () => {
    expect(presenceLabel(['Анна'])).toBe('Анна здесь');
    expect(presenceLabel(['Анна', 'Игорь'])).toBe('Анна и Игорь здесь');
    expect(presenceLabel(['Анна', 'Игорь', 'Марк'])).toBe('Анна, Игорь и Марк здесь');
    expect(presenceLabel(['Анна', 'Игорь', 'Марк', 'Ольга', 'Пётр'])).toBe('Анна, Игорь и ещё 3 здесь');
  });
});

describe('presenceColor', () => {
  it('uses the presence token with a fallback, cycling through three', () => {
    expect(presenceColor(1)).toBe('var(--color-presence-1, oklch(0.56 0.2 320))');
    expect(presenceColor(4)).toBe(presenceColor(1));
  });
});

describe('CanvasPresence', () => {
  it('lists who is here', () => {
    render(<CanvasPresence people={[{ id: 'a', name: 'Анна' }, { id: 'i', name: 'Игорь' }]} />);
    expect(screen.getByText('Анна и Игорь здесь')).toBeTruthy();
  });
});

describe('cursor, label, sticky', () => {
  it('a cursor sits at graph coordinates and stays silent for the screen reader', () => {
    render(<CanvasCursor name="Анна" x={96} y={232} />);
    const cursor = document.querySelector<HTMLElement>('[data-slot=canvas-cursor]');
    expect(cursor?.style.left).toBe('96px');
    expect(cursor?.style.top).toBe('232px');
    expect(cursor?.getAttribute('aria-hidden')).toBe('true');
    expect(cursor?.textContent).toBe('Анна');
  });

  it('the editing label says who edits the step', () => {
    render(<CanvasEditingLabel name="Игорь" />);
    expect(screen.getByText('Игорь правит')).toBeTruthy();
  });

  it('a sticky note is a note with its author', () => {
    render(
      <CanvasSticky author="Анна" time="2 мин назад">
        Порог бюджета согласовать с Игорем
      </CanvasSticky>,
    );
    expect(screen.getByRole('note').textContent).toContain('Анна · 2 мин назад');
  });
});

describe('comments', () => {
  it('a pin names the thread and opens it', () => {
    const onClick = vi.fn();
    render(<CanvasCommentPin author="Анна" count={2} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Комментарии: 2, последний от Анна' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('a thread shows comments, sends a reply with Enter and resolves', () => {
    const onReply = vi.fn();
    const onResolve = vi.fn();
    render(
      <CanvasCommentThread
        aria-label="Комментарии к «Есть бюджет?»"
        comments={[
          { id: '1', author: 'Анна', time: '10 мин назад', text: 'Порог 50 000 не слишком высокий?' },
          { id: '2', author: 'Игорь', time: '2 мин назад', text: 'Сделаю отдельную ветку.' },
        ]}
        onReply={onReply}
        onResolve={onResolve}
      />,
    );
    const thread = screen.getByRole('region', { name: 'Комментарии к «Есть бюджет?»' });
    expect(within(thread).getAllByRole('article')).toHaveLength(2);
    const field = within(thread).getByRole('textbox', { name: 'Ответить' });
    fireEvent.change(field, { target: { value: '  Ок  ' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(onReply).toHaveBeenCalledWith('Ок');
    expect((field as HTMLInputElement).value).toBe('');
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(onReply).toHaveBeenCalledOnce();
    fireEvent.click(within(thread).getByRole('button', { name: 'Решено' }));
    expect(onResolve).toHaveBeenCalledOnce();
  });
});

describe('agent builds the graph', () => {
  it('the prompt shows the request and the result', () => {
    const { rerender } = render(<CanvasAgentPrompt text="Заявка из Telegram → разбери бюджет" status="building" />);
    expect(screen.getByRole('status').textContent).toBe('Собираю граф…');
    rerender(<CanvasAgentPrompt text="Заявка из Telegram → разбери бюджет" status="done" steps={6} edges={5} />);
    expect(screen.getByRole('status').textContent).toBe('Готово · 6 шагов и 5 связей');
  });

  it('the proposal bar accepts all, one by one or rejects', () => {
    const onAccept = vi.fn();
    const onStepwise = vi.fn();
    const onReject = vi.fn();
    render(<CanvasAgentProposal steps={6} edges={5} onAccept={onAccept} onStepwise={onStepwise} onReject={onReject} />);
    expect(screen.getByRole('region', { name: 'Норда предлагает 6 шагов и 5 связей' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Принять всё' }));
    fireEvent.click(screen.getByRole('button', { name: 'По одному' }));
    fireEvent.click(screen.getByRole('button', { name: 'Отклонить' }));
    expect([onAccept, onStepwise, onReject].map((fn) => fn.mock.calls.length)).toEqual([1, 1, 1]);
  });
});
