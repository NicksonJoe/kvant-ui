import { createElement } from 'react';
import { Bell, Clock, Globe, MessageSquare, Send, Tag, Webhook } from 'lucide-react';
import type { CanvasStepGroup } from '@/kvant';

/** Palette of the «Заявка из Telegram → сделка» editor. */
export const STEP_GROUPS: readonly CanvasStepGroup[] = [
  {
    id: 'triggers',
    title: 'Триггеры',
    items: [
      { id: 'tg-message', kind: 'trigger', title: 'Новое сообщение', icon: createElement(MessageSquare), keywords: ['telegram', 'чат'] },
      { id: 'schedule', kind: 'trigger', title: 'По расписанию', icon: createElement(Clock), keywords: ['cron', 'время'] },
      { id: 'webhook', kind: 'trigger', title: 'Вебхук', icon: createElement(Webhook), keywords: ['http', 'post'] },
    ],
  },
  {
    id: 'actions',
    title: 'Действия',
    items: [
      { id: 'create-deal', kind: 'action', title: 'Создать сделку', keywords: ['crm', 'воронка'] },
      { id: 'send-message', kind: 'action', title: 'Отправить сообщение', icon: createElement(Send), keywords: ['telegram', 'почта'] },
      { id: 'notify-manager', kind: 'action', title: 'Уведомить менеджера', icon: createElement(Bell) },
      { id: 'http', kind: 'action', title: 'HTTP-запрос', icon: createElement(Globe), keywords: ['api', 'сервис'] },
    ],
  },
  {
    id: 'logic',
    title: 'Логика',
    items: [
      { id: 'condition', kind: 'condition', title: 'Условие', keywords: ['если', 'ветка'] },
      { id: 'for-each', kind: 'loop', title: 'Для каждого', keywords: ['цикл'] },
      { id: 'wait', kind: 'wait', title: 'Подождать', keywords: ['пауза', 'таймер'] },
    ],
  },
  {
    id: 'ai',
    title: 'AI и данные',
    items: [
      { id: 'agent', kind: 'agent', title: 'Агент Норды', keywords: ['ии', 'ai', 'llm'] },
      { id: 'classifier', kind: 'agent', title: 'Классификатор', icon: createElement(Tag), keywords: ['ии', 'категория'] },
      { id: 'table', kind: 'data', title: 'Таблица раздела', keywords: ['запись', 'база'] },
    ],
  },
];
