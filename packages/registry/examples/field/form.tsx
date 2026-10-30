import { Button, Field, Input, Textarea } from '@/kvant';

export default function FieldForm() {
  return (
    <form className="flex w-full max-w-sm flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
      <Field label="Имя и фамилия">
        <Input name="name" autoComplete="name" placeholder="Анна Северова" />
      </Field>
      <Field label="Компания" optional>
        <Input name="company" placeholder="Студия «Север»" />
      </Field>
      <Field label="Комментарий" description="Увидит только ваша команда">
        <Textarea name="comment" placeholder="Что важно знать о клиенте" />
      </Field>
      <Button type="submit" className="self-start">
        Добавить клиента
      </Button>
    </form>
  );
}
