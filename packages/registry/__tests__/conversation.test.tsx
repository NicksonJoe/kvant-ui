import { fireEvent, render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  AgentAvatar,
  Conversation,
  ConversationTurn,
  Message,
  MessageGroup,
  Stream,
  StreamAction,
  countWords,
  formatDay,
  groupMessages,
  newMessagesLabel,
  parseStream,
  type ConversationMessage,
} from '..';

/* ---------- pure logic ---------- */

const now = new Date(2026, 9, 29, 15, 0);
const at = (day: number, hours: number, minutes: number) => new Date(2026, 9, day, hours, minutes);
const msg = (id: string, author: string, date: Date, direction: ConversationMessage['direction'] = 'incoming'): ConversationMessage => ({
  id,
  author,
  direction,
  date,
});

describe('formatDay', () => {
  it('names today with the date, yesterday alone, other days by date, other years with the year', () => {
    expect(formatDay(at(29, 9, 0), now)).toBe('Сегодня, 29 октября');
    expect(formatDay(at(28, 23, 59), now)).toBe('Вчера');
    expect(formatDay(at(3, 12, 0), now)).toBe('3 октября');
    expect(formatDay(new Date(2025, 11, 30, 10, 0), now)).toBe('30 декабря 2025');
  });

  it('compares calendar days, not 24 hours', () => {
    expect(formatDay(new Date(2026, 9, 28, 0, 5), new Date(2026, 9, 29, 0, 1))).toBe('Вчера');
  });
});

describe('newMessagesLabel', () => {
  it('agrees the noun with the number', () => {
    expect(newMessagesLabel(1)).toBe('1 новое сообщение');
    expect(newMessagesLabel(2)).toBe('2 новых сообщения');
    expect(newMessagesLabel(5)).toBe('5 новых сообщений');
    expect(newMessagesLabel(21)).toBe('21 новое сообщение');
    expect(newMessagesLabel(12)).toBe('12 новых сообщений');
  });
});

describe('groupMessages', () => {
  it('puts a day line before the first message of each day', () => {
    const entries = groupMessages([msg('a', 'Анна', at(28, 18, 0)), msg('b', 'Анна', at(29, 9, 0))], { now });
    expect(entries.map((entry) => (entry.type === 'group' ? `group:${entry.messages.map((m) => m.id).join('')}` : `${entry.type}:${entry.label}`))).toEqual([
      'day:Вчера',
      'group:a',
      'day:Сегодня, 29 октября',
      'group:b',
    ]);
  });

  it('groups messages of one author in a row within 5 minutes', () => {
    const entries = groupMessages(
      [
        msg('a', 'Анна', at(29, 14, 0)),
        msg('b', 'Анна', at(29, 14, 1)),
        msg('c', 'Анна', at(29, 14, 2)),
        msg('d', 'Я', at(29, 14, 5), 'outgoing'),
        msg('e', 'Я', at(29, 14, 5), 'outgoing'),
        msg('f', 'Анна', at(29, 14, 6)),
        msg('g', 'Анна', at(29, 14, 20)),
      ],
      { now },
    );
    const groups = entries.flatMap((entry) => (entry.type === 'group' ? [entry] : []));
    expect(groups.map((group) => group.messages.map((m) => m.id).join(''))).toEqual(['abc', 'de', 'f', 'g']);
    expect(groups.map((group) => group.direction)).toEqual(['incoming', 'outgoing', 'incoming', 'incoming']);
    expect(groups[0]?.author).toBe('Анна');
    expect(groups[0]?.key).toBe('a');
  });

  it('breaks a group at the «new messages» line and counts what is under it', () => {
    const entries = groupMessages(
      [msg('a', 'Анна', at(29, 14, 0)), msg('b', 'Анна', at(29, 14, 1)), msg('c', 'Анна', at(29, 14, 2))],
      { now, unreadFrom: 'b' },
    );
    expect(entries.map((entry) => entry.type)).toEqual(['day', 'group', 'unread', 'group']);
    const unread = entries[2];
    expect(unread?.type === 'unread' ? unread.label : '').toBe('2 новых сообщения');
  });

  it('accepts ISO strings and ignores an unknown unread id', () => {
    const entries = groupMessages([{ id: 'a', author: 'Анна', direction: 'incoming', date: '2026-10-29T10:00:00' }], { now, unreadFrom: 'zzz' });
    expect(entries.map((entry) => entry.type)).toEqual(['day', 'group']);
  });

  it('returns nothing for no messages', () => {
    expect(groupMessages([], { now })).toEqual([]);
  });
});

