import { Card, CardHeader } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <Card
      variant={p.pick('variant', ['raised', 'flat', 'outline', 'interactive'] as const)}
      padding={p.pick('padding', ['compact', 'default', 'spacious'] as const)}
      className="w-80 max-w-full"
    >
      <CardHeader title="Айдентика для пекарни" description="Пекарня «Хлебница» · до 30 октября" />
      <p className="text-body-sm text-fg-2">Логотип, упаковка и вывеска. Бюджет 1 284 900 ₽.</p>
    </Card>
  ),
  code: (p) => `<Card${p.attrs(['variant', 'padding'])}>
  <CardHeader title="Айдентика для пекарни" description="Пекарня «Хлебница» · до 30 октября" />
  <p className="text-body-sm text-fg-2">Логотип, упаковка и вывеска. Бюджет 1 284 900 ₽.</p>
</Card>`,
};

export default playground;
