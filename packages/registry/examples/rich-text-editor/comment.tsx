import { useRef, useState } from 'react';
import { Avatar, RichTextEditor, emptyRichText, richTextToHTML, type MentionPerson, type RichTextValue } from '@/kvant';

const people: MentionPerson[] = [
  { id: 'igor', name: 'Игорь Петров', role: 'Закупки' },
  { id: 'marina', name: 'Марина Соколова', role: 'Менеджер по продажам' },
  { id: 'maria', name: 'Мария Ким', role: 'Бухгалтер' },
];

interface Comment {
  id: number;
  author: string;
  time: string;
  body: RichTextValue;
}

const first: Comment = {
  id: 1,
  author: 'Вера Лебедева',
  time: 'вчера, 18:52',
  body: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Счёт отправила, ждём оплату ' },
        { type: 'text', text: 'до пятницы', marks: ['bold'] },
        { type: 'text', text: '.' },
      ],
    },
  ],
};

// Comment text styles for richTextToHTML output: the same look as in the field.
const body =
  'text-body-sm text-fg-1 [&_strong]:font-semibold [&_a]:text-accent-soft-fg [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_[data-mention-id]]:rounded-xs [&_[data-mention-id]]:bg-accent-soft [&_[data-mention-id]]:px-1 [&_[data-mention-id]]:font-medium [&_[data-mention-id]]:text-accent-soft-fg [&_code]:rounded-xs [&_code]:bg-fill-2 [&_code]:px-1.5 [&_code]:font-mono [&_code]:text-caption';

export default function RichTextComment() {
  const [comments, setComments] = useState<Comment[]>([first]);
  const [value, setValue] = useState<RichTextValue>(emptyRichText());
  const [files, setFiles] = useState<string[]>([]);
  const picker = useRef<HTMLInputElement>(null);

  const send = (doc: RichTextValue) => {
    setComments((list) => [...list, { id: list.length + 1, author: 'Алексей Смирнов', time: 'только что', body: doc }]);
    setValue(emptyRichText());
    setFiles([]);
  };

  return (
    <div className="flex w-full max-w-160 flex-col gap-5">
      <ul className="flex flex-col gap-4">
        {comments.map((comment) => (
          <li key={comment.id} className="flex gap-3">
            <Avatar name={comment.author} size={32} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="flex items-baseline gap-2">
                <span className="text-label-md font-semibold text-fg-1">{comment.author}</span>
                <span className="text-caption text-fg-3">{comment.time}</span>
              </p>
              {/* richTextToHTML escapes text and keeps only safe tags and links */}
              <div className={body} dangerouslySetInnerHTML={{ __html: richTextToHTML(comment.body) }} />
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-start gap-3">
        <Avatar name="Алексей Смирнов" size={32} className="mt-1.5" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <RichTextEditor
            variant="compact"
            aria-label="Комментарий к сделке"
            placeholder="Комментарий к сделке… @ — упомянуть"
            people={people}
            value={value}
            onValueChange={setValue}
            onSubmit={send}
            onAttach={() => picker.current?.click()}
          />
          <input ref={picker} type="file" multiple hidden onChange={(event) => setFiles([...(event.target.files ?? [])].map((file) => file.name))} />
          {files.length > 0 ? <p className="text-caption text-fg-3">Прикреплено: {files.join(', ')}</p> : null}
        </div>
      </div>
    </div>
  );
}