describe('parseStream', () => {
  it('splits paragraphs on blank lines and gathers «- » lines into a list', () => {
    expect(parseStream('Анна, добрый день!\n\nВ новый год войдут:\n- Тарифы с правками\n- Менеджер')).toEqual([
      { type: 'paragraph', words: ['Анна,', 'добрый', 'день!'] },
      { type: 'paragraph', words: ['В', 'новый', 'год', 'войдут:'] },
      { type: 'list', items: [['Тарифы', 'с', 'правками'], ['Менеджер']] },
    ]);
  });

  it('keeps a half-typed last word and drops empty lines', () => {
    expect(parseStream('Отчёт по итогам каждого квар')).toEqual([{ type: 'paragraph', words: ['Отчёт', 'по', 'итогам', 'каждого', 'квар'] }]);
    expect(parseStream('\n\n  \n')).toEqual([]);
  });

  it('counts words across blocks', () => {
    expect(countWords('Анна, добрый день!\n- раз два\n- три')).toBe(6);
    expect(countWords('')).toBe(0);
  });
});

/* ---------- layout stub: rows 100 high in a 300 viewport ---------- */

const ROW = 100;
const VIEW = 300;
const ROWS = '[data-slot=message], [data-slot=conversation-turn]';
const isViewport = (element: Element) => element.matches('[data-slot=scroll-area-viewport]');
const viewportOf = (element: Element) => element.closest<HTMLElement>('[data-slot=scroll-area-viewport]');
const saved = {
  scrollHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight'),
  clientHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight'),
  rect: HTMLElement.prototype.getBoundingClientRect,
  scrollTo: HTMLElement.prototype.scrollTo,
};

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return isViewport(this) ? Math.max(this.querySelectorAll(ROWS).length * ROW, VIEW) : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return isViewport(this) ? VIEW : 0;
    },
  });
  HTMLElement.prototype.getBoundingClientRect = function rect(this: HTMLElement) {
    const viewport = viewportOf(this);
    if (isViewport(this)) return DOMRect.fromRect({ x: 0, y: 0, width: 400, height: VIEW });
    if (!viewport || !this.matches(ROWS)) return DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 });
    const index = Array.from(viewport.querySelectorAll(ROWS)).indexOf(this);
    return DOMRect.fromRect({ x: 0, y: index * ROW - viewport.scrollTop, width: 400, height: ROW });
  };
  HTMLElement.prototype.scrollTo = function scrollTo(this: HTMLElement, options?: ScrollToOptions | number) {
    if (typeof options === 'object' && options.top !== undefined) this.scrollTop = options.top;
  } as HTMLElement['scrollTo'];
});

afterAll(() => {
  if (saved.scrollHeight) Object.defineProperty(HTMLElement.prototype, 'scrollHeight', saved.scrollHeight);
  if (saved.clientHeight) Object.defineProperty(HTMLElement.prototype, 'clientHeight', saved.clientHeight);
  HTMLElement.prototype.getBoundingClientRect = saved.rect;
  HTMLElement.prototype.scrollTo = saved.scrollTo;
});

interface Line {
  id: string;
  direction?: 'incoming' | 'outgoing';
}
const lines = (from: number, count: number, direction: Line['direction'] = 'incoming'): Line[] =>
  Array.from({ length: count }, (_, index) => ({ id: `m${from + index}`, direction }));

