import { MentionField } from '@/kvant';

export default function MentionShort() {
  return (
    <MentionField
      aria-label="Ответ в задаче"
      placeholder="Ответить…"
      minRows={1}
      className="w-full max-w-sm"
      people={[
        { id: 'oleg', name: 'Олег Ильин', role: 'Руководитель проекта' },
        { id: 'anna', name: 'Анна Северова', role: 'Менеджер' },
      ]}
    />
  );
}
