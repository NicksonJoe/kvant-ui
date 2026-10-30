import { Field, TagsInput } from '@/kvant';

const known = ['дизайн-система', 'дизайн-ревью', 'брендинг', 'сайт', 'упаковка', 'срочно', 'презентация'];

export default function TagsInputSuggestions() {
  return (
    <Field label="Теги проекта" description="Enter или запятая — новый тег" className="w-76 max-w-full">
      <TagsInput name="tags" defaultValue={['брендинг', 'сайт']} suggestions={known} />
    </Field>
  );
}
