import { Avatar, ChatDivider, Conversation, ConversationTurn, Message, MessageGroup, Stream } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const streamStates = ['thinking', 'streaming', 'done', 'stopped', 'error'] as const;
const ANSWER = 'Анна, добрый день! Предлагаем продлить договор на 2027 год со скидкой 10 % — она действует до 15 ноября. В новый год войдут:\n- Тарифы с безлимитными правками макетов\n- Персональный менеджер на весь проект\n- Отчёт по итогам каждого квар';

const playground: Playground = {
  controls: [
    {
      name: 'stream',
      type: 'enum',
      options: streamStates,
      default: 'done',
      description: 'Ответ агента в варианте agent; при busy — всегда streaming.',
    },
  ],
  render: (p) => {
    const variant = p.pick('variant', ['chat', 'agent'] as const);
    const busy = p.bool('busy');
    return (
      <Conversation
        aria-label="Переписка"
        variant={variant}
        busy={busy}
        hasOlder={p.bool('hasOlder')}
        olderStatus={p.pick('olderStatus', ['idle', 'loading', 'error'] as const)}
        onLoadOlder={() => {}}
        className="h-[400px] w-full max-w-[560px] rounded-xl bg-surface-1 shadow-raised"
      >
        {variant === 'chat' ? (
          <>
            <ChatDivider>Сегодня, 29 октября</ChatDivider>
            <MessageGroup author="Анна Северова · «Студия Север»" avatar={<Avatar name="Анна Северова" size={28} />}>
              <Message>Добрый день! Посмотрели макеты главной.</Message>
              <Message>Всё нравится, но блок с тарифами хочется поднять выше — сразу после отзывов.</Message>
              <Message time="14:02">Успеете до пятницы?</Message>
            </MessageGroup>
            <MessageGroup direction="outgoing">
              <Message>Да, поднимем — это минут двадцать.</Message>
              <Message time="14:05" status="read">
                Пришлю обновлённую ссылку в четверг до 18:00.
              </Message>
            </MessageGroup>
          </>
        ) : (
          <>
            <Message direction="outgoing">Напиши Анне письмо о продлении — коротко, со скидкой</Message>
            <ConversationTurn>
              <Stream
                state={busy ? 'streaming' : p.pick('stream', streamStates)}
                text={ANSWER}
                thinking="Смотрю историю переписки с клиентом…"
                error="Сервис перегружен. Черновик сохранён — повторите через минуту."
                onStop={() => {}}
                onContinue={() => {}}
                onRetry={() => {}}
              />
            </ConversationTurn>
          </>
        )}
      </Conversation>
    );
  },
  code: (p) => `<Conversation aria-label="Переписка"${p.attrs(['variant', 'busy', 'hasOlder', 'olderStatus'])}${p.bool('hasOlder') ? ' onLoadOlder={loadOlder}' : ''}>
  {entries.map((entry) => …)}
</Conversation>`,
};

export default playground;
