import { Button, toast } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const types = ['success', 'warning', 'danger', 'info', 'loading'] as const;

const playground: Playground = {
  initial: { title: 'Сделка сохранена', description: 'Айдентика для пекарни' },
  render: (p) => (
    <Button
      variant="secondary"
      onClick={() =>
        toast.add({ type: p.pick('type', types), title: p.text('title'), description: p.text('description') || undefined })
      }
    >
      Показать уведомление
    </Button>
  ),
  code: (p) => {
    const fields = [`type: '${p.pick('type', types)}'`, `title: ${JSON.stringify(p.text('title'))}`];
    if (p.text('description')) fields.push(`description: ${JSON.stringify(p.text('description'))}`);
    return `<Button onClick={() => toast.add({ ${fields.join(', ')} })}>Показать уведомление</Button>`;
  },
};

export default playground;
