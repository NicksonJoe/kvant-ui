import { CodeBlock } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const code = `const deal = await norda.deals.update(id, {
  stage: "won",
  amount: 18400000,
});`;

const playground: Playground = {
  controls: [{ name: 'highlighted', type: 'boolean', default: false, description: 'Подсветить строки 2–3.' }],
  render: (p) => (
    <CodeBlock
      className="w-full max-w-xl"
      lineNumbers={p.bool('lineNumbers')}
      highlight={p.bool('highlighted') ? [2, 3] : []}
      files={[{ name: 'deal.ts', code }]}
    />
  ),
  code: (p) => `<CodeBlock${p.attrs(['lineNumbers'])}${p.bool('highlighted') ? ' highlight={[2, 3]}' : ''}
  files={[{ name: 'deal.ts', code: dealSource }]}
/>`,
};

export default playground;
