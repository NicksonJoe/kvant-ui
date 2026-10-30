import { Field, PasswordInput } from '@/kvant';

export default function PasswordInputNewPassword() {
  return (
    <Field label="Новый пароль" className="w-76 max-w-full">
      <PasswordInput name="password" showStrength defaultValue="Sever-2026!" />
    </Field>
  );
}
