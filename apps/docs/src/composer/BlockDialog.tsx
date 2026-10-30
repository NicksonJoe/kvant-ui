import { BookmarkPlus, Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, Field, Input, Textarea, toast } from '@/kvant';
import { CodeBlock } from '../components/CodeBlock';
import { BLOCK_NAME, blockItem, blockSlug } from './codegen';
import { download } from './ExportPanel';
import type { SavedBlock } from './library';
import { CHILDREN, type ComposerNode } from './model';
import { toFile } from './serialize';

export interface BlockDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  root: ComposerNode;
  onSave(block: SavedBlock): void;
}

/** «Сохранить как блок»: a registry item `kvant add` installs, plus a copy in «Мои блоки». */
export function BlockDialog({ open, onOpenChange, root, onSave }: BlockDialogProps) {
  const [title, setTitle] = useState('Мой блок');
  const [name, setName] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const slug = name ?? blockSlug(title);
  const nameError = BLOCK_NAME.test(slug) ? undefined : 'Только латиница, цифры и дефис между ними';
  const titleError = title.trim() ? undefined : 'Назовите блок';
  const empty = (root.slots[CHILDREN]?.length ?? 0) === 0;
  const valid = !nameError && !titleError && !empty;
  const json = useMemo(
    () => (valid ? JSON.stringify(blockItem(root, { name: slug, title: title.trim(), description: description.trim() }), null, 2) : ''),
    [valid, root, slug, title, description],
  );

  const save = () => {
    onSave({ name: slug, title: title.trim(), description: description.trim(), file: toFile(root) });
    toast.add({ type: 'success', title: 'Блок сохранён', description: `«${title.trim()}» — в палитре, в разделе «Мои блоки».` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogTitle>Сохранить как блок</DialogTitle>
        <DialogDescription>
          Блок — элемент реестра Kvant: команда <code className="font-mono">kvant add</code> копирует его в проект вместе с нужными компонентами,
          а «Импорт» открывает обратно на холсте.
        </DialogDescription>
        <div className="flex flex-col gap-4">
          <Field label="Название" error={titleError}>
            <Input value={title} onValueChange={setTitle} />
          </Field>
          <Field label="Имя для kvant add" description="Файл блока: blocks/<имя>.tsx." error={nameError}>
            <Input value={slug} onValueChange={(next) => setName(next)} spellCheck={false} />
          </Field>
          <Field label="Описание" optional>
            <Textarea rows={2} value={description} onValueChange={setDescription} />
          </Field>
          {empty ? <p className="text-body-sm text-danger-soft-fg">Холст пуст — сначала соберите блок.</p> : null}
          {valid ? <CodeBlock lang="bash" code={`npx kvant-ui add ./${slug}.json`} title="Установка: сохраните JSON в корень проекта" /> : null}
        </div>
        <DialogFooter>
          <Button variant="secondary" leadingIcon={<Download />} disabled={!valid} onClick={() => download(`${slug}.json`, json)}>
            Скачать JSON
          </Button>
          <Button leadingIcon={<BookmarkPlus />} disabled={!valid} onClick={save}>
            В мои блоки
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
