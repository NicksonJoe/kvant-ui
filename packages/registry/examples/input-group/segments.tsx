import { Field, Input, InputAddon } from '@/kvant';

export default function InputGroupSegments() {
  return (
    <div className="flex w-80 max-w-full flex-col gap-4">
      <Field label="Ссылка на бриф">
        <Input name="brief" defaultValue="norda.ru/brief/sever" prefix={<InputAddon variant="segment">https://</InputAddon>} />
      </Field>
      <Field label="Адрес студии" description="Так вас найдут клиенты">
        <Input name="slug" defaultValue="studio-sever" suffix={<InputAddon variant="segment">.norda.ru</InputAddon>} />
      </Field>
      <Field label="Бюджет проекта">
        <Input name="budget" inputMode="decimal" defaultValue="1 284 900" suffix={<InputAddon>₽</InputAddon>} />
      </Field>
    </div>
  );
}
