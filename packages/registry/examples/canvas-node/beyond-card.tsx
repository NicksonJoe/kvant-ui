import { Globe, Pencil, Send } from 'lucide-react';
import {
  Button,
  CanvasNodeCard,
  CanvasNodePeek,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  type CanvasServiceLogo,
} from '@/kvant';

const telegram: CanvasServiceLogo = { name: 'Telegram', background: '#2AABEE', color: '#FFFFFF', content: <Send /> };
const oneC: CanvasServiceLogo = { name: '1С', background: '#FFD400', color: '#C8102E', content: '1С' };

export default function CanvasNodeBeyondCard() {
  return (
    <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6 rounded-xl bg-surface-2 p-8">
      <section aria-label="Данные на узле" className="flex flex-col gap-4">
        <HoverCard>
          <HoverCardTrigger render={<div tabIndex={0} className="w-fit rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" />}>
            <CanvasNodeCard
              kind="action"
              title="Создать сделку"
              subtitle="Действие · Сделки"
              preview={{ value: '№ 1284 · 120 000 ₽', time: '3 мин назад' }}
              outputCount={12}
            />
          </HoverCardTrigger>
          <HoverCardContent className="p-0">
            <CanvasNodePeek
              title="Последний запуск"
              meta="3 мин назад · 12 из 12"
              rows={[
                { label: 'вход', value: 'Иван Петров · сайт · 120 000 ₽' },
                { label: 'выход', value: 'сделка № 1284 в «Неразобранном»' },
              ]}
              action={
                <Button variant="link" size="sm">
                  Открыть все 12 записей
                </Button>
              }
            />
          </HoverCardContent>
        </HoverCard>
      </section>

      <section aria-label="Логотип сервиса" className="flex flex-col gap-3">
        <CanvasNodeCard kind="trigger" title="Новое сообщение" subtitle="Триггер · Telegram" logo={telegram} size="compact" style={{ width: 220 }} />
        <CanvasNodeCard kind="action" title="Выставить счёт" subtitle="Действие · 1С" logo={oneC} size="compact" style={{ width: 220 }} />
        <CanvasNodeCard kind="action" title="Свой сервис" subtitle="Действие · HTTP" icon={<Globe />} size="compact" style={{ width: 220 }} />
      </section>

      <section aria-label="Устойчивость к сбоям" className="flex flex-col gap-4">
        <CanvasNodeCard kind="action" title="Выставить счёт" subtitle="Действие · 1С" logo={oneC} retries={3} timeout="30 с" fallback="ветка «сбой»" />
        <CanvasNodeCard kind="action" title="Выставить счёт" subtitle="Действие · 1С" logo={oneC} status="running" retrying="Повтор 2 из 3 · через 10 с" />
      </section>

      <section aria-label="Агент за работой">
        <CanvasNodeCard
          kind="agent"
          title="Ответить клиенту"
          subtitle="ИИ-агент · 3 инструмента"
          status="running"
          steps={[
            { label: 'Прочитал переписку', state: 'done' },
            { label: 'Нашёл сделку № 1284', state: 'done' },
            { label: 'Пишет ответ', state: 'running' },
            { label: 'Отправит в Telegram', state: 'pending' },
          ]}
          usage="1,2 с · 640 токенов"
          price="0,4 ₽"
          style={{ width: 264 }}
        />
      </section>

      <section aria-label="Изменён после публикации">
        <CanvasNodeCard kind="condition" title="Сумма больше 100 000 ₽" subtitle="Условие · 2 ветки" size="compact" changed style={{ width: 256 }} />
      </section>

      <section aria-label="Кто сейчас правит" className="pt-8">
        <CanvasNodeCard
          kind="action"
          title="Сменить этап"
          subtitle="Действие · Сделки"
          icon={<Pencil />}
          size="compact"
          style={{ width: 240 }}
          people={[
            { name: 'Ирина', color: 'var(--color-chart-2)', editing: true },
            { name: 'Алексей', color: 'var(--color-chart-7)' },
            { name: 'Мария', color: 'var(--color-chart-6)' },
            { name: 'Пётр', color: 'var(--color-chart-8)' },
          ]}
        />
      </section>
    </div>
  );
}
