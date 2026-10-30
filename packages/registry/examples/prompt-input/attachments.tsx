import { useState } from 'react';
import { Button, PromptAttachment, PromptInput } from '@/kvant';

interface Attachment {
  id: string;
  name: string;
  meta?: string;
  progress?: number;
  error?: string;
}

const initial: Attachment[] = [
  { id: 'estimate', name: 'Смета_доработки.pdf', meta: '184 КБ · PDF' },
  { id: 'brief', name: 'Бриф_v3.docx', progress: 64 },
  { id: 'video', name: 'Видео_презентации.mov', error: 'Больше 20 МБ' },
];

export default function PromptInputAttachments() {
  const [files, setFiles] = useState(initial);
  const [sent, setSent] = useState<string | null>(null);
  const remove = (id: string) => setFiles((current) => current.filter((file) => file.id !== id));

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <PromptInput
        defaultValue="Макет и смета на доработки"
        onAttach={() => {}}
        onSubmit={(text) => {
          setSent(text);
          setFiles([]);
        }}
        attachments={
          files.length > 0
            ? files.map((file) => (
                <PromptAttachment
                  key={file.id}
                  name={file.name}
                  meta={file.meta}
                  progress={file.progress}
                  error={file.error}
                  action={
                    file.error ? (
                      <Button variant="link" size="xs">
                        Сжать и отправить
                      </Button>
                    ) : undefined
                  }
                  onRemove={() => remove(file.id)}
                />
              ))
            : undefined
        }
      />
      {sent ? <p className="px-4 text-caption text-fg-3">Отправлено: «{sent}»</p> : null}
    </div>
  );
}
