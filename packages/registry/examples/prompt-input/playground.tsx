import { PromptAttachment, PromptInput } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  controls: [{ name: 'attachment', type: 'boolean', default: false, description: 'Файл над текстом.' }],
  render: (p) => (
    <PromptInput
      className="w-full max-w-xl"
      placeholder={p.text('placeholder')}
      sending={p.bool('sending')}
      disabled={p.bool('disabled')}
      onAttach={() => {}}
      onSubmit={() => {}}
      attachments={p.bool('attachment') ? <PromptAttachment name="Смета_доработки.pdf" meta="184 КБ · PDF" onRemove={() => {}} /> : undefined}
    />
  ),
  code: (p) => `<PromptInput${p.attrs(['placeholder', 'sending', 'disabled'])}
  onAttach={pickFile}
  onSubmit={send}${p.bool('attachment') ? '\n  attachments={<PromptAttachment name="Смета_доработки.pdf" meta="184 КБ · PDF" onRemove={removeFile} />}' : ''}
/>`,
};

export default playground;
