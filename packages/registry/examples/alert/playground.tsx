import { Alert, Button } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { title: 'Тариф заканчивается через 3 дня' },
  controls: [
    { name: 'text', type: 'string', default: 'После 01.11.2026 отчёты будут доступны только для чтения.', description: 'Пояснение под заголовком.' },
    { name: 'action', type: 'boolean', default: true, description: 'Кнопка действия справа.' },
  ],
  render: (p) => (
    <Alert
      className="w-[480px] max-w-full"
      tone={p.pick('tone', ['accent', 'success', 'warning', 'danger', 'neutral'] as const)}
      variant={p.pick('variant', ['soft', 'outline'] as const)}
      title={p.text('title') || undefined}
      action={p.bool('action') ? <Button size="sm" variant="secondary">Продлить</Button> : undefined}
    >
      {p.text('text') || null}
    </Alert>
  ),
  code: (p) =>
    `<Alert${p.attrs(['tone', 'variant', 'title'])}${p.bool('action') ? ' action={<Button size="sm" variant="secondary">Продлить</Button>}' : ''}>
  ${p.text('text')}
</Alert>`,
};

export default playground;
