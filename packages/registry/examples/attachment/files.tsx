import { Button, PromptAttachment } from '@/kvant';

export default function AttachmentFiles() {
  return (
    <div className="flex flex-wrap gap-3">
      <PromptAttachment name="Смета_доработки.pdf" meta="184 КБ · PDF" onRemove={() => {}} />
      <PromptAttachment name="Бриф_v3.docx" progress={64} onRemove={() => {}} />
      <PromptAttachment
        name="Видео_презентации.mov"
        error="Больше 20 МБ"
        action={
          <Button variant="link" size="xs">
            Сжать и отправить
          </Button>
        }
        onRemove={() => {}}
      />
    </div>
  );
}
