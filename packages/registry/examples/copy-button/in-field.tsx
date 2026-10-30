import { Link2 } from 'lucide-react';
import { CopyButton, Field, Input } from '@/kvant';

const invite = 'norda.app/i/4F7K-29QX';

export default function CopyButtonInField() {
  return (
    <Field label="Ссылка-приглашение" description="Откроет проект без регистрации, действует 7 дней" className="w-90 max-w-full">
      <Input
        readOnly
        value={invite}
        prefix={<Link2 aria-hidden />}
        suffix={<CopyButton value={`https://${invite}`} aria-label="Копировать ссылку" />}
        className="pr-1 [&_input]:font-mono [&_input]:text-[13px]"
      />
    </Field>
  );
}
