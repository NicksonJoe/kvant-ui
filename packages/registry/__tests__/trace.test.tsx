import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Trace, TraceApproval, TraceApprovalDetail, traceAnnouncement, traceProgress, type TraceStepData } from '..';

afterEach(() => {
  vi.useRealTimers();
});

const steps: TraceStepData[] = [
  { id: 'find', title: 'Нашёл 18 клиентов без активности за 30 дней', status: 'done', tool: 'crm.contacts.search', detail: '0,8 с' },
  { id: 'calendar', title: 'Календарь не ответил — встречи не проверены', status: 'error', tool: 'calendar.events', detail: 'таймаут 10 с' },
  { id: 'draft', title: 'Составил письмо с предложением продлить договор', status: 'done', tool: 'mail.draft', detail: '2 варианта темы · 146 слов' },
  { id: 'threads', title: 'Проверяю, кому уже писали на этой неделе…', status: 'running', tool: 'mail.threads', progress: { value: 3, max: 18 } },
  { id: 'send', title: 'Отправить письма клиентам', status: 'pending', needsApproval: true },
];

const step = (id: string) => {
  const element = document.querySelector(`[data-slot=trace-step][data-id=${id}]`);
  if (!(element instanceof HTMLElement)) throw new Error(`no step ${id}`);
  return element;
};

describe('traceProgress', () => {
  it('counts finished steps (done and failed) out of all', () => {
    expect(traceProgress(steps)).toEqual({ finished: 3, total: 5, status: 'running' });
  });

  it('is done when nothing runs or waits', () => {
    expect(traceProgress(steps.map((item) => ({ ...item, status: 'done' as const })))).toEqual({ finished: 5, total: 5, status: 'done' });
  });

  it('a pending step still keeps the trace running', () => {
    expect(traceProgress([{ id: 'a', title: 'a', status: 'pending' }]).status).toBe('running');
    expect(traceProgress([]).status).toBe('done');
  });
});

describe('traceAnnouncement', () => {
  it('says which steps finished or failed since the last render', () => {
    const before = steps;
    const after = steps.map((item) => (item.id === 'threads' ? { ...item, status: 'done' as const, title: 'Проверил переписку' } : item));
    expect(traceAnnouncement(before, after)).toBe('Готово: Проверил переписку');
    const failed = steps.map((item) => (item.id === 'threads' ? { ...item, status: 'error' as const } : item));
    expect(traceAnnouncement(before, failed)).toBe('Ошибка: Проверяю, кому уже писали на этой неделе…');
  });

  it('says nothing when no step finished, and reads several at once', () => {
    expect(traceAnnouncement(steps, steps)).toBe('');
    const added = [...steps, { id: 'x', title: 'Новый шаг', status: 'running' as const }];
    expect(traceAnnouncement(steps, added)).toBe('');
    const two = steps.map((item) => (item.status === 'running' || item.status === 'pending' ? { ...item, status: 'done' as const } : item));
    expect(traceAnnouncement(steps, two)).toBe('Готово: Проверяю, кому уже писали на этой неделе… · Готово: Отправить письма клиентам');
  });
});

