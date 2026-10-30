import { Field, Textarea } from '@/kvant';

export default function TextareaCounter() {
  return (
    <Field label="Описание проекта" className="w-96 max-w-full">
      <Textarea maxLength={500} defaultValue="Айдентика для пекарни «Хлебница»: логотип, упаковка и вывеска." />
    </Field>
  );
}
