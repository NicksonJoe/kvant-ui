import { Send } from 'lucide-react';
import { CanvasInspector, Field, InspectorEmpty, InspectorIcon, InspectorNote, Select, VariableChip } from '@/kvant';

export default function InspectorStates() {
  return (
    <div className="flex w-full flex-wrap items-start gap-6">
      <CanvasInspector
        variant="card"
        title="Ответить шаблоном"
        subtitle="Действие · Telegram · шаг 5"
        icon={
          <InspectorIcon color="var(--color-brand-telegram, oklch(0.685 0.135 232))" solid>
            <Send />
          </InspectorIcon>
        }
        runCount={0}
        errors={1}
        onClose={() => {}}
        params={
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-caption font-medium text-fg-2">Кому</span>
              <VariableChip path="сообщение.чат" className="self-start" />
            </div>
            <Field label="Шаблон" error="Без шаблона шаг не запустится">
              <Select aria-label="Шаблон" required placeholder="Выберите шаблон" options={[{ value: 'hello', label: 'Приветствие' }]} />
            </Field>
          </>
        }
      />
      <CanvasInspector variant="card" title="Заявка из Telegram → сделка" subtitle="Черновик · опубликована версия 7">
        <InspectorEmpty steps={6} edges={5} warnings={2}>
          <InspectorNote title="Версия 7 — 28 октября">Опубликовала Ирина · с тех пор 2 правки</InspectorNote>
        </InspectorEmpty>
      </CanvasInspector>
    </div>
  );
}
