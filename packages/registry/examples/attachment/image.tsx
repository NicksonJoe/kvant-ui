import { PromptAttachment } from '@/kvant';

// a page mock-up drawn inline, so the example needs no network
const mockup = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><rect width="56" height="56" fill="#e8f0fd"/><rect x="8" y="10" width="26" height="5" rx="2.5" fill="#3b82f6"/><rect x="8" y="20" width="40" height="3" rx="1.5" fill="#bfd3f7"/><rect x="8" y="27" width="32" height="3" rx="1.5" fill="#bfd3f7"/><rect x="8" y="36" width="40" height="12" rx="3" fill="#fff"/></svg>',
)}`;

export default function AttachmentImage() {
  return (
    <div className="flex gap-3">
      <PromptAttachment name="Макет_главной.png" preview={mockup} onRemove={() => {}} />
      <PromptAttachment name="Макет_тарифов.png" preview={mockup} progress={40} onRemove={() => {}} />
    </div>
  );
}
