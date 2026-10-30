import { TagsInput } from '@/kvant';

export default function TagsInputOverflow() {
  return (
    <TagsInput
      aria-label="Теги проекта"
      defaultValue={['брендинг', 'сайт', 'срочно', 'упаковка', 'вывеска', 'презентация']}
      visibleTags={3}
      className="w-76 max-w-full"
    />
  );
}
