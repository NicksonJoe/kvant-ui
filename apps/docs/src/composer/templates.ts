// Starter templates of the composer: realistic «Норда» blocks built only from catalog nodes.
import { icon, node, text } from './catalog';
import type { ComposerNode } from './model';

export interface Template {
  id: string;
  title: string;
  description: string;
  create(): ComposerNode;
}

const dealCard = (): ComposerNode =>
  node(
    'card',
    { title: 'Айдентика для пекарни', description: 'Пекарня «Хлебница» · до 30 октября', width: '400' },
    {
      action: [node('icon-button', { 'aria-label': 'Действия со сделкой', size: 'sm' }, { icon: [icon('Ellipsis')] })],
      children: [
        node('row', { justify: 'between' }, {
          children: [node('badge', { tone: 'info', children: 'Переговоры' }), text('1 284 900 ₽', { variant: 'title', numeric: true })],
        }),
        node('row', { gap: 12 }, {
          children: [
            node('avatar', { name: 'Анна Северова' }),
            node('stack', { gap: 0 }, {
              children: [text('Анна Северова', { variant: 'label' }), text('Менеджер проекта', { variant: 'caption', tone: 'tertiary' })],
            }),
          ],
        }),
        node('row', { justify: 'end' }, {
          children: [
            node('button', { variant: 'secondary', size: 'sm', children: 'Написать' }, { leadingIcon: [icon('MessageCircle')] }),
            node('button', { size: 'sm', children: 'Открыть сделку' }, { trailingIcon: [icon('ArrowRight')] }),
          ],
        }),
      ],
    },
  );

const signIn = (): ComposerNode =>
  node(
    'card',
    { title: 'Вход в Норду', description: 'Рабочая почта и пароль от студии', padding: 'spacious', width: '400' },
    {
      children: [
        node('field', { label: 'Почта' }, { children: [node('input', { placeholder: 'name@studio.ru' }, { prefix: [icon('Mail')] })] }),
        node('field', { label: 'Пароль' }, { children: [node('password-input', { placeholder: 'Не меньше 8 символов' })] }),
        node('row', { justify: 'between' }, {
          children: [node('checkbox', { children: 'Запомнить меня' }), node('link', { children: 'Забыли пароль?', href: '#' })],
        }),
        node('button', { size: 'lg', children: 'Войти' }),
      ],
    },
  );

const tableRow = (): ComposerNode =>
  node('card', { variant: 'outline', padding: 'compact', width: '720' }, {
    children: [
      node('row', { justify: 'between', gap: 16 }, {
        children: [
          node('row', { gap: 12 }, {
            children: [
              node('avatar', { name: 'Пекарня Хлебница', size: 40 }),
              node('stack', { gap: 0 }, {
                children: [
                  text('Айдентика для пекарни', { variant: 'label' }),
                  text('Пекарня «Хлебница» · Анна Северова', { variant: 'caption', tone: 'tertiary' }),
                ],
              }),
            ],
          }),
          node('row', { gap: 16 }, {
            children: [
              node('badge', { tone: 'success', variant: 'dot', children: 'Оплачено' }),
              text('1 284 900 ₽', { variant: 'small', weight: 'medium', numeric: true }),
              node('row', { gap: 4 }, {
                children: [
                  node('icon-button', { 'aria-label': 'Изменить', size: 'sm' }, { icon: [icon('Pencil')] }),
                  node('icon-button', { 'aria-label': 'Ещё', size: 'sm' }, { icon: [icon('Ellipsis')] }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

const emptyDeals = (): ComposerNode =>
  node('empty-state', { title: 'Сделок пока нет', description: 'Добавьте первую сделку — воронка соберётся сама.' }, {
    icon: [icon('Wallet')],
    actions: [
      node('button', { size: 'sm', children: 'Новая сделка' }, { leadingIcon: [icon('Plus')] }),
      node('button', { size: 'sm', variant: 'ghost', children: 'Импорт из таблицы' }),
    ],
  });

export const TEMPLATES: readonly Template[] = [
  { id: 'deal-card', title: 'Карточка сделки', description: 'Шапка с действием, сумма, ответственный и две кнопки.', create: dealCard },
  { id: 'sign-in', title: 'Форма входа', description: 'Почта, пароль, «Запомнить меня» и основная кнопка.', create: signIn },
  { id: 'table-row', title: 'Строка таблицы с действиями', description: 'Клиент, статус, сумма и кнопки-иконки.', create: tableRow },
  { id: 'empty-state', title: 'Пустое состояние', description: 'Иконка, объяснение и действия.', create: emptyDeals },
];
