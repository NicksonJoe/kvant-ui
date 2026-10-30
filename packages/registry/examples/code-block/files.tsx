import { CodeBlock } from '@/kvant';

const deal = `import { createClient } from "@norda/sdk";

const norda = createClient({ token: process.env.NORDA_TOKEN });

export async function closeDeal(id: string) {
  const deal = await norda.deals.update(id, {
    stage: "won",
    closedAt: new Date(),
  });
  return deal.amount; // сумма в копейках
}`;

const test = `import { closeDeal } from "./deal";

test("закрывает сделку и возвращает сумму", async () => {
  const amount = await closeDeal("24-117");
  expect(amount).toBe(18400000);
});`;

export default function CodeBlockFiles() {
  return (
    <CodeBlock
      className="w-full max-w-2xl"
      highlight={[6, 7, 8, 9]}
      files={[
        { name: 'deal.ts', code: deal },
        { name: 'deal.test.ts', code: test },
      ]}
    />
  );
}