interface FeedProps {
  items: Line[];
  busy?: boolean;
  hasOlder?: boolean;
  olderStatus?: 'idle' | 'loading' | 'error';
  onLoadOlder?: () => void;
}
const Feed = ({ items, ...props }: FeedProps) => (
  <Conversation aria-label="Переписка с Анной" className="h-[300px]" {...props}>
    {items.map((item) => (
      <Message key={item.id} direction={item.direction}>
        Сообщение {item.id}
      </Message>
    ))}
  </Conversation>
);

const viewport = () => {
  const element = document.querySelector<HTMLElement>('[data-slot=scroll-area-viewport]');
  if (!element) throw new Error('no viewport');
  return element;
};
const scrollTo = (top: number) => {
  const element = viewport();
  element.scrollTop = top;
  fireEvent.scroll(element);
};

describe('Conversation', () => {
  it('is a polite log named by aria-label; busy while the agent works', () => {
    const { rerender } = render(<Feed items={lines(0, 2)} />);
    const log = screen.getByRole('log', { name: 'Переписка с Анной' });
    expect(log.getAttribute('aria-live')).toBe('polite');
    expect(log.getAttribute('aria-busy')).toBeNull();
    expect(log.closest('[data-slot=conversation]')).not.toBeNull();
    rerender(<Feed items={lines(0, 2)} busy />);
    expect(log.getAttribute('aria-busy')).toBe('true');
  });

  it('opens at the last message', () => {
    render(<Feed items={lines(0, 5)} />);
    expect(viewport().scrollTop).toBe(5 * ROW - VIEW);
  });

  it('follows new content while it is at the bottom: a new message, a growing answer', () => {
    const { rerender } = render(<Feed items={lines(0, 5)} />);
    rerender(<Feed items={lines(0, 7)} />);
    expect(viewport().scrollTop).toBe(7 * ROW - VIEW);
    expect(screen.queryByRole('button', { name: /новы|Вниз/ })).toBeNull();
  });

  it('stays put when the reader scrolled up, and offers the new messages below', () => {
    const { rerender } = render(<Feed items={lines(0, 6)} />);
    scrollTo(50);
    const down = screen.getByRole('button', { name: 'К последнему сообщению' });
    expect(down.textContent).not.toMatch(/новы/);
    rerender(<Feed items={[...lines(0, 6), ...lines(6, 2)]} />);
    expect(viewport().scrollTop).toBe(50);
    expect(screen.getByRole('button', { name: /2 новых сообщения/ })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /2 новых сообщения/ }));
    expect(viewport().scrollTop).toBe(8 * ROW - VIEW);
    expect(screen.queryByRole('button', { name: /новых|К последнему/ })).toBeNull();
  });

  it('comes back to the bottom by itself once the reader scrolls there', () => {
    const { rerender } = render(<Feed items={lines(0, 6)} />);
    scrollTo(0);
    scrollTo(6 * ROW - VIEW);
    expect(screen.queryByRole('button', { name: 'К последнему сообщению' })).toBeNull();
    rerender(<Feed items={lines(0, 8)} />);
    expect(viewport().scrollTop).toBe(8 * ROW - VIEW);
  });

  it('jumps to the bottom when I send a message, even scrolled up', () => {
    const { rerender } = render(<Feed items={lines(0, 6)} />);
    scrollTo(0);
    rerender(<Feed items={[...lines(0, 6), ...lines(6, 1, 'outgoing')]} />);
    expect(viewport().scrollTop).toBe(7 * ROW - VIEW);
    expect(screen.queryByRole('button', { name: 'К последнему сообщению' })).toBeNull();
  });

  it('asks for older history near the top, once per page', () => {
    const onLoadOlder = vi.fn();
    const { rerender } = render(<Feed items={lines(10, 10)} hasOlder onLoadOlder={onLoadOlder} />);
    expect(onLoadOlder).not.toHaveBeenCalled();
    scrollTo(250);
    expect(onLoadOlder).toHaveBeenCalledTimes(1);
    scrollTo(200);
    expect(onLoadOlder).toHaveBeenCalledTimes(1);
    rerender(<Feed items={lines(10, 10)} hasOlder olderStatus="loading" onLoadOlder={onLoadOlder} />);
    expect(screen.getByText('Загружаем историю')).toBeDefined();
    expect(screen.getByRole('log').getAttribute('aria-busy')).toBe('true');
    scrollTo(100);
    expect(onLoadOlder).toHaveBeenCalledTimes(1);
  });

  it('keeps the message under the eye when older history comes in above', () => {
    const { rerender } = render(<Feed items={lines(10, 10)} hasOlder olderStatus="loading" />);
    scrollTo(250);
    rerender(<Feed items={[...lines(0, 10), ...lines(10, 10)]} hasOlder />);
    expect(viewport().scrollTop).toBe(250 + 10 * ROW);
  });

  it('does not ask without more history and offers a retry after an error', () => {
    const onLoadOlder = vi.fn();
    const { rerender } = render(<Feed items={lines(0, 10)} hasOlder={false} onLoadOlder={onLoadOlder} />);
    scrollTo(0);
    expect(onLoadOlder).not.toHaveBeenCalled();
    rerender(<Feed items={lines(0, 10)} hasOlder olderStatus="error" onLoadOlder={onLoadOlder} />);
    expect(screen.getByText('История не загрузилась')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onLoadOlder).toHaveBeenCalledTimes(1);
  });

  it('chat and agent layouts', () => {
    const { rerender } = render(<Feed items={lines(0, 1)} />);
    const content = () => screen.getByRole('log');
    expect(document.querySelector('[data-slot=conversation]')?.getAttribute('data-variant')).toBe('chat');
    expect(content().className).toContain('gap-4');
    rerender(
      <Conversation aria-label="Агент Норды" variant="agent">
        <ConversationTurn>Готово</ConversationTurn>
      </Conversation>,
    );
    expect(document.querySelector('[data-slot=conversation]')?.getAttribute('data-variant')).toBe('agent');
    expect(content().className).toContain('gap-5');
  });

  it('works with message groups', () => {
    render(
      <Conversation aria-label="Переписка">
        <MessageGroup author="Анна">
          <Message>Добрый день</Message>
          <Message time="14:02">Успеете?</Message>
        </MessageGroup>
      </Conversation>,
    );
    expect(screen.getAllByText(/Добрый день|Успеете/)).toHaveLength(2);
  });
});

