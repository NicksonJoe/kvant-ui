import { useState } from 'react';
import { Ban, Copy, Ellipsis, ExternalLink, FoldVertical, MessageSquare, Play } from 'lucide-react';
import {
  CanvasAddStep,
  CanvasGroupFrame,
  CanvasNodeCard,
  CanvasNodeTable,
  CanvasNodeToolbar,
  CanvasNote,
  CanvasSubflowBreadcrumbs,
  CanvasToolbarButton,
  CanvasToolbarSeparator,
} from '@/kvant';

export default function CanvasNodeSpecial() {
  const [collapsed, setCollapsed] = useState(false);
  const [opened, setOpened] = useState(false);

  return (
    <div className="flex w-full flex-col gap-8 rounded-xl bg-surface-2 p-8">
      <div className="flex flex-wrap items-start gap-10">
        <CanvasNodeTable
          title="Сделки"
          count="1 284 записи"
          fields={[
            { name: 'id', type: 'uuid', key: 'primary' },
            { name: 'title', type: 'текст' },
            { name: 'client_id', type: 'Клиенты', key: 'foreign', highlighted: true },
            { name: 'amount', type: '₽' },
          ]}
        />
        <CanvasNodeCard kind="action" title="Отправить в 1С" size="collapsed" logo={{ name: '1С', background: '#FFD400', color: '#C8102E', content: '1С' }} />
        <CanvasAddStep />
        <CanvasNote author={{ name: 'Анна', color: 'var(--color-chart-2)' }} time="2 мин назад">
          Порог бюджета согласовать с Игорем — может, 30 000 ₽ для повторных клиентов?
        </CanvasNote>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <CanvasNodeToolbar aria-label="Действия с шагом">
          <CanvasToolbarButton label="Запустить шаг" icon={<Play className="fill-current" />}>
            Шаг
          </CanvasToolbarButton>
          <CanvasToolbarSeparator />
          <CanvasToolbarButton label="Дублировать" shortcut="⌘D" icon={<Copy />} />
          <CanvasToolbarButton label="Отключить" shortcut="D" icon={<Ban />} />
          <CanvasToolbarButton label="Комментарий" icon={<MessageSquare />} />
          <CanvasToolbarButton label="Ещё" icon={<Ellipsis />} />
        </CanvasNodeToolbar>
        <CanvasNodeToolbar aria-label="Действия с группой">
          <CanvasToolbarButton label="Открыть как граф" icon={<ExternalLink />} onClick={() => setOpened(true)}>
            Открыть
          </CanvasToolbarButton>
          <CanvasToolbarButton label="Свернуть группу" icon={<FoldVertical />} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? 'Развернуть' : 'Свернуть'}
          </CanvasToolbarButton>
        </CanvasNodeToolbar>
      </div>

      <div className="flex flex-wrap items-center gap-10">
        <CanvasGroupFrame title="Обработка оплаты" count={3} collapsed={collapsed} onCollapsedChange={setCollapsed} onOpen={() => setOpened(true)}>
          <div className="flex flex-wrap gap-3">
            <CanvasNodeCard kind="action" title="Выставить счёт" size="collapsed" />
            <CanvasNodeCard kind="wait" title="Ждать 3 дня" size="collapsed" />
            <CanvasNodeCard kind="action" title="Напомнить" size="collapsed" />
          </div>
        </CanvasGroupFrame>
        {opened ? <CanvasSubflowBreadcrumbs parent="Заявка → сделка" current="Обработка оплаты" onBack={() => setOpened(false)} /> : null}
      </div>
    </div>
  );
}
