import { useRef, useState } from 'react';
import {
  Avatar,
  ChatDivider,
  Conversation,
  Message,
  MessageGroup,
  PromptInput,
  TypingIndicator,
  groupMessages,
  type ConversationHistoryStatus,
  type ConversationMessage,
  type MessageStatus,
} from '@/kvant';

interface ChatMessage extends ConversationMessage {
  text: string;
  status?: MessageStatus;
}

const ANNA = 'Анна Северова';
const ME = 'Я';
const now = new Date();
const at = (daysAgo: number, hours: number, minutes: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, hours, minutes);
const clock = (date: Date | string) => {
  const value = typeof date === 'string' ? new Date(date) : date;
  return `${value.getHours()}:${String(value.getMinutes()).padStart(2, '0')}`;
};

const OLD_LINES = [
  [ANNA, 'Пришлите, пожалуйста, смету по второму этапу.'],
  [ME, 'Отправил на почту, там две версии — с анимацией и без.'],
  [ANNA, 'Спасибо, посмотрим с командой.'],
  [ANNA, 'Вторая версия нравится больше, но дороже на 40 000 ₽.'],
  [ME, 'Можем убрать анимацию в подвале — это минус 15 000 ₽.'],
  [ANNA, 'Давайте так и сделаем.'],
] as const;

// Two older days of history, six messages each, as the server would page them.
const olderPage = (page: number): ChatMessage[] =>
  OLD_LINES.map(([author, text], index) => ({
    id: `p${page}-${index}`,
    author,
    direction: author === ME ? 'outgoing' : 'incoming',
    date: at(3 + page, 11, 10 + index * 2),
    text,
    status: author === ME ? 'read' : undefined,
  }));

const initial: ChatMessage[] = [
  { id: 'y1', author: ANNA, direction: 'incoming', date: at(1, 18, 40), text: 'Вечером скину правки по главной.' },
  { id: 'y2', author: ANNA, direction: 'incoming', date: at(1, 18, 41), text: 'Там немного: блок тарифов и подвал.' },
  { id: 'y3', author: ME, direction: 'outgoing', date: at(1, 18, 52), text: 'Хорошо, жду.', status: 'read' },
  { id: 't1', author: ANNA, direction: 'incoming', date: at(0, 14, 0), text: 'Добрый день! Посмотрели макеты главной.' },
  { id: 't2', author: ANNA, direction: 'incoming', date: at(0, 14, 1), text: 'Всё нравится, но блок с тарифами хочется поднять выше — сразу после отзывов.' },
  { id: 't3', author: ANNA, direction: 'incoming', date: at(0, 14, 2), text: 'Успеете до пятницы?' },
  { id: 't4', author: ME, direction: 'outgoing', date: at(0, 14, 5), text: 'Да, поднимем — это минут двадцать.', status: 'read' },
  { id: 't5', author: ME, direction: 'outgoing', date: at(0, 14, 5), text: 'Пришлю обновлённую ссылку в четверг до 18:00.', status: 'failed' },
  { id: 't6', author: ANNA, direction: 'incoming', date: at(0, 14, 6), text: 'Отлично, спасибо! Тогда ждём ссылку.' },
];

const REPLIES = ['Поняла, спасибо!', 'Да, так подходит. Покажу директору сегодня.', 'Отлично, тогда до четверга.'];

export default function ConversationClientChat() {
  const [messages, setMessages] = useState(initial);
  const [pages, setPages] = useState(0);
  const [olderStatus, setOlderStatus] = useState<ConversationHistoryStatus>('idle');
  const [typing, setTyping] = useState(false);
  const failedOnce = useRef(false);
  const replies = useRef(0);
  const ids = useRef(0);
  const anna = <Avatar name={ANNA} size={28} />;

  // the fake server answers by timers; a late answer after unmount is simply dropped by React
  const later = (ms: number, run: () => void) => window.setTimeout(run, ms);
  const setStatus = (id: string, status: MessageStatus) => setMessages((list) => list.map((item) => (item.id === id ? { ...item, status } : item)));

  const loadOlder = () => {
    setOlderStatus('loading');
    later(700, () => {
      // the second page fails once, to show «Повторить»
      if (pages === 1 && !failedOnce.current) {
        failedOnce.current = true;
        setOlderStatus('error');
        return;
      }
      setMessages((list) => [...olderPage(pages), ...list]);
      setPages(pages + 1);
      setOlderStatus('idle');
    });
  };

  const deliver = (id: string) => {
    setStatus(id, 'sending');
    later(600, () => setStatus(id, 'delivered'));
  };

  const send = (text: string) => {
    const id = `m${(ids.current += 1)}`;
    setMessages((list) => [...list, { id, author: ME, direction: 'outgoing', date: new Date(), text, status: 'sending' }]);
    later(600, () => setStatus(id, 'delivered'));
    later(1400, () => {
      setStatus(id, 'read');
      setTyping(true);
    });
    later(3200, () => {
      setTyping(false);
      const reply = REPLIES[replies.current % REPLIES.length] ?? '';
      replies.current += 1;
      setMessages((list) => [...list, { id: `r${(ids.current += 1)}`, author: ANNA, direction: 'incoming', date: new Date(), text: reply }]);
    });
  };

  const entries = groupMessages(messages, { now, unreadFrom: 't6' });
  const lastOutgoing = messages.findLast((item) => item.direction === 'outgoing')?.id;

  return (
    <div className="flex h-[560px] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-surface-1 shadow-raised">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-separator px-5">
        <Avatar name={ANNA} size={32} status="online" />
        <div className="flex min-w-0 flex-col">
          <p className="text-label-md font-semibold text-fg-1">{ANNA}</p>
          <p className="text-caption text-fg-3">«Студия Север» · в сети</p>
        </div>
      </div>
      <Conversation aria-label={`Переписка с ${ANNA}`} className="flex-1" hasOlder={pages < 2} olderStatus={olderStatus} onLoadOlder={loadOlder}>
        {entries.map((entry, index) =>
          entry.type === 'group' ? (
            <MessageGroup
              key={entry.key}
              direction={entry.direction}
              author={entry.direction === 'incoming' && entries[index - 1]?.type === 'day' ? `${ANNA} · «Студия Север»` : undefined}
              avatar={entry.direction === 'incoming' ? anna : undefined}
            >
              {entry.messages.map((item, at) => (
                <Message
                  key={item.id}
                  time={at === entry.messages.length - 1 ? clock(item.date) : undefined}
                  status={item.status === 'failed' || item.status === 'sending' || item.id === lastOutgoing ? item.status : undefined}
                  onRetry={() => deliver(item.id)}
                >
                  {item.text}
                </Message>
              ))}
            </MessageGroup>
          ) : (
            <ChatDivider key={entry.key} variant={entry.type === 'unread' ? 'unread' : 'day'}>
              {entry.label}
            </ChatDivider>
          ),
        )}
        {typing ? <TypingIndicator avatar={anna}>Анна печатает…</TypingIndicator> : null}
      </Conversation>
      <div className="shrink-0 px-3 pb-3">
        <PromptInput onSubmit={send} defaultValue="Ссылка на обновлённую главную будет в четверг до 18:00" />
      </div>
    </div>
  );
}
