import { SignaturePad } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { label: 'Подпись получателя', meta: 'Акт № 1184 от 2 ноября', signer: 'Ирина Котова, кладовщик' },
  render: (p) => (
    <SignaturePad
      className="w-full max-w-160"
      label={p.text('label')}
      meta={p.text('meta')}
      signer={p.text('signer')}
      hint={p.text('hint')}
      disabled={p.bool('disabled')}
      description={p.text('description')}
    />
  ),
  code: (p) => `<SignaturePad${p.attrs(['label', 'meta', 'signer', 'hint', 'disabled', 'description'])} onAccept={(data) => save(signatureToSvg(data))} />`,
};

export default playground;
