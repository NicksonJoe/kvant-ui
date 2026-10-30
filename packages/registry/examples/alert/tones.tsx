import { Lock } from 'lucide-react';
import { Alert, Button } from '@/kvant';

export default function AlertTones() {
  return (
    <div className="flex w-full max-w-[560px] flex-col gap-3">
      <Alert title="Новые поля в карточке сделки" action={<Button size="sm" variant="secondary">Настроить</Button>}>
        Источник лида и бюджет теперь попадают в отчёты по воронке.
      </Alert>
      <Alert tone="success" title="Почта подключена" action={<Button size="sm" variant="secondary">Входящие</Button>}>
        Письма клиентов прикрепляются к сделкам автоматически.
      </Alert>
      <Alert tone="warning" title="Тариф заканчивается через 3 дня" action={<Button size="sm" variant="secondary">Продлить</Button>}>
        После 01.11.2026 отчёты и экспорт будут доступны только для чтения.
      </Alert>
      <Alert tone="danger" title="Платёж не прошёл" action={<Button size="sm" variant="secondary">Обновить карту</Button>}>
        Банк отклонил списание 4 500 ₽. Обновите карту, чтобы не потерять доступ.
      </Alert>
      <Alert
        tone="neutral"
        icon={<Lock aria-hidden />}
        title="Только для чтения"
        action={<Button size="sm" variant="secondary">Запросить доступ</Button>}
      >
        Эту воронку настраивает администратор пространства — Анна Северова.
      </Alert>
    </div>
  );
}
