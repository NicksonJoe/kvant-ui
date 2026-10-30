import { Alert } from '@/kvant';

/** Outline: surface-1 and a hairline, the icon carries the tone — for calm notes in forms and settings. */
export default function AlertOutline() {
  return (
    <div className="flex w-full max-w-[560px] flex-col gap-3">
      <Alert variant="outline" title="Как считается НДС">
        Сумму сделки вводите без налога: Норда добавит НДС в счёт и акт по ставке из карточки клиента.
      </Alert>
      <Alert variant="outline" tone="warning" title="Изменения увидит вся команда">
        Этапы воронки общие для пространства «Студия Север».
      </Alert>
      <Alert variant="outline" tone="success">
        Импорт завершён: 1 284 контакта, дубли объединены.
      </Alert>
    </div>
  );
}