describe('ConversationTurn and AgentAvatar', () => {
  it('a turn is the agent face 28 and a body; the face is named after the author', () => {
    render(<ConversationTurn author="Агент Норды">Соберу отчёт</ConversationTurn>);
    const turn = document.querySelector('[data-slot=conversation-turn]');
    expect(turn?.textContent).toContain('Соберу отчёт');
    const face = screen.getByRole('img', { name: 'Агент Норды' });
    expect(face.getAttribute('data-slot')).toBe('agent-avatar');
    expect(face.getAttribute('style')).toContain('28px');
  });

  it('the avatar is decorative without a label and takes sizes 28, 32 and 56', () => {
    const { container, rerender } = render(<AgentAvatar />);
    const face = () => container.querySelector('[data-slot=agent-avatar]');
    expect(face()?.getAttribute('aria-hidden')).toBe('true');
    expect(face()?.getAttribute('style')).toContain('32px');
    rerender(<AgentAvatar size={56} />);
    expect(face()?.getAttribute('style')).toContain('56px');
  });
});

describe('Stream', () => {
  const text = 'Анна, добрый день!\n\nВ новый год войдут:\n- Тарифы\n- Отчёт по итогам каждого квар';

  it('thinking: spinner, what it is doing and three skeleton lines', () => {
    render(<Stream state="thinking" thinking="Смотрю историю переписки с клиентом…" />);
    const stream = document.querySelector('[data-slot=stream]');
    expect(stream?.getAttribute('data-state')).toBe('thinking');
    expect(screen.getByText('Смотрю историю переписки с клиентом…')).toBeDefined();
    expect(document.querySelectorAll('[data-slot=skeleton]')).toHaveLength(3);
    expect(document.querySelector('[data-slot=stream-caret]')).toBeNull();
  });

  it('streaming: words, a caret after the last one, «Остановить» and the word count', () => {
    const onStop = vi.fn();
    render(<Stream state="streaming" text={text} onStop={onStop} />);
    expect(document.querySelector('[data-slot=stream-text]')?.textContent).toContain('Анна, добрый день!');
    expect(document.querySelectorAll('[data-slot=stream-text] li')).toHaveLength(2);
    const caret = document.querySelector('[data-slot=stream-caret]');
    expect(caret?.getAttribute('aria-hidden')).toBe('true');
    expect(caret?.previousElementSibling?.textContent).toBe('квар');
    expect(screen.getByText('Норда пишет · 13 слов')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Остановить' }));
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-slot=stream-actions]')).toBeNull();
  });

  it('new words do not re-render the old ones: the same nodes stay, only the tail is added', () => {
    const { rerender } = render(<Stream state="streaming" text="Анна, добрый" />);
    const first = document.querySelector('[data-slot=stream-word]');
    rerender(<Stream state="streaming" text="Анна, добрый день! Предлагаем" />);
    expect(document.querySelector('[data-slot=stream-word]')).toBe(first);
    expect(document.querySelectorAll('[data-slot=stream-word]')).toHaveLength(4);
  });

  it('done: no caret and no stop, the actions show up', () => {
    render(<Stream state="done" text={text} actions={<StreamAction icon={<span />} label="Скопировать" />} />);
    expect(document.querySelector('[data-slot=stream-caret]')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Остановить' })).toBeNull();
    expect(document.querySelector('[data-slot=stream-actions]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Скопировать' })).toBeDefined();
  });

  it('stopped: the text stays, «Ответ остановлен на N словах · Продолжить»', () => {
    const onContinue = vi.fn();
    render(<Stream state="stopped" text="Анна, добрый день" onContinue={onContinue} />);
    expect(screen.getByText('Ответ остановлен на 3 словах ·')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('stopped agrees «слове» and «словах» with the number', () => {
    const { rerender } = render(<Stream state="stopped" text="Анна" />);
    expect(screen.getByText('Ответ остановлен на 1 слове ·')).toBeDefined();
    rerender(<Stream state="stopped" text="раз два три четыре пять" />);
    expect(screen.getByText('Ответ остановлен на 5 словах ·')).toBeDefined();
  });

  it('error: an alert that says what happened and offers a retry', () => {
    const onRetry = vi.fn();
    render(<Stream state="error" error="Сервис перегружен. Черновик сохранён — повторите через минуту." onRetry={onRetry} />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Ответ не пришёл');
    expect(alert.textContent).toContain('Сервис перегружен.');
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('the author goes into «… пишет»', () => {
    render(<Stream state="streaming" text="раз два" author="Агент" />);
    expect(screen.getByText('Агент пишет · 2 слова')).toBeDefined();
  });
});

describe('StreamAction', () => {
  it('is a 28 ghost icon button; pressed shows as aria-pressed', () => {
    const onClick = vi.fn();
    render(<StreamAction icon={<span />} label="Нравится" pressed onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Нравится' });
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('data-slot')).toBe('stream-action');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('without pressed it is a plain button', () => {
    render(<StreamAction icon={<span />} label="Скопировать" />);
    expect(screen.getByRole('button', { name: 'Скопировать' }).getAttribute('aria-pressed')).toBeNull();
  });
});
