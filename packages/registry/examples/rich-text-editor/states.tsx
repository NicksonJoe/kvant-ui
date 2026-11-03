import { useState } from 'react';
import { RichTextEditor, RichTextEditorStatus, type RichTextValue } from '@/kvant';

const closed: RichTextValue = [
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: 'Клиент подтвердил объём ' },
      { type: 'text', text: 'на 1,2 млн ₽', marks: ['bold'] },
      { type: 'text', text: '. Отгрузка до 15 ноября, условия — в ' },
      { type: 'text', text: 'договоре № 418', href: 'https://norda.cloud/deals/418' },
      { type: 'text', text: '.' },
    ],
  },
];

const tooLong: RichTextValue = [{ type: 'paragraph', content: [{ type: 'text', text: '…и ещё раз напомнить про пропуск на склад, иначе водитель снова простоит два часа у ворот.' }] }];
const short: RichTextValue = [{ type: 'paragraph', content: [{ type: 'text', text: '…согласовать окно разгрузки и пропуск на склад.' }] }];

export default function RichTextStates() {
  const [retried, setRetried] = useState(false);
  return (
    <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(280px,1fr))] items-start gap-8">
      <RichTextEditor aria-label="Заметка о клиенте" placeholder="Опишите, о чём договорились с клиентом. Наберите «/» для блоков" />
      <RichTextEditor
        aria-label="Описание закрытой сделки"
        defaultValue={closed}
        readOnly
        minRows={2}
        status={<RichTextEditorStatus state="locked">Сделка закрыта · правка недоступна</RichTextEditorStatus>}
      />
      <RichTextEditor aria-label="Напоминание водителю" defaultValue={tooLong} maxLength={45} minRows={2} />
      <RichTextEditor aria-label="Комментарий к клиенту" placeholder="Заполнится после выбора клиента" disabled />
      <RichTextEditor aria-label="Заметка у лимита" defaultValue={short} maxLength={50} minRows={1} status={<RichTextEditorStatus state="saved">Сохранено в 14:32</RichTextEditorStatus>} />
      <RichTextEditor
        aria-label="Заметка при ошибке сохранения"
        defaultValue={short}
        maxLength={2000}
        minRows={1}
        status={
          retried ? (
            <RichTextEditorStatus state="saved">Сохранено только что</RichTextEditorStatus>
          ) : (
            <RichTextEditorStatus state="error" onRetry={() => setRetried(true)}>
              Не сохранилось · нет сети
            </RichTextEditorStatus>
          )
        }
      />
    </div>
  );
}
