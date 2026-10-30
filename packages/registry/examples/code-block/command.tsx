import { CodeBlockCommand } from '@/kvant';

export default function CodeBlockCommandExample() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <CodeBlockCommand command="npm i @norda/sdk" />
      <CodeBlockCommand command="npx kvant-ui add data-table" />
    </div>
  );
}
