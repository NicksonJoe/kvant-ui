import { Plus, Wallet } from 'lucide-react';
import { Button, EmptyState } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { title: 'Сделок пока нет', description: 'Добавьте первую сделку — воронка соберётся сама.' },
  controls: [{ name: 'action', type: 'boolean', default: true, description: 'Кнопка действия.' }],
  render: (p) => (
    <EmptyState
      icon={<Wallet />}
      tone={p.pick('tone', ['neutral', 'danger', 'accent'] as const)}
      title={p.text('title')}
      description={p.text('description') || undefined}
      actions={
        p.bool('action') ? (
          <Button size="sm" leadingIcon={<Plus />}>
            Новая сделка
          </Button>
        ) : undefined
      }
    />
  ),
  code: (p) => `<EmptyState
  icon={<Wallet />}${p.attrs(['tone', 'title', 'description']).replace(/ (?=(tone|title|description)=)/g, '\n  ')}${
    p.bool('action') ? '\n  actions={<Button size="sm" leadingIcon={<Plus />}>Новая сделка</Button>}' : ''
  }
/>`,
};

export default playground;
