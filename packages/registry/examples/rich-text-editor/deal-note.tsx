import { Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { RichTextEditor, RichTextEditorStatus, richTextMentions, type MentionPerson, type RichTextValue } from '@/kvant';

const people: MentionPerson[] = [
  { id: 'igor', name: 'Игорь Петров', role: 'Закупки' },
  { id: 'marina', name: 'Марина Соколова', role: 'Менеджер по продажам' },
  { id: 'maria', name: 'Мария Ким', role: 'Бухгалтер' },
  { id: 'tamara', name: 'Тамара Белова', role: 'Логист · в отпуске до 10 ноября' },
];

const note: RichTextValue = [
  { type: 'heading', content: [{ type: 'text', text: 'Поставка для «Северного ветра»' }] },
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: 'Клиент подтвердил объём ' },
      { type: 'text', text: 'на 1,2 млн ₽', marks: ['bold'] },
      { type: 'text', text: ' и просит отгрузку ' },
      { type: 'text', text: 'до 15 ноября', marks: ['italic'] },
      { type: 'text', text: '. Условия — в ' },
      { type: 'text', text: 'договоре № 418', href: 'https://norda.cloud/deals/418' },
      { type: 'text', text: ', оплата 50 / 50.' },
    ],
  },
  { type: 'bullet', content: [{ type: 'text', text: 'Счёт выставить до пятницы' }] },
  { type: 'bullet', content: [{ type: 'text', text: 'Согласовать окно разгрузки со складом' }] },
  { type: 'quote', content: [{ type: 'text', text: '«Если успеем к 15-му, берём ещё две партии на декабрь» — Игорь, закупки' }] },
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: 'Артикул в 1С: ' },
      { type: 'text', text: 'NRD-2041-SV', marks: ['code'] },
    ],
  },
];

type Save = { state: 'saved'; at: string } | { state: 'saving' } | { state: 'error' };

const time = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

/** Typography fixes as a stand-in for an AI rewrite: quotes, dashes, double spaces. */
const improve = (text: string) =>
  text
    .replace(/"([^"]*)"/g, '«$1»')
    .replace(/ - /g, ' — ')
    .replace(/ {2,}/g, ' ');

export default function RichTextDealNote() {
  const [value, setValue] = useState(note);
  const [save, setSave] = useState<Save>({ state: 'saved', at: '14:32' });
  const timer = useRef(0);
  const saves = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // the request: every third one fails, so «Повторить» can be tried
  const persist = () => {
    setSave({ state: 'saving' });
    timer.current = window.setTimeout(() => {
      saves.current += 1;
      setSave(saves.current % 3 === 0 ? { state: 'error' } : { state: 'saved', at: time() });
    }, 700);
  };

  const change = (next: RichTextValue) => {
    setValue(next);
    window.clearTimeout(timer.current);
    // save 1 s after typing stops
    timer.current = window.setTimeout(persist, 1000);
  };

  const mentioned = richTextMentions(value).length;

  return (
    <div className="flex w-full max-w-190 flex-col gap-2">
      <RichTextEditor
        label="Описание сделки"
        value={value}
        onValueChange={change}
        people={people}
        maxLength={2000}
        minRows={10}
        placeholder="Опишите, о чём договорились с клиентом. Наберите «/» для блоков"
        status={
          save.state === 'saved' ? (
            <RichTextEditorStatus state="saved">Сохранено в {save.at}</RichTextEditorStatus>
          ) : save.state === 'saving' ? (
            <RichTextEditorStatus state="saving">Сохраняем…</RichTextEditorStatus>
          ) : (
            <RichTextEditorStatus state="error" onRetry={persist}>
              Не сохранилось · нет сети
            </RichTextEditorStatus>
          )
        }
        selectionActions={(selection) => (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => selection.replace(improve(selection.text))}
            className="inline-flex h-7 items-center gap-1.5 rounded-sm px-2 text-label-sm font-medium text-accent-soft-fg transition-colors duration-(--duration-micro) ease-hover hover:bg-fill-1 [&_svg]:size-4 [&_svg]:stroke-[1.75]"
          >
            <Star aria-hidden />
            Улучшить
          </button>
        )}
      />
      <p className="text-caption text-fg-3">{mentioned > 0 ? `После сохранения уведомим упомянутых: ${mentioned}` : 'Упомяните коллегу через @ — он получит уведомление'}</p>
    </div>
  );
}
