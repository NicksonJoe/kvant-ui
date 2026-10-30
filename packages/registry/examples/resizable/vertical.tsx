import { Resizable } from '@/kvant';

export default function ResizableVertical() {
  return (
    <Resizable label="Высота письма" orientation="vertical" defaultValue={60} min={30} max={80} className="h-96 w-full max-w-xl overflow-hidden rounded-xl bg-surface-1 shadow-raised">
      <div className="flex flex-col gap-2 p-5">
        <p className="text-caption text-fg-3">Ольга Миронова · 14:20</p>
        <p className="text-body-sm text-fg-1">
          Добрый день! Посмотрели макеты главной. Всё нравится, но блок с тарифами хочется поднять выше — сразу после отзывов. Успеете до пятницы?
        </p>
      </div>
      <div className="flex flex-col gap-2 bg-surface-2 p-5">
        <p className="text-caption text-fg-3">Ответ</p>
        <p className="text-body-sm text-fg-2">Да, поднимем — это минут двадцать. Пришлю обновлённую ссылку в четверг до 18:00.</p>
      </div>
    </Resizable>
  );
}
