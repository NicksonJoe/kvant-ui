import { Clock, WifiOff, Zap } from 'lucide-react';
import { useState } from 'react';
import { Banner, Button } from '@/kvant';

export default function AlertBanner() {
  const [shown, setShown] = useState({ maintenance: true, tariff: true, news: true });
  const hide = (key: keyof typeof shown) => () => setShown((current) => ({ ...current, [key]: false }));

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="overflow-hidden rounded-xl shadow-raised">
        {shown.maintenance ? (
          <Banner icon={<Clock aria-hidden />} onDismiss={hide('maintenance')}>
            Плановые работы 30 октября с 02:00 до 04:00 МСК — Норда будет недоступна. <a href="#maintenance">Подробнее</a>
          </Banner>
        ) : null}
        {shown.tariff ? (
          <Banner tone="warning" onDismiss={hide('tariff')}>
            Тариф «Студия» заканчивается 01.11.2026 — после этого отчёты будут только для чтения. <a href="#billing">Продлить</a>
          </Banner>
        ) : null}
        <Banner tone="danger" icon={<WifiOff aria-hidden />}>
          Нет связи с сервером. Изменения сохранятся, когда соединение восстановится.
        </Banner>
        {shown.news ? (
          <Banner tone="inverse" icon={<Zap aria-hidden />} onDismiss={hide('news')}>
            Норда 3.0: отчёты по сотрудникам и новый календарь встреч. <a href="#whats-new">Что нового</a>
          </Banner>
        ) : null}
        <div className="bg-background px-6 py-5 text-body-sm text-fg-3">Страница под баннерами сдвигается, а не перекрывается.</div>
      </div>
      <Button size="sm" variant="ghost" className="self-start" onClick={() => setShown({ maintenance: true, tariff: true, news: true })}>
        Вернуть баннеры
      </Button>
    </div>
  );
}
