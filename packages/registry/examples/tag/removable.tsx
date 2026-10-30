import { useState } from 'react';
import { Tag } from '@/kvant';

export default function TagRemovable() {
  const [tags, setTags] = useState(['Брендинг', 'Упаковка', 'Вывеска']);
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {tags.map((tag) => (
        <Tag key={tag} onRemove={() => setTags((current) => current.filter((item) => item !== tag))}>
          {tag}
        </Tag>
      ))}
      {tags.length === 0 ? <span className="text-body-sm text-fg-3">Направления не выбраны</span> : null}
    </div>
  );
}
