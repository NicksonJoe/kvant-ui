import { Sparkles } from 'lucide-react';
import { CanvasInspector, Field, InspectorGroup, InspectorIcon, InspectorNote, InspectorOutputs, InstructionField, Select } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { title: 'Разобрать заявку', subtitle: 'Агент Норды · шаг 2', runCount: 24 },
  render: (p) => (
    <CanvasInspector
      variant={p.pick('variant', ['panel', 'card'] as const)}
      className={p.pick('variant', ['panel', 'card'] as const) === 'panel' ? 'w-72 border-l border-separator' : undefined}
      title={p.text('title')}
      subtitle={p.text('subtitle') || undefined}
      icon={
        <InspectorIcon color="var(--color-chart-7)">
          <Sparkles />
        </InspectorIcon>
      }
      errors={p.num('errors')}
      runCount={p.num('runCount')}
      onClose={() => {}}
      params={
        <>
          <Field label="Модель">
            <Select
              aria-label="Модель"
              defaultValue="fast"
              options={[
                { value: 'fast', label: 'Норда · быстрая' },
                { value: 'deep', label: 'Норда · вдумчивая' },
              ]}
            />
          </Field>
          <InspectorGroup label="Инструкция">
            <InstructionField aria-label="Инструкция" defaultValue="Найди в {{сообщение.текст}} бюджет, срок и что нужно сделать. Если бюджета нет — верни 0." variables={['сообщение.текст', 'клиент.имя']} />
          </InspectorGroup>
          <InspectorGroup label="Выходы" actionLabel="Поле" onAction={() => {}}>
            <InspectorOutputs
              aria-label="Выходы"
              outputs={[
                { name: 'budget', type: 'number', value: '120 000' },
                { name: 'deadline', type: 'date', value: '15 декабря' },
                { name: 'task', type: 'text', value: 'Сайт' },
              ]}
            />
          </InspectorGroup>
          <InspectorNote title="Прошлый запуск — 3 мин назад">1,4 с · 840 токенов · 0,6 ₽ — значения справа взяты из него</InspectorNote>
        </>
      }
    />
  ),
  code: (p) => `<CanvasInspector${p.attrs(['title', 'subtitle', 'variant', 'errors', 'runCount'])} icon={<InspectorIcon color="var(--color-chart-7)"><Sparkles /></InspectorIcon>} params={fields} onClose={deselect} />`,
};

export default playground;
