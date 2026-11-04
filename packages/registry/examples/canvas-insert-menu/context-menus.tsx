import { useState } from 'react';
import { CanvasNodeCard, CanvasNodeMenuContent, CanvasPaneMenuContent, ContextMenu, ContextMenuTrigger } from '@/kvant';

export default function CanvasInsertMenuContext() {
  const [disabled, setDisabled] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [log, setLog] = useState('Правый клик по пустому месту или по шагу');
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid gap-4 sm:grid-cols-2">
        <ContextMenu>
          <ContextMenuTrigger className="grid min-h-[240px] place-items-center rounded-xl bg-surface-2 text-body-sm text-fg-3">Пустое место канваса</ContextMenuTrigger>
          <CanvasPaneMenuContent
            onInsertStep={() => setLog('Открыта вставка шага')}
            onAddNote={() => setLog('Добавлен стикер')}
            onPaste={() => setLog('Вставлено из буфера')}
            onSelectAll={() => setLog('Выделено всё')}
            onLayout={() => setLog('Граф разложен')}
            onFit={() => setLog('Граф вписан в экран')}
          />
        </ContextMenu>
        <div className="grid min-h-[240px] place-items-center rounded-xl bg-surface-2">
          <ContextMenu>
            <ContextMenuTrigger className="rounded-md">
              <CanvasNodeCard
                kind="action"
                title="Создать сделку"
                summary="этап: Неразобранное"
                disabled={disabled}
                pinned={pinned ? 'Закреплено · 3 поля' : undefined}
              />
            </ContextMenuTrigger>
            <CanvasNodeMenuContent
              disabled={disabled}
              pinned={pinned}
              onRunFrom={() => setLog('Запуск с шага «Создать сделку»')}
              onTogglePinned={() => setPinned(!pinned)}
              onDuplicate={() => setLog('Шаг продублирован')}
              onGroup={() => setLog('Шаг сгруппирован')}
              onToggleDisabled={() => setDisabled(!disabled)}
              onDelete={() => setLog('Открыто подтверждение «Удалить шаг?»')}
            />
          </ContextMenu>
        </div>
      </div>
      <p className="text-body-sm text-fg-2" aria-live="polite">
        {log}
      </p>
    </div>
  );
}
