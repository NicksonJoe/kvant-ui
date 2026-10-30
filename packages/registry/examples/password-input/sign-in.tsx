import { Button, Field, Input, Link, PasswordInput } from '@/kvant';

export default function PasswordInputSignIn() {
  return (
    <form className="flex w-80 max-w-full flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
      <Field label="Почта">
        <Input name="email" type="email" autoComplete="username" defaultValue="anna@norda.ru" />
      </Field>
      <Field label="Пароль">
        <PasswordInput name="password" />
      </Field>
      <div className="flex items-center justify-between gap-3">
        <span className="text-label-sm">
          <Link href="#reset">Забыли пароль?</Link>
        </span>
        <Button type="submit">Войти</Button>
      </div>
    </form>
  );
}