describe('Trace · card', () => {
  it('header: agent face, name, task with «3 из 5 шагов», time and «Остановить»', () => {
    const onStop = vi.fn();
    render(<Trace steps={steps} task="Письма клиентам без активности" time="0:42" onStop={onStop} />);
    const trace = document.querySelector('[data-slot=trace]');
    expect(trace?.getAttribute('data-variant')).toBe('card');
    expect(trace?.getAttribute('data-status')).toBe('running');
    expect(screen.getByText('Агент Норды')).toBeDefined();
    expect(screen.getByText('Письма клиентам без активности · 3 из 5 шагов')).toBeDefined();
    expect(screen.getByText('0:42')).toBeDefined();
    expect(document.querySelector('[data-slot=agent-avatar]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Остановить' }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('hides «Остановить» once the agent is done', () => {
    render(<Trace steps={steps.map((item) => ({ ...item, status: 'done' as const }))} onStop={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Остановить' })).toBeNull();
    expect(screen.getByText('5 из 5 шагов')).toBeDefined();
  });

  it('every step says its state to the screen reader', () => {
    render(<Trace steps={steps} />);
    const list = screen.getByRole('list', { name: 'Шаги агента' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    expect(step('find').getAttribute('data-status')).toBe('done');
    expect(within(step('find')).getByText('готово').className).toContain('sr-only');
    expect(within(step('calendar')).getByText('ошибка')).toBeDefined();
    expect(within(step('threads')).getByText('идёт')).toBeDefined();
    expect(within(step('send')).getByText('ожидает')).toBeDefined();
  });

  it('done: tool call in mono after the title', () => {
    render(<Trace steps={steps} />);
    expect(within(step('find')).getByText('crm.contacts.search · 0,8 с')).toBeDefined();
  });

  it('error: danger call line and «Повторить»', () => {
    const onRetry = vi.fn();
    render(<Trace steps={steps.map((item) => (item.id === 'calendar' ? { ...item, onRetry } : item))} />);
    const call = within(step('calendar')).getByText('calendar.events · таймаут 10 с');
    expect(call.className).toContain('text-danger-soft-fg');
    fireEvent.click(within(step('calendar')).getByRole('button', { name: 'Повторить' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('running: spinner, progress bar and «3 из 18»', () => {
    render(<Trace steps={steps} />);
    const bar = within(step('threads')).getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('3');
    expect(bar.getAttribute('aria-valuemax')).toBe('18');
    expect(within(step('threads')).getByText('mail.threads · 3 из 18')).toBeDefined();
    expect(step('threads').querySelector('[data-slot=spinner]')).not.toBeNull();
  });

  it('pending: dashed ring, muted title, the approval hint', () => {
    render(<Trace steps={steps} />);
    expect(within(step('send')).getByText('Отправить письма клиентам').className).toContain('text-fg-3');
    expect(within(step('send')).getByText('Понадобится ваше подтверждение')).toBeDefined();
  });

  it('the rail runs between icons and stops at the last step', () => {
    render(<Trace steps={steps} />);
    expect(step('find').querySelector('[data-slot=trace-rail]')).not.toBeNull();
    expect(step('send').querySelector('[data-slot=trace-rail]')).toBeNull();
  });

  it('announces finished and failed steps', () => {
    vi.useFakeTimers();
    const { rerender } = render(<Trace steps={steps} />);
    rerender(<Trace steps={steps.map((item) => (item.id === 'threads' ? { ...item, status: 'done' as const } : item))} />);
    expect(document.querySelector('[data-slot=announce]')?.textContent).toBe('Готово: Проверяю, кому уже писали на этой неделе…');
  });

  it('children go under the steps (an approval)', () => {
    render(
      <Trace steps={steps}>
        <p>подтверждение</p>
      </Trace>,
    );
    expect(screen.getByText('подтверждение')).toBeDefined();
  });
});

describe('Trace · inline', () => {
  const done = steps.map((item) => ({ ...item, status: 'done' as const }));

  it('a status line that opens the steps: done — «Готово» and the total time', () => {
    render(<Trace variant="inline" steps={done} time="за 14 с" />);
    const toggle = screen.getByRole('button', { name: /Готово/ });
    expect(toggle.textContent).toContain('за 14 с');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('list', { name: 'Шаги агента' })).toBeNull();
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const list = screen.getByRole('list', { name: 'Шаги агента' });
    expect(toggle.getAttribute('aria-controls')).toBe(list.id);
    fireEvent.click(toggle);
    expect(screen.queryByRole('list', { name: 'Шаги агента' })).toBeNull();
  });

  it('running — «В процессе» and the timer', () => {
    render(<Trace variant="inline" steps={steps} time="6 с" />);
    const toggle = screen.getByRole('button', { name: /В процессе/ });
    expect(toggle.textContent).toContain('6 с');
    expect(toggle.querySelector('[data-slot=trace-status-icon]')?.getAttribute('data-status')).toBe('running');
  });

  it('stopped — «Остановлено»', () => {
    render(<Trace variant="inline" steps={steps} stopped />);
    expect(screen.getByRole('button', { name: /Остановлено/ })).toBeDefined();
  });

  it('controlled open', () => {
    const onOpenChange = vi.fn();
    render(<Trace variant="inline" steps={done} open onOpenChange={onOpenChange} />);
    expect(screen.getByRole('list', { name: 'Шаги агента' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Готово/ }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('list', { name: 'Шаги агента' })).toBeDefined();
  });

  it('defaultOpen shows the steps at once', () => {
    render(<Trace variant="inline" steps={done} defaultOpen />);
    expect(screen.getByRole('list', { name: 'Шаги агента' })).toBeDefined();
  });
});

describe('TraceApproval', () => {
  const card = (props: Partial<Parameters<typeof TraceApproval>[0]> = {}) => (
    <TraceApproval
      title="Отправить письмо 18 клиентам?"
      description="Агент подготовил письмо и не отправит его без вашего решения."
      onApprove={() => {}}
      onReject={() => {}}
      details={
        <>
          <TraceApprovalDetail label="Тема">Продлим договор на 2027 год со скидкой 10 %</TraceApprovalDetail>
          <TraceApprovalDetail label="Кому">«Студия Север» и ещё 17</TraceApprovalDetail>
        </>
      }
      {...props}
    />
  );

  it('asks: title, «Нужно подтверждение», what will happen, the details', () => {
    render(card());
    const group = screen.getByRole('group', { name: 'Отправить письмо 18 клиентам?' });
    expect(within(group).getByText('Нужно подтверждение')).toBeDefined();
    expect(within(group).getByText('Тема')).toBeDefined();
    expect(within(group).getByText('Продлим договор на 2027 год со скидкой 10 %')).toBeDefined();
    expect(group.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('«Разрешить» and «Отклонить» call back; an edit link sits on the right', () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    render(card({ onApprove, onReject, edit: <a href="#mail">Изменить письмо</a> }));
    fireEvent.click(screen.getByRole('button', { name: 'Разрешить' }));
    fireEvent.click(screen.getByRole('button', { name: 'Отклонить' }));
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Изменить письмо' })).toBeDefined();
  });

  it('after the decision it folds into a line: approved', () => {
    render(card({ decision: 'approved', result: '18 писем отправлено в 14:12' }));
    const decided = document.querySelector('[data-slot=trace-approval]');
    expect(decided?.getAttribute('data-decision')).toBe('approved');
    expect(decided?.textContent).toBe('Разрешено · 18 писем отправлено в 14:12');
    expect(screen.queryByRole('button', { name: 'Разрешить' })).toBeNull();
  });

  it('rejected', () => {
    render(card({ decision: 'rejected', result: 'агент остановился и ничего не отправил' }));
    expect(document.querySelector('[data-slot=trace-approval]')?.textContent).toBe('Отклонено · агент остановился и ничего не отправил');
  });

  it('the buttons wait while the decision is on its way', () => {
    render(card({ pending: true }));
    expect(screen.getByRole('button', { name: 'Разрешить' }).getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('button', { name: 'Отклонить' }).hasAttribute('disabled')).toBe(true);
  });
});
