import { useState } from 'react';
import { PromptInput } from '@/kvant';

export default function PromptInputStates() {
  const [sending, setSending] = useState(false);

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <PromptInput
        defaultValue="Макет и смета на доработки"
        onAttach={() => {}}
        sending={sending}
        onSubmit={() => {
          setSending(true);
          setTimeout(() => setSending(false), 1500);
        }}
      />
      <PromptInput onSubmit={() => {}} disabled placeholder="Чат закрыт: сделка перенесена в архив" />
    </div>
  );
}
