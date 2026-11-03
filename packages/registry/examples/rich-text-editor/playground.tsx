import { RichTextEditor, RichTextEditorStatus, type MentionPerson, type RichTextValue } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const people: MentionPerson[] = [
  { id: 'marina', name: 'Марина Соколова', role: 'Менеджер по продажам' },
  { id: 'maria', name: 'Мария Ким', role: 'Бухгалтер' },
  { id: 'igor', name: 'Игорь Петров', role: 'Закупки' },
];

const sample: RichTextValue = [
  { type: 'heading', content: [{ type: 'text', text: 'Поставка для «Северного ветра»' }] },
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: 'Клиент подтвердил объём ' },
      { type: 'text', text: 'на 1,2 млн ₽', marks: ['bold'] },
      { type: 'text', text: ', условия — в ' },
      { type: 'text', text: 'договоре № 418', href: 'https://norda.cloud/deals/418' },
      { type: 'text', text: '.' },
    ],
  },
  { type: 'bullet', content: [{ type: 'text', text: 'Счёт выставить до пятницы' }] },
];

const playground: Playground = {
  initial: { 'aria-label': 'Описание сделки', placeholder: 'Опишите, о чём договорились с клиентом. Наберите «/» для блоков' },
  controls: [{ name: 'withText', type: 'boolean', default: true, description: 'Начать с примера текста или с пустого поля.' }],
  render: (p) => {
    const compact = p.pick('variant', ['full', 'compact'] as const) === 'compact';
    return (
      <RichTextEditor
        // remount when the starting text or the layout changes: it is uncontrolled here
        key={`${p.bool('withText')}-${compact}`}
        aria-label={p.text('aria-label') || 'Описание сделки'}
        className="w-full max-w-190"
        variant={compact ? 'compact' : 'full'}
        defaultValue={p.bool('withText') ? sample : undefined}
        placeholder={p.text('placeholder')}
        minRows={p.num('minRows')}
        maxLength={p.num('maxLength') || undefined}
        readOnly={p.bool('readOnly')}
        disabled={p.bool('disabled')}
        invalid={p.bool('invalid')}
        people={people}
        status={compact ? undefined : <RichTextEditorStatus state="saved">Сохранено в 14:32</RichTextEditorStatus>}
        onSubmit={compact ? () => {} : undefined}
      />
    );
  },
  code: (p) =>
    `<RichTextEditor${p.attrs(['aria-label', 'variant', 'placeholder', 'minRows', 'maxLength', 'readOnly', 'disabled', 'invalid'])} people={people} value={value} onValueChange={setValue} />`,
};

export default playground;
