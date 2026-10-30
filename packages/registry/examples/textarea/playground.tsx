import { Textarea } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { placeholder: 'Что важно знать о клиенте' },
  render: (p) => (
    <Textarea
      aria-label="Комментарий"
      placeholder={p.text('placeholder')}
      rows={p.num('rows')}
      maxLength={p.text('maxLength') ? p.num('maxLength') : undefined}
      invalid={p.bool('invalid')}
      disabled={p.bool('disabled')}
      readOnly={p.bool('readOnly')}
      className="w-96 max-w-full"
    />
  ),
  code: (p) => `<Textarea${p.attrs(['placeholder', 'rows', 'maxLength', 'invalid', 'disabled', 'readOnly'])} />`,
};

export default playground;
