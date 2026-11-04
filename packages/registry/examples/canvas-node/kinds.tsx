import { Clock, MessageSquare, Tag, Webhook } from 'lucide-react';
import type { ReactNode } from 'react';
import { CanvasNodeCard, type CanvasNodeSize } from '@/kvant';
import type { CanvasNodeKind } from '@/kvant/components/canvas-types';

interface Row {
  kind: CanvasNodeKind;
  title: string;
  subtitle: string;
  summary: string;
  icon?: ReactNode;
}

const ROWS: readonly Row[] = [
  { kind: 'trigger', title: 'Новое сообщение', subtitle: 'Триггер', summary: '@norda_bot', icon: <MessageSquare /> },
  { kind: 'trigger', title: 'По расписанию', subtitle: 'Триггер · расписание', summary: 'пн–пт · 09:00 МСК', icon: <Clock /> },
  { kind: 'trigger', title: 'Вебхук', subtitle: 'Триггер · вебхук', summary: 'POST /hooks/zayavka', icon: <Webhook /> },
  { kind: 'action', title: 'Создать сделку', subtitle: 'Действие', summary: 'этап: Неразобранное' },
  { kind: 'condition', title: 'Есть бюджет?', subtitle: 'Условие', summary: 'budget ≥ 50 000' },
  { kind: 'loop', title: 'Для каждого', subtitle: 'Цикл', summary: 'по items · 12 шт.' },
  { kind: 'wait', title: 'Подождать', subtitle: 'Пауза', summary: '3 дня или ответ клиента' },
  { kind: 'agent', title: 'Разобрать заявку', subtitle: 'Агент Норды', summary: 'норда · быстрая' },
  { kind: 'agent', title: 'Классификатор', subtitle: 'ИИ · 3 класса', summary: 'по тексту сообщения', icon: <Tag /> },
  { kind: 'data', title: 'Записать в таблицу', subtitle: 'Данные', summary: 'раздел «Сделки»' },
];

const SIZES: readonly { size: CanvasNodeSize; label: string }[] = [
  { size: 'full', label: 'Полный · 208–280' },
  { size: 'compact', label: 'Компактный · 180, h54' },
  { size: 'collapsed', label: 'Свёрнутый · пилюля h40' },
];

export default function CanvasNodeKinds() {
  return (
    <div className="w-full overflow-x-auto rounded-xl bg-surface-2">
      <table className="w-full min-w-[880px] border-collapse">
        <thead>
          <tr className="text-label-sm text-fg-2">
            <th className="w-40 p-4 text-left font-medium">Тип</th>
            {SIZES.map((column) => (
              <th key={column.size} className="p-4 font-medium">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.title} className="border-t border-separator">
              <th className="p-4 text-left text-label-md font-medium text-fg-1">{row.title}</th>
              {SIZES.map((column) => (
                <td key={column.size} className="p-5 text-center">
                  <div className="inline-flex">
                    <CanvasNodeCard kind={row.kind} title={row.title} subtitle={column.size === 'full' ? row.subtitle : undefined} summary={row.summary} icon={row.icon} size={column.size} />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
