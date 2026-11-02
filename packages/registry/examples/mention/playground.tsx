import { MentionField } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const people = [
  { id: 'marina', name: 'Марина Соколова', role: 'Менеджер по продажам' },
  { id: 'maria', name: 'Мария Ким', role: 'Бухгалтер' },
];

const playground: Playground = {
  initial: { placeholder: 'Напишите заметку. @ — упомянуть коллегу' },
  render: (p) => <MentionField aria-label="Комментарий" className="w-full max-w-md" people={people} placeholder={p.text('placeholder')} minRows={p.num('minRows')} />,
  code: (p) => `<MentionField aria-label="Комментарий" people={people} onValueChange={setValue}${p.attrs(['placeholder', 'minRows'])} />`,
};

export default playground;
