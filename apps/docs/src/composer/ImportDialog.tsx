import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, Field, Textarea } from '@/kvant';
import type { ComposerNode } from './model';
import { parseImport } from './serialize';
import { MOD } from './Inspector';

const MAX_FILE = 2_000_000;

export interface ImportDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  onImport(root: ComposerNode): void;
}

/** A Playground document or a saved block, pasted or from a file; replaces the canvas (undo brings it back). */
export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = (source: string) => {
    try {
      onImport(parseImport(source));
      setText('');
      setError(undefined);
      onOpenChange(false);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Не удалось прочитать документ');
    }
  };

  const readFile = async (file: File) => {
    if (file.size > MAX_FILE) {
      setError('Файл больше 2 МБ — это не документ Playground');
      return;
    }
    try {
      submit(await file.text());
    } catch {
      setError('Не удалось прочитать файл');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogTitle>Импорт</DialogTitle>
        <DialogDescription>
          Документ Playground (вкладка «JSON») или блок из «Сохранить как блок». Холст заменится — вернуть прежний можно через {MOD}Z.
        </DialogDescription>
        <Field label="JSON" error={error}>
          <Textarea
            rows={8}
            value={text}
            onValueChange={(next) => {
              setText(next);
              setError(undefined);
            }}
            placeholder='{ "format": "kvant-composer", "version": 1, "root": … }'
            spellCheck={false}
            className="font-mono text-caption"
          />
        </Field>
        <DialogFooter>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void readFile(file);
            }}
          />
          <Button variant="secondary" leadingIcon={<Upload />} onClick={() => fileRef.current?.click()}>
            Выбрать файл
          </Button>
          <Button disabled={!text.trim()} onClick={() => submit(text)}>
            Открыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
