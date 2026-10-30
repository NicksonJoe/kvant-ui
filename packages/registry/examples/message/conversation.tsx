import { Heart, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import { Avatar, ChatDivider, Message, MessageGroup, MessageReaction, TypingIndicator } from '@/kvant';

export default function MessageConversation() {
  const [liked, setLiked] = useState(true);
  const anna = <Avatar name="Анна Северова" size={28} />;

  return (
    <div className="flex w-full max-w-xl flex-col gap-4 rounded-xl bg-surface-1 p-5 shadow-raised">
      <ChatDivider>Сегодня, 29 октября</ChatDivider>
      <MessageGroup author="Анна Северова · «Норда»" avatar={anna}>
        <Message>Добрый день! Посмотрели макеты главной.</Message>
        <Message>Всё нравится, но блок с тарифами хочется поднять выше — сразу после отзывов.</Message>
        <Message time="14:02">Успеете до пятницы?</Message>
      </MessageGroup>
      <MessageGroup direction="outgoing">
        <Message>Да, поднимем — это минут двадцать.</Message>
        <Message
          time="14:05"
          status="read"
          footer={<MessageReaction icon={<Heart className="fill-danger text-danger" />} count={1} label="Сердце" />}
        >
          Пришлю обновлённую ссылку в четверг до 18:00.
        </Message>
      </MessageGroup>
      <ChatDivider variant="unread">1 новое сообщение</ChatDivider>
      <MessageGroup avatar={anna}>
        <Message
          time="14:06"
          footer={<MessageReaction icon={<ThumbsUp />} count={liked ? 2 : 1} label="Нравится" selected={liked} onClick={() => setLiked((on) => !on)} />}
        >
          Отлично, спасибо! Тогда ждём ссылку.
        </Message>
      </MessageGroup>
      <TypingIndicator avatar={anna}>Анна печатает…</TypingIndicator>
    </div>
  );
}
