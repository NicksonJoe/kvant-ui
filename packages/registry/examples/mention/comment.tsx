import { useState } from 'react';
import { MentionField, type MentionPerson, type MentionValue } from '@/kvant';

const people: MentionPerson[] = [
  { id: 'marina', name: 'Марина Соколова', role: 'Менеджер по продажам' },
  { id: 'maria', name: 'Мария Ким', role: 'Бухгалтер' },
  { id: 'ilya', name: 'Илья Громов', role: 'Дизайнер' },
  { id: 'vera', name: 'Вера Лебедева', role: 'Арт-директор' },
];

export default function MentionComment() {
  const [value, setValue] = useState<MentionValue>({ text: '', mentions: [] });
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <MentionField aria-label="Комментарий к сделке" placeholder="Напишите заметку. @ — упомянуть коллегу" people={people} onValueChange={setValue} />
      <p className="text-caption text-fg-3">{value.mentions.length > 0 ? `Уведомим: ${value.mentions.length}` : 'Никого не упомянули'}</p>
    </div>
  );
}
