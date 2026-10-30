import { Field, Link, OtpInput } from '@/kvant';

export default function OtpInputStates() {
  return (
    <div className="flex flex-col gap-6">
      <Field
        label="Код из СМС"
        error={
          <>
            Код не подошёл, осталось 2 попытки.{' '}
            <Link href="#resend" variant="inline">
              Прислать новый
            </Link>
          </>
        }
      >
        <OtpInput defaultValue="487913" invalid />
      </Field>
      <Field label="Код из письма" description="Три неверных кода подряд. Новый можно запросить через 4:59">
        <OtpInput disabled />
      </Field>
    </div>
  );
}
