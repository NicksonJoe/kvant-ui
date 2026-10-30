import { Field, Textarea } from '@/kvant';

export default function TextareaError() {
  return (
    <Field label="Причина отказа" error="Опишите причину хотя бы в двух словах" className="w-96 max-w-full">
      <Textarea placeholder="Например: выбрали другого подрядчика" />
    </Field>
  );
}
